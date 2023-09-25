/// Utils
import { Plugin } from '../interfaces/plugin';
import url from 'url';
import path from 'path';

export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

export function getDirname(): string {
  return path.dirname(url.fileURLToPath(import.meta.url));
}
