/// Utils
import url from 'url';
import path from 'path';

export function getDirname(metaUrl?: string): string {
  return path.dirname(url.fileURLToPath(metaUrl ?? import.meta.url));
}

export function replaceWhitespaces(str: string): string {
  return typeof str === 'string' ? str.replace(/\s+/g, ' ') : str;
}
