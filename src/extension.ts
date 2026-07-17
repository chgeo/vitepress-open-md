import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { slugifyHeading } from './helpers';

const execFileAsync = promisify(execFile);

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

function toVitePressRootUrl(baseUrl: string, rootFolder: string): string {
  const normalizedRootFolder = rootFolder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return normalizedRootFolder ? `${normalizedBaseUrl}/${normalizedRootFolder}` : normalizedBaseUrl;
}

function buildVitePressUrl(filePath: string, rootFolder: string, baseUrl: string, anchor?: string): string | null {
  const route = toVitePressRoute(filePath, rootFolder);
  if (!route) return null;

  return `${baseUrl}${route}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}

function toVitePressRoute(filePath: string, rootFolder: string): string | null {
  const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!wsRoot) return null;

  const rel = path.relative(wsRoot, filePath);
  const normalizedRootFolder = rootFolder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  let noExt = rel
    .replace(/\\/g, '/')
    .replace(/@external[/\\]/i, '')
    .replace(/(\.fragment)?\.mdx?$/i, '');

  if (noExt === 'index') return '/';
  if (noExt.endsWith('/index')) noExt = noExt.slice(0, -('/index'.length));

  return '/' + normalizedRootFolder + '/' + noExt;
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

function toAppleScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function openInChromeTab(url: string, baseUrl: string, appName: string): Promise<boolean> {
  const app = toAppleScriptString(appName);
  const escapedUrl = toAppleScriptString(url);
  const escapedBaseUrl = toAppleScriptString(normalizeBaseUrl(baseUrl));

  const script = `
    tell application "${app}"
      activate
      set foundTab to false

      repeat with w in windows
        set tabCount to count of tabs of w
        repeat with i from 1 to tabCount
          set t to tab i of w
          set tabUrl to URL of t
          if tabUrl starts with "${escapedBaseUrl}" then
            set active tab index of w to i
            set index of w to 1
            set URL of t to "${escapedUrl}"
            set foundTab to true
            exit repeat
          end if
        end repeat
        if foundTab then exit repeat
      end repeat

      if not foundTab then
        if (count of windows) = 0 then
          make new window
        end if
        tell front window
          make new tab with properties {URL:"${escapedUrl}"}
          set active tab index to (count of tabs)
        end tell
      end if
    end tell
  `;

  try {
    await execFileAsync('osascript', ['-e', script]);
    return true;
  } catch {
    return false;
  }
}

async function openInSafariTab(url: string, baseUrl: string): Promise<boolean> {
  const escapedUrl = toAppleScriptString(url);
  const escapedBaseUrl = toAppleScriptString(normalizeBaseUrl(baseUrl));

  const script = `
    tell application "Safari"
      activate
      set foundTab to false

      repeat with w in windows
        set tabCount to count of tabs of w
        repeat with i from 1 to tabCount
          set t to tab i of w
          set tabUrl to URL of t
          if tabUrl starts with "${escapedBaseUrl}" then
            set current tab of w to t
            set index of w to 1
            set URL of t to "${escapedUrl}"
            set foundTab to true
            exit repeat
          end if
        end repeat
        if foundTab then exit repeat
      end repeat

      if not foundTab then
        if (count of windows) = 0 then
          make new document with properties {URL:"${escapedUrl}"}
        else
          tell front window
            set current tab to (make new tab with properties {URL:"${escapedUrl}"})
          end tell
        end if
      end if
    end tell
  `;

  try {
    await execFileAsync('osascript', ['-e', script]);
    return true;
  } catch {
    return false;
  }
}

async function openInBrowserWithReuse(url: string, baseUrl: string, browserApp: string): Promise<void> {
  if (process.platform === 'darwin') {
    const app = browserApp.trim().toLowerCase();

    if (app === 'safari') {
      const reused = await openInSafariTab(url, baseUrl);
      if (reused) return;
    } else {
      const chromeAppName = browserApp.trim() || 'Google Chrome';
      const reused = await openInChromeTab(url, baseUrl, chromeAppName);
      if (reused) return;
    }
  }

  await vscode.env.openExternal(vscode.Uri.parse(url));
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