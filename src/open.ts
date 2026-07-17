import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { normalizeBaseUrl } from './url';

const execFileAsync = promisify(execFile);

function toAppleScriptString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
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

export async function openInBrowserWithReuse(url: string, baseUrl: string, browserApp: string): Promise<void> {
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
