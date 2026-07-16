import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type Heading = {
  level: number;
  text: string;
};

function slugifyHeading(text: string): string {
  return text
  .trim()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/<[^>]*>|{[^}]*}/g, '')
  .replace(/&(?:[a-z][a-z0-9]+|#\d+|#x[\da-f]+);/gi, '')
  .replace(/&/g, '')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ß/g, 'ss')
  .replace(/[^a-z0-9\s-_]/g, '')
  .replace(/[\s_]/g, '-')
  .replace(/^-+|-+$/g, '')
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
  const disposable = vscode.commands.registerCommand('vitepressOpenCurrent.openCurrent', async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
    }

    const doc = editor.document;
    if (!doc.fileName.match(/\.mdx?$/i)) {
      vscode.window.showErrorMessage('Active file is not a Markdown file.');
      return;
    }

    const cfg = vscode.workspace.getConfiguration('vitepressOpenCurrent');
    const baseUrl = cfg.get<string>('baseUrl') ?? 'http://localhost:5173';
    const rootFolder = cfg.get<string>('rootFolder') ?? 'docs';
    const browserApp = cfg.get<string>('browserApp') ?? 'Google Chrome';

    const route = toVitePressRoute(doc.uri.fsPath, rootFolder);
    if (!route) {
      vscode.window.showErrorMessage(`File is not inside the configured root folder "${rootFolder}".`);
      return;
    }

    const heading = getCurrentSectionHeading(doc, editor.selection.active.line);
    const anchor = heading ? slugifyHeading(heading.text) : '';

    const url = `${baseUrl}${route}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
    await openInBrowserWithReuse(url, baseUrl, browserApp);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() { }