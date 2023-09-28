/// Utils
import url from 'url';
import path from 'path';

export function getDirname(): string {
  return path.dirname(url.fileURLToPath(import.meta.url));
}

export function replaceWhitespaces(str: string): string {
  return typeof str === 'string' ? str.replace(/\s+/g, ' ') : str;
}
