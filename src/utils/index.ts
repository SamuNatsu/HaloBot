/// Utils
import url from 'url';
import path from 'path';

export function getDirname(metaUrl?: string): string {
  return path.dirname(url.fileURLToPath(metaUrl ?? import.meta.url));
}

export function truncText(str: string): string {
  const tmp: string = str.replace(/\s+/g, ' ');
  return tmp.length < 256 ? tmp : tmp.slice(0, 256) + '...';
}

export function deepFreezeObject(obj: any): void {
  Object.getOwnPropertyNames(obj).forEach((value: string): void => {
    if (typeof obj[value] === 'object' && obj[value] !== null) {
      deepFreezeObject(obj[value]);
    }
  });
  Object.freeze(obj);
}
