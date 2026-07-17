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
