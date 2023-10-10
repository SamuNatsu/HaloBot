/// Plugin manager model
import fs from 'fs';
import knex from 'knex';
import path from 'path';
import { InjectedPlugin } from '../interfaces/Plugin';
import { getDirname } from '../utils';
import { Logger } from './Logger';
import { schema } from '../schemas/Plugin';
import { API } from './API';
import { EventDispatcher } from './EventDispatcher';

/* Export class */
export class PluginManager {
  /* Properties */
  private logger: Logger = new Logger('插件管理器');
  private plugins: InjectedPlugin[] = [];

  /* Methods */
  public async loadPlugins(): Promise<void> {
    this.logger.debug('正在加载插件列表');

    // Check plugin directory
    const dirname: string = getDirname();
    const pluginDir: string = path.join(dirname, './plugins');
    if (!fs.existsSync(pluginDir)) {
      this.logger.warn(`插件目录不存在，正在创建目录: ${pluginDir}`);
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    // For each entry in plugin folder
    const pluginEntries: string[] = [];
    fs.readdirSync(pluginDir).forEach((value: string): void => {
      // Skip ignored plugin
      if (value.startsWith('_')) {
        return;
      }

      // Check directory
      const p: string = path.join(pluginDir, value);
      const s: fs.Stats = fs.statSync(p);
      if (!s.isDirectory()) {
        return;
      }

      // Check plugin entry
      const pm: string = path.join(p, 'index.js');
      const sm: fs.Stats = fs.statSync(pm);
      if (!sm.isFile()) {
        return;
      }
      pluginEntries.push(pm);
    });

    // For each plugin entry
    for (const i of pluginEntries) {
      try {
        // Try to read entry script
        const plugin: InjectedPlugin = (await import('file://' + i)).default;
        const { error } = schema.validate(plugin);
        if (error !== undefined) {
          throw error;
        }

        // Inject properties into plugin
        Object.defineProperties(plugin, {
          api: {
            value: new API(plugin.meta.namespace),
            writable: false,
            configurable: false
          },
          currentPluginDir: {
            value: path.dirname(i),
            writable: false,
            configurable: false
          },
          db: {
            value: knex({
              client: 'better-sqlite3',
              useNullAsDefault: true,
              connection: {
                filename: path.join(path.dirname(i), './plugin.db')
              }
            }),
            writable: false,
            configurable: false
          },
          logger: {
            value: new Logger('插件:' + plugin.meta.name),
            writable: false,
            configurable: false
          }
        });

        // Save plugin
        this.plugins.push(plugin);
        this.logger.trace(
          `找到插件 ${plugin.meta.name}[${plugin.meta.namespace}]`
        );
      } catch (err: unknown) {
        this.logger.error(`无法加载插件: ${i}`, err);
      }
    }

    // Sort plugin
    this.logger.debug('正在按照优先级排序插件');
    this.plugins.sort(
      (a: InjectedPlugin, b: InjectedPlugin): number =>
        a.meta.priority - b.meta.priority
    );
  }
  public async startPlugins(): Promise<void> {
    for (const i of this.plugins) {
      try {
        this.logger.info(`正在启动插件: ${i.meta.name}[${i.meta.namespace}]`);

        if (i.onStart !== undefined) {
          await i.onStart();
        }
        EventDispatcher.getInstance().register(i);
      } catch (err: unknown) {
        this.logger.error(
          `插件 ${i.meta.name}[${i.meta.namespace}] 启动出错`,
          err
        );
      }
    }
  }
  public async stopPlugins(): Promise<void> {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      const plugin: InjectedPlugin = this.plugins[i];

      try {
        this.logger.info(
          `正在停止插件: ${plugin.meta.name}[${plugin.meta.namespace}]`
        );

        if (plugin.onStop !== undefined) {
          await plugin.onStop();
        }
      } catch (err: unknown) {
        this.logger.error(
          `插件 ${plugin.meta.name}[${plugin.meta.namespace}] 停止出错`,
          err
        );
      }
    }

    EventDispatcher.getInstance().clear();
  }
  public getPluginMetas(): InjectedPlugin['meta'][] {
    return this.plugins.map(
      (value: InjectedPlugin): InjectedPlugin['meta'] => value.meta
    );
  }

  /* Singleton */
  private static instance?: PluginManager;
  private constructor() {}
  public static getInstance() {
    if (PluginManager.instance === undefined) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
}
