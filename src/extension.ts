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
  vsCodeCompatibleSlugs: boolean;
  enableCodeLens: boolean;
};

function getVitePressSettings(): VitePressSettings {
  const cfg = vscode.workspace.getConfiguration('vitepressMd');
  return {
    baseUrl: cfg.get<string>('baseUrl') ?? 'http://localhost:5173',
    rootFolder: cfg.get<string>('rootFolder') ?? 'docs',
    browserApp: cfg.get<string>('browserApp') ?? 'Google Chrome',
    vsCodeCompatibleSlugs: cfg.get<boolean>('vsCodeCompatibleSlugs') ?? false,
    enableCodeLens: cfg.get<boolean>('enableCodeLens') ?? false,
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

  public refresh(): void {
    this.onDidChangeCodeLensesEmitter.fire();
  }

  public dispose(): void {
    this.onDidChangeCodeLensesEmitter.dispose();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];

    if (!getVitePressSettings().enableCodeLens) {
      return codeLenses;
    }

    for (let line = 0; line < document.lineCount; line++) {
      const heading = parseHeadingLine(document.lineAt(line).text);
      if (!heading) continue;

      codeLenses.push(
        new vscode.CodeLens(new vscode.Range(line, 0, line, 0), {
          title: 'Open in VitePress',
          tooltip: this.actionTooltip,
          command: 'vitepressMd.openCurrent',
          arguments: [document.uri, line],
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

function isMarkdownPath(filePath: string): boolean {
  return /\.mdx?$/i.test(filePath);
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('vitepressMd.openCurrent', async (uriArg?: vscode.Uri, lineArg?: number) => {
    const settings = getVitePressSettings();
    const editor = vscode.window.activeTextEditor;

    const resourceUri = uriArg ?? editor?.document.uri;
    if (!resourceUri || !isMarkdownPath(resourceUri.fsPath)) {
      return;
    }

    const isActiveDoc = !!editor && editor.document.uri.fsPath === resourceUri.fsPath;
    const doc = isActiveDoc ? editor.document : undefined;
    const cursorLine = editor?.selection.active.line ?? 0;
    const heading = doc
      ? (typeof lineArg === 'number'
        ? parseHeadingLine(doc.lineAt(lineArg).text)
        : getCurrentSectionHeading(doc, cursorLine))
      : null;
    const anchor = heading ? slugifyHeading(heading.text, settings.vsCodeCompatibleSlugs) : '';

    const url = buildVitePressUrl(resourceUri.fsPath, settings.rootFolder, settings.baseUrl, anchor);
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
    if (event.affectsConfiguration('vitepressMd.enableCodeLens')) {
      headingCodeLensProvider.refresh();
    }
  });

  context.subscriptions.push(disposable, codeLensProvider, configListener, headingCodeLensProvider);
}

export function deactivate() { }