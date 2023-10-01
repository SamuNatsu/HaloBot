/// Utils
import url from 'url';
import path from 'path';

export function getDirname(metaUrl?: string): string {
  return path.dirname(url.fileURLToPath(metaUrl ?? import.meta.url));
}

export function replaceWhitespaces(str: string): string {
  return typeof str === 'string' ? str.replace(/\s+/g, ' ') : str;
}

export function overflowTrunc(str: string): string {
  if (typeof str !== 'string' || str.length < 64) {
    return str;
  }
  return str.slice(0, 256) + '...';
}

export function deepFreezeObject(obj: any): void {
  Object.getOwnPropertyNames(obj).forEach((value: string): void => {
    if (typeof obj[value] === 'object' && obj[value] !== null) {
      deepFreezeObject(obj[value]);
    }
  });
  Object.freeze(obj);
}
