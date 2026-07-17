import * as path from 'path';

function getWorkspaceRoot(): string | null {
  try {
    const vscode = require('vscode') as typeof import('vscode');
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
  } catch {
    return null;
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function toVitePressRoute(filePath: string, rootFolder: string): string | null {
  const wsRoot = getWorkspaceRoot();
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

export function toVitePressRootUrl(baseUrl: string, rootFolder: string): string {
  const normalizedRootFolder = rootFolder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return normalizedRootFolder ? `${normalizedBaseUrl}/${normalizedRootFolder}` : normalizedBaseUrl;
}

export function buildVitePressUrl(filePath: string, rootFolder: string, baseUrl: string, anchor?: string): string | null {
  const route = toVitePressRoute(filePath, rootFolder);
  if (!route) return null;

  return `${baseUrl}${route}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}

export function slugifyHeading(text: string): string {
  const explicitIdMatch = text.match(/\{#([^}\s]+)\}/);
  const source = explicitIdMatch ? explicitIdMatch[1] : text;

  return source
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
    .replace(/^-+|-+$/g, '');
}
