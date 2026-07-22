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

export function slugifyHeadingVsCodeCompatible(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

export function slugifyHeading(text: string, useVsCodeCompatibleSlug = false): string {
  if (useVsCodeCompatibleSlug) {
    return slugifyHeadingVsCodeCompatible(text);
  }

  // Match explicit markdown IDs like {#my-anchor} or { #my-anchor }.
  const explicitIdMatch = text.match(/\{\s*#([^}\s]+)\s*\}/);
  if (explicitIdMatch) {
    return explicitIdMatch[1]
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      // Remove combining accent marks produced by Unicode normalization.
      .replace(/[\u0300-\u036f]/g, '')
      // Transliterate German sharp s to plain ASCII.
      .replace(/ß/g, 'ss')
      // Keep only slug-safe characters for explicit IDs.
      .replace(/[^a-z0-9._-]/g, '')
      // Trim hyphens from the start and end of the explicit ID.
      .replace(/^-+|-+$/g, '');
  }

  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    // Strip markdown emphasis delimiters so italicized terms like _.env_ do not become double hyphens.
    .replace(/(^|[^a-z0-9])([*_]{1,2})(?=\S)(.+?)(?<=\S)\2(?=$|[^a-z0-9])/g, '$1$3')
    // Remove markdown code-span backticks while keeping the enclosed text.
    .replace(/`+/g, '')
    // Drop trailing markdown attribute blocks like {.class} or {#id}.
    .replace(/{[^}]*}/g, '')
    // Unescape literal angle-bracket placeholders like \<srv\>.
    .replace(/\\<([^>]+)\\>/g, '$1')
    // Remove named and numeric HTML entities.
    .replace(/&(?:[a-z][a-z0-9]+|#\d+|#x[\da-f]+);/gi, '')
    // Drop any remaining ampersands that were not part of an entity.
    .replace(/&/g, '')
    // Remove combining accent marks produced by Unicode normalization.
    .replace(/[\u0300-\u036f]/g, '')
    // Transliterate German sharp s to plain ASCII.
    .replace(/ß/g, 'ss')
    // Convert dots before HTML-tagged placeholders into slug separators.
    .replace(/(?<=[a-z0-9-])\.(?:<[^>]*>)+(?=[a-z0-9])/g, '-')
    // Convert dots after closing HTML tags into slug separators.
    .replace(/((?:<\/[^>]*>)+)\.(?=[a-z0-9])/g, '$1-')
    // Convert interior dots between alphanumeric segments into hyphens.
    .replace(/(?<=[a-z0-9-])\.(?=[a-z0-9])/g, '-')
    // Remove any remaining HTML tags after separator normalization is done.
    .replace(/<[^>]*>/g, '')
    // Remove unsupported punctuation while keeping spaces, underscores, and hyphens for the next pass.
    .replace(/[^a-z0-9\s_-]/g, '')
    // Normalize spaces and underscores to hyphens.
    .replace(/[\s_]/g, '-')
    // Trim hyphens from the start and end of the final slug.
    .replace(/^-+|-+$/g, '');
}
