/// Bot module
import { Plugin, schema } from './models/plugin';
import { join } from 'path';

/* Export class */
export class HaloBot {
  /* Properties */
  private pluginList: Plugin[] = [];

  /* Constructor */
  constructor() {

  }

  /* Plugin */
  private async loadPlugins(list: string[]): Promise<void> {
    const pluginDir: string = join(process.cwd(), './plugins');

    for (const i of list) {
      const plugin: any = await import(join(pluginDir, `./{i}/index.js`));
      const { error } = schema.validate(plugin.default);
      if (error !== undefined) {
        throw error;
      }

      this.pluginList.push(plugin.default);
    }
    this.pluginList.sort(
      (a: Plugin, b: Plugin): number => a.meta.priority - b.meta.priority
    );
  }
  private startPlugins(): void {
    for (const i of this.pluginList) {
      if (i.onStart !== undefined) {
        
      }
    }
  }
}
