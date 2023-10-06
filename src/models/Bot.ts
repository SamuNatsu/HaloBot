/// Bot model
import path from 'path';
import fs from 'fs';
import { Config } from '../interfaces/Config';
import YAML from 'yaml';
import { Adaptor } from './adaptors/Adaptor';
import { AdaptorForwardWebSocket } from './adaptors/AdaptorForwardWebSocket';
import { deepFreezeObject, getDirname } from '../utils';
import { Logger } from './Logger';
import { schema as configSchema } from '../schemas/Config';
import { EventDispatcher } from './EventDispatcher';
import { AdaptorNone } from './adaptors/AdaptorNone';
import { AdaptorFake } from './adaptors/AdaptorFake';
import { AdaptorReverseWebSocket } from './adaptors/AdaptorReverseWebSocket';
import { PluginManager } from './PluginManager';

/* Export class */
export class Bot {
  /* Properties */
  private logger: Logger = new Logger('HaloBot');

  public readonly config: Config;

  /* Constructor */
  private constructor(config: Config) {
    this.config = config;
  }
  public static async create(): Promise<Bot> {
    // Read config
    const dirname: string = getDirname();
    const rawCfg: string = fs.readFileSync(
      path.join(dirname, 'config.yaml'),
      'utf-8'
    );
    const config: Config = YAML.parse(rawCfg);
    const { error } = configSchema.validate(config);
    if (error !== undefined) {
      throw error;
    }
    deepFreezeObject(config);

    // Create adaptor
    switch (config.connection.type) {
      case 'none':
        await AdaptorNone.create();
        break;
      case 'http':
        /** TODO */
        throw new Error();
      case 'websocket':
        if (config.connection.config?.ws_type === 'forward') {
          await AdaptorForwardWebSocket.create(
            config.connection.config?.ws_forward as string
          );
        } else {
          await AdaptorReverseWebSocket.create(
            config.connection.config?.ws_reverse_port as number,
            config.connection.config?.ws_reverse_path
          );
        }
        break;
      case 'fake':
        await AdaptorFake.create(
          config.connection.config?.fake_reverse_port as number,
          config.connection.config?.fake_reverse_path
        );
        break;
    }

    // Create instance
    const ret: Bot = new Bot(config);
    const dispatcher: EventDispatcher = EventDispatcher.getInstance();

    // Bind message handler
    Adaptor.getInstance().messageHandler = dispatcher.dispatch.bind(dispatcher);
    return ret;
  }

  /* Methods */
  public async start(): Promise<void> {
    this.logger.info('正在启动 HaloBot');

    await PluginManager.getInstance().loadPlugins();
    await PluginManager.getInstance().startPlugins();

    this.logger.info('正在启动事件监听');
    setInterval((): void => {}, 5000);
  }
  public async stop(): Promise<void> {
    this.logger.info('正在停止 HaloBot');

    await PluginManager.getInstance().stopPlugins();

    process.exit(0);
  }
}
