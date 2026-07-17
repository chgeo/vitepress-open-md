import * as vscode from 'vscode';
import { buildVitePressUrl, slugifyHeading, toVitePressRootUrl } from './url';
import { openInBrowserWithReuse } from './open';

type Heading = {
  level: number;
  text: string;
};

type VitePressSettings = {
  baseUrl: string;
  rootFolder: string;
  browserApp: string;
};

function getVitePressSettings(): VitePressSettings {
  const cfg = vscode.workspace.getConfiguration('vitepressMd');
  return {
    baseUrl: cfg.get<string>('baseUrl') ?? 'http://localhost:5173',
    rootFolder: cfg.get<string>('rootFolder') ?? 'docs',
    browserApp: cfg.get<string>('browserApp') ?? 'Google Chrome',
  };
}

function parseHeadingLine(line: string): Heading | null {
  const match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (!match) return null;

  return {
    level: match[1].length,
    text: match[2].trim(),
  };
}

class HeadingCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;
  private actionTooltip = 'Open in VitePress';

  constructor() {
    this.updateTooltipFromConfig();
  }

  public updateTooltipFromConfig(): void {
    const settings = getVitePressSettings();
    const rootUrl = toVitePressRootUrl(settings.baseUrl, settings.rootFolder);

    this.actionTooltip = `Open as ${rootUrl}/…`;
    this.onDidChangeCodeLensesEmitter.fire();
  }

  public dispose(): void {
    this.onDidChangeCodeLensesEmitter.dispose();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    for (let line = 0; line < document.lineCount; line++) {
      const heading = parseHeadingLine(document.lineAt(line).text);
      if (!heading) continue;

      codeLenses.push(
        new vscode.CodeLens(new vscode.Range(line, 0, line, 0), {
          title: 'Open in VitePress',
          tooltip: this.actionTooltip,
          command: 'vitepressMd.openCurrent',
          arguments: [line],
        })
      );
    }

    return codeLenses;
  }
}

function getCurrentSectionHeading(doc: vscode.TextDocument, cursorLine: number): Heading | null {
  let current: Heading | null = null;

  for (let i = 0; i <= cursorLine; i++) {
    const line = doc.lineAt(i).text;
    const heading = parseHeadingLine(line);
    if (!heading) continue;

    while (current && heading.level <= current.level) {
      current = null;
      break;
    }

    current = heading;
  }

  return current;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('vitepressMd.openCurrent', async (headingLine?: number) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const doc = editor.document;
    if (doc.languageId !== 'markdown' && doc.languageId !== 'mdx') {
      return;
    }

    const settings = getVitePressSettings();

    const heading = typeof headingLine === 'number'
      ? parseHeadingLine(doc.lineAt(headingLine).text)
      : getCurrentSectionHeading(doc, editor.selection.active.line);
    const anchor = heading ? slugifyHeading(heading.text) : '';

    const url = buildVitePressUrl(doc.uri.fsPath, settings.rootFolder, settings.baseUrl, anchor);
    if (!url) {
      vscode.window.showErrorMessage(`File is not inside the configured root folder "${settings.rootFolder}".`);
      return;
    }

    await openInBrowserWithReuse(url, settings.baseUrl, settings.browserApp);
  });

  const headingCodeLensProvider = new HeadingCodeLensProvider();

  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    [{ language: 'markdown' }, { language: 'mdx' }],
    headingCodeLensProvider
  );

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('vitepressMd.baseUrl') || event.affectsConfiguration('vitepressMd.rootFolder')) {
      headingCodeLensProvider.updateTooltipFromConfig();
    }
  });

  context.subscriptions.push(disposable, codeLensProvider, configListener, headingCodeLensProvider);
}

export function deactivate() { }