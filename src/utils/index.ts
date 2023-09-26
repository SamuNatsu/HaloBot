/// Utils
import url from 'url';
import path from 'path';

export function getDirname(): string {
  return path.dirname(url.fileURLToPath(import.meta.url));
}
