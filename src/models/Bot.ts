/// Bot model
import {
  ForwardMessage,
  ForwardMessageInfo,
  FriendInfo,
  GroupAtAllRemain,
  GroupEssenceMsg,
  GroupFileFolderInfo,
  GroupFileSystemInfo,
  GroupHonorInfo,
  GroupInfo,
  GroupMemberInfo,
  GroupNotice,
  GroupSystemMsg,
  ImageFileInfo,
  ImageOcrData,
  LoginInfo,
  ModelShowInfo,
  MsgInfo,
  OnlineClientInfo,
  SafelyLevel,
  Status,
  StrangerInfo,
  UnidirectionalFriendInfo,
  VersionInfo
} from '../interfaces/api_return';
import path from 'path';
import fs from 'fs';
import { Config } from '../interfaces/Config';
import YAML from 'yaml';
import { ActionError, Adaptor } from './Adaptor';
import { ForwardWebSocketAdaptor } from './ForwardWebSocketAdaptor';
import { getDirname, replaceWhitespaces } from '../utils';
import { Logger } from './Logger';
import { schema as configSchema } from '../schemas/Config';
import { EventDispatcher } from './EventDispatcher';
import { CallCustomEvent } from '../interfaces/custom_event';
import { InjectedPlugin } from '../interfaces/Plugin';
import { schema as pluginSchema } from '../schemas/Plugin';
import JB from 'json-bigint';
import knex, { Knex } from 'knex';
import { GroupMessageEvent } from '../interfaces/message_event';

/* Special JSON */
const JSONbig = JB({ useNativeBigInt: true, alwaysParseAsBig: true });

/* Export class */
export class Bot {
  /* Properties */
  private adaptor: Adaptor;
  private dispatcher: EventDispatcher = new EventDispatcher();
  private logger: Logger = new Logger('HaloBot');
  private watchdog?: NodeJS.Timeout;

  public readonly config: Config;

  /* Constructor */
  private constructor(config: Config, adaptor: Adaptor) {
    this.config = config;
    this.adaptor = adaptor;
  }
  public static async create(): Promise<Bot> {
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

    let adaptor: Adaptor;
    switch (config.connection.type) {
      case 'forward-http':
      case 'reverse-http':
      case 'forward-ws':
      case 'reverse-ws':
        adaptor = await ForwardWebSocketAdaptor.create(
          config.connection.url as string
        );
        break;
      case 'dry-run':
        adaptor = await Adaptor.create();
        break;
    }

    const ret: Bot = new Bot(config, adaptor);
    adaptor.messageHandler = ret.dispatcher.dispatch.bind(ret.dispatcher);
    await ret.loadPlugins();
    Object.seal(ret);

    ret.logger.info('HaloBot 实例化成功');
    return ret;
  }

  /* Plugins */
  private plugins: InjectedPlugin[] = [];
  private async loadPlugins(): Promise<void> {
    this.logger.debug('正在加载插件列表');

    const dirname: string = getDirname();
    const pluginDir: string = path.join(dirname, './plugins');
    if (!fs.existsSync(pluginDir)) {
      this.logger.warn(`插件目录不存在，正在创建目录: ${pluginDir}`);
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const pluginEntries: string[] = [];
    fs.readdirSync(pluginDir).forEach((value: string): void => {
      if (value.startsWith('_')) {
        return;
      }

      const p: string = path.join(pluginDir, value);
      const s: fs.Stats = fs.statSync(p);
      if (!s.isDirectory()) {
        return;
      }

      const pm: string = path.join(p, 'index.js');
      const sm: fs.Stats = fs.statSync(pm);
      if (!sm.isFile()) {
        return;
      }
      pluginEntries.push(pm);
    });

    for (const i of pluginEntries) {
      try {
        const plugin: InjectedPlugin = (await import('file://' + i)).default;
        const { error } = pluginSchema.validate(plugin);
        if (error !== undefined) {
          throw error;
        }

        Object.defineProperties(plugin, {
          bot: {
            value: this,
            writable: false,
            configurable: false
          },
          logger: {
            value: new Logger(plugin.meta.name),
            writable: false,
            configurable: false
          },
          currentPluginDir: {
            value: path.dirname(i),
            writable: false,
            configurable: false
          }
        });

        this.plugins.push(plugin);
        this.logger.trace(
          `找到插件 ${plugin.meta.name}[${plugin.meta.namespace}]`
        );
      } catch (err: unknown) {
        this.logger.error(`无法加载插件: ${i}`, err);
      }
    }

    this.logger.debug('正在按照优先级排序插件');
    this.plugins.sort(
      (a: InjectedPlugin, b: InjectedPlugin): number =>
        a.meta.priority - b.meta.priority
    );
  }
  private async startPlugins(): Promise<void> {
    this.logger.info('正在启动插件');
    for (const i of this.plugins) {
      try {
        if (i.onStart !== undefined) {
          await i.onStart();
        }
        this.dispatcher.register(i);
        this.logger.info(`插件 ${i.meta.name}[${i.meta.namespace}] 已启动`);
      } catch (err: unknown) {
        this.logger.error(
          `插件 ${i.meta.name}[${i.meta.namespace}] 启动出错`,
          err
        );
      }
    }
  }
  private async stopPlugins(): Promise<void> {
    this.logger.info('正在停止插件');
    for (const i of this.plugins) {
      try {
        if (i.onStop !== undefined) {
          await i.onStop();
        }
        this.logger.info(`插件 ${i.meta.name}[${i.meta.namespace}] 已停止`);
      } catch (err: unknown) {
        this.logger.error(
          `插件 ${i.meta.name}[${i.meta.namespace}] 停止出错`,
          err
        );
      }
    }
  }

  /* Control */
  public async start(): Promise<void> {
    if (this.watchdog !== undefined) {
      throw new Error('HaloBot 已启动');
    }

    this.logger.info('正在启动 HaloBot');

    await this.startPlugins();
    this.watchdog = setInterval((): void => {}, 5000);

    this.logger.info('HaloBot 已启动');
  }
  public async stop(): Promise<void> {
    if (this.watchdog === undefined) {
      throw new Error('HaloBot 未启动');
    }

    this.logger.info('正在停止 HaloBot');

    await this.stopPlugins();
    clearInterval(this.watchdog);
    this.watchdog = undefined;

    this.logger.info('HaloBot 已停止');
    process.exit(0);
  }

  /* HaloBot utils API */
  public get utils() {
    return {
      readJsonFile: (path: string, intAsBigInt: boolean = false): any => {
        const raw: string = fs.readFileSync(path, 'utf-8');
        return intAsBigInt ? JSONbig.parse(raw) : JSON.parse(raw);
      },
      saveJsonFile: (
        path: string,
        data: any,
        prettify: boolean = false
      ): void => {
        fs.writeFileSync(
          path,
          JSONbig.stringify(data, undefined, prettify ? 2 : undefined)
        );
      },
      readYamlFile: (path: string, intAsBigInt: boolean = false): any => {
        const raw: string = fs.readFileSync(path, 'utf-8');
        return intAsBigInt ? YAML.parse(raw, { intAsBigInt }) : YAML.parse(raw);
      },
      saveYamlFile: (path: string, data: any): void => {
        fs.writeFileSync(path, YAML.stringify(data));
      },
      openDB: (options: Knex.Config): Knex => {
        this.logger.info('用户请求打开数据库', options);
        return knex(options);
      },
      openCurrentPluginDB: (metaUrl: string): Knex => {
        this.logger.info('用户请求打开本地插件数据库');
        return knex({
          client: 'better-sqlite3',
          useNullAsDefault: true,
          connection: {
            filename: path.join(getDirname(metaUrl), './plugin.db')
          }
        });
      }
    };
  }

  /* Halo debug API */
  public get debug() {
    return {
      pushEvent: (ev: any): void => {
        this.logger.debug('用户推送了一个自定义事件', ev);
        this.dispatcher.dispatch(ev);
      },
      getPluginMetas: (): InjectedPlugin['meta'][] => {
        this.logger.debug('用户请求插件元信息表');
        return this.plugins.map(
          (value: InjectedPlugin): InjectedPlugin['meta'] => value.meta
        );
      },
      restartBot: async (): Promise<void> => {
        this.logger.debug('用户请求重启 HaloBot');
        await this.stopPlugins();
        process.exit(128);
      },
      restartPlugins: async (): Promise<void> => {
        this.logger.debug('用户请求重启插件');
        await this.stopPlugins();
        await this.startPlugins();
      }
    };
  }

  /* Halo APIs */
  public callPluginMethod(
    method_name: string,
    params: any,
    target?: string
  ): Promise<any> {
    return new Promise<any>(
      (resolve: (value: any) => void, reject: (reason?: any) => void): void => {
        this.dispatcher.dispatch(<CallCustomEvent>{
          time: BigInt(Math.floor(Date.now() / 1000)),
          post_type: 'custom_event',
          custom_event_type: 'call',
          target,
          method_name,
          params,
          resolve,
          reject
        });
      }
    );
  }

  /* Account APIs */
  public async getLoginInfo(): Promise<LoginInfo> {
    return (await this.adaptor.send('get_login_info')).data;
  }
  public async setQqProfile(
    nickname: string,
    company: string,
    email: string,
    college: string,
    personal_note: string
  ): Promise<void> {
    await this.adaptor.send('set_qq_profile', {
      nickname,
      company,
      email,
      college,
      personal_note
    });
  }
  public async qidianGetAccountInfo(): Promise<any> {
    return (await this.adaptor.send('qidian_get_account_info')).data;
  }
  public async getModelShow(model: string): Promise<ModelShowInfo[]> {
    return (await this.adaptor.send('_get_model_show', { model })).data
      .variants;
  }
  public async setModelShow(model: string, model_show: string): Promise<void> {
    await this.adaptor.send('_set_model_show', { model, model_show });
  }
  public async getOnlineClients(
    no_cache?: boolean
  ): Promise<OnlineClientInfo[]> {
    return (await this.adaptor.send('get_online_clients', { no_cache })).data
      .clients;
  }

  /* Friend info APIs */
  public async getStrangerInfo(
    user_id: bigint,
    no_cache?: boolean
  ): Promise<StrangerInfo> {
    return (await this.adaptor.send('get_stranger_info', { user_id, no_cache }))
      .data;
  }
  public async getFriendList(): Promise<FriendInfo[]> {
    return (await this.adaptor.send('get_friend_list')).data;
  }
  public async getUnidirectionalFirendList(): Promise<UnidirectionalFriendInfo> {
    return (await this.adaptor.send('get_unidirectional_friend_list')).data;
  }

  /* Friend operation APIs */
  public async deleteFriend(user_id: bigint): Promise<void> {
    await this.adaptor.send('delete_friend', { user_id });
  }
  public async deleteUnidirectionalFriend(user_id: bigint): Promise<void> {
    await this.adaptor.send('delete_unidirectional_friend', { user_id });
  }

  /* Message APIs */
  public async sendPrivateMsg(
    user_id: bigint,
    message: string,
    auto_escape?: boolean,
    group_id?: bigint
  ): Promise<bigint> {
    if (group_id === undefined) {
      this.logger.info(
        `向 [${user_id}] 发送了消息`,
        replaceWhitespaces(message)
      );
    } else {
      this.logger.info(
        `向群 [${group_id}] 内 [${user_id}] 发送了消息`,
        replaceWhitespaces(message)
      );
    }
    return (
      await this.adaptor.send('send_private_msg', {
        user_id,
        message,
        auto_escape,
        group_id
      })
    ).data.message_id;
  }
  public async sendGroupMsg(
    group_id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    this.logger.info(
      `向群 [${group_id}] 发送了消息`,
      replaceWhitespaces(message)
    );
    return (
      await this.adaptor.send('send_group_msg', {
        group_id,
        message,
        auto_escape
      })
    ).data.message_id;
  }
  public async sendMsg(
    message_type: 'private' | 'group',
    id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    if (message_type === 'private') {
      this.logger.info(`向 [${id}] 发送了消息`, replaceWhitespaces(message));
    } else {
      this.logger.info(`向群 [${id}] 发送了消息`, replaceWhitespaces(message));
    }
    return (
      await this.adaptor.send('send_msg', {
        message_type,
        user_id: message_type === 'private' ? id : undefined,
        group_id: message_type === 'group' ? id : undefined,
        message,
        auto_escape
      })
    ).data.message_id;
  }
  public async getMsg(message_id: bigint): Promise<MsgInfo> {
    return (await this.adaptor.send('get_msg', { message_id })).data;
  }
  public async deleteMsg(message_id: bigint): Promise<void> {
    await this.adaptor.send('delete_msg', { message_id });
  }
  public async markMsgAsRead(message_id: bigint): Promise<void> {
    await this.adaptor.send('mark_msg_as_read', { message_id });
  }
  public async getForwardMsg(message_id: bigint): Promise<ForwardMessage[]> {
    return (await this.adaptor.send('get_forward_msg', { message_id })).data
      .messages;
  }
  public async sendGroupForwardMsg(
    group_id: bigint,
    messages: any
  ): Promise<ForwardMessageInfo> {
    return (
      await this.adaptor.send('send_group_forward_msg', { group_id, messages })
    ).data;
  }
  public async sendPrivateForwardMsg(
    user_id: bigint,
    messages: any
  ): Promise<ForwardMessageInfo> {
    return (
      await this.adaptor.send('send_private_forward_msg', { user_id, messages })
    ).data;
  }
  public async getGroupMsgHistory(
    group_id: bigint,
    message_seq?: bigint
  ): Promise<GroupMessageEvent[]> {
    return (
      await this.adaptor.send('get_group_msg_history', {
        group_id,
        message_seq
      })
    ).data.messages;
  }

  /* Image APIs */
  public async getImage(file: string): Promise<ImageFileInfo> {
    return (await this.adaptor.send('get_image', { file })).data;
  }
  public async canSendImage(): Promise<boolean> {
    return (await this.adaptor.send('can_send_image')).data.yes;
  }
  public async ocrImage(image: string): Promise<ImageOcrData> {
    return (await this.adaptor.send('ocr_image', { image })).data;
  }

  /* Record APIs */
  public async getRecord(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async canSendRecord(): Promise<boolean> {
    return (await this.adaptor.send('can_send_record')).data.yes;
  }

  /* Handling APIs */
  public async setFriendAddRequest(
    flag: string,
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    await this.adaptor.send('set_friend_add_request', {
      flag,
      approve,
      remark
    });
  }
  public async setGroupAddRequest(
    flag: string,
    type: 'add' | 'invite',
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    await this.adaptor.send('set_group_add_request', {
      flag,
      type,
      approve,
      remark
    });
  }

  /* Group info APIs */
  public async getGroupInfo(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<GroupInfo> {
    return (await this.adaptor.send('get_group_info', { group_id, no_cache }))
      .data;
  }
  public async getGroupList(no_cache?: boolean): Promise<GroupInfo[]> {
    return (await this.adaptor.send('get_group_list', { no_cache })).data;
  }
  public async getGroupMemberInfo(
    group_id: bigint,
    user_id: bigint,
    no_cache?: boolean
  ): Promise<GroupMemberInfo> {
    return (
      await this.adaptor.send('get_group_member_info', {
        group_id,
        user_id,
        no_cache
      })
    ).data;
  }
  public async getGroupMemberList(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<Partial<GroupMemberInfo>[]> {
    return (
      await this.adaptor.send('get_group_member_list', { group_id, no_cache })
    ).data;
  }
  public async getGroupHonorInfo(
    group_id: bigint,
    type:
      | 'talkative'
      | 'performer'
      | 'legend'
      | 'strong_newbie'
      | 'emotion'
      | 'all'
  ): Promise<GroupHonorInfo> {
    return (await this.adaptor.send('get_group_honor_info', { group_id, type }))
      .data;
  }
  public async getGroupSystemMsg(): Promise<GroupSystemMsg> {
    return (await this.adaptor.send('get_group_system_msg')).data;
  }
  public async getEssenceMsgList(group_id: bigint): Promise<GroupEssenceMsg[]> {
    return (await this.adaptor.send('get_essence_msg_list', { group_id })).data;
  }
  public async getGroupAtAllRemain(
    group_id: bigint
  ): Promise<GroupAtAllRemain> {
    return (await this.adaptor.send('get_group_at_all_remain', { group_id }))
      .data;
  }

  /* Group setting APIs */
  public async setGroupName(
    group_id: bigint,
    group_name: string
  ): Promise<void> {
    await this.adaptor.send('set_group_name', { group_id, group_name });
  }
  public async setGroupPortrait(
    group_id: bigint,
    file: string,
    cache?: 0 | 1
  ): Promise<void> {
    await this.adaptor.send('set_group_portrait', { group_id, file, cache });
  }
  public async setGroupAdmin(
    group_id: bigint,
    user_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await this.adaptor.send('set_group_admin', { group_id, user_id, enable });
  }
  public async setGroupCard(
    group_id: bigint,
    user_id: bigint,
    card: string
  ): Promise<void> {
    await this.adaptor.send('set_group_card', { group_id, user_id, card });
  }
  public async setGroupSpecialTitle(
    group_id: bigint,
    user_id: bigint,
    special_title?: string,
    duration?: bigint
  ): Promise<void> {
    await this.adaptor.send('set_group_card', {
      group_id,
      user_id,
      special_title,
      duration
    });
  }

  /* Group operation APIs */
  public async setGroupBan(
    group_id: bigint,
    user_id: bigint,
    duration?: bigint
  ): Promise<void> {
    await this.adaptor.send('set_group_ban', { group_id, user_id, duration });
  }
  public async setGroupWholeBan(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await this.adaptor.send('set_group_whole_ban', { group_id, enable });
  }
  public async setGroupAnonymousBan(
    group_id: bigint,
    flag: string,
    duration?: bigint
  ): Promise<void> {
    await this.adaptor.send('set_group_anonymous_ban', {
      group_id,
      flag,
      duration
    });
  }
  public async setEssenceMsg(message_id: bigint): Promise<void> {
    await this.adaptor.send('set_essence_msg', { message_id });
  }
  public async deleteEssenceMsg(message_id: bigint): Promise<void> {
    await this.adaptor.send('delete_essence_msg', { message_id });
  }
  public async sendGroupSign(group_id: bigint): Promise<void> {
    await this.adaptor.send('send_group_sign', { group_id });
  }
  public async sendGroupAnonymous(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await this.adaptor.send('set_group_anonymous', { group_id, enable });
  }
  public async sendGroupNotice(
    group_id: bigint,
    content: string,
    image?: string
  ): Promise<void> {
    await this.adaptor.send('_send_group_notice', { group_id, content, image });
  }
  public async getGroupNotice(group_id: bigint): Promise<GroupNotice[]> {
    return (await this.adaptor.send('_get_group_notice', { group_id })).data;
  }
  public async setGroupKick(
    group_id: bigint,
    user_id: bigint,
    reject_add_request?: boolean
  ): Promise<void> {
    await this.adaptor.send('set_group_kick', {
      group_id,
      user_id,
      reject_add_request
    });
  }
  public async setGroupLeave(
    group_id: bigint,
    is_dismiss?: boolean
  ): Promise<void> {
    await this.adaptor.send('set_group_leave', { group_id, is_dismiss });
  }

  /* File APIs */
  public async uploadGroupFile(
    group_id: bigint,
    file: string,
    name: string,
    folder?: string
  ): Promise<void> {
    await this.adaptor.send('upload_group_file', {
      group_id,
      file,
      name,
      folder
    });
  }
  public async deleteGroupFile(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<void> {
    await this.adaptor.send('delete_group_file', { group_id, file_id, busid });
  }
  public async createGroupFileFolder(
    group_id: bigint,
    name: string,
    parent_id: '/'
  ): Promise<void> {
    await this.adaptor.send('create_group_file_folder', {
      group_id,
      name,
      parent_id
    });
  }
  public async deleteGroupFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<void> {
    await this.adaptor.send('delete_group_folder', { group_id, folder_id });
  }
  public async getGroupFileSystemInfo(
    group_id: bigint
  ): Promise<GroupFileSystemInfo> {
    return (await this.adaptor.send('get_group_file_system_info', { group_id }))
      .data;
  }
  public async getGroupRootFiles(
    group_id: bigint
  ): Promise<GroupFileFolderInfo> {
    return (await this.adaptor.send('get_group_root_files', { group_id })).data;
  }
  public async getGroupFilesByFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<GroupFileFolderInfo> {
    return (
      await this.adaptor.send('get_group_files_by_folder', {
        group_id,
        folder_id
      })
    ).data;
  }
  public async getGroupFileUrl(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<string> {
    return (
      await this.adaptor.send('get_group_file_url', {
        group_id,
        file_id,
        busid
      })
    ).data.url;
  }
  public async uploadPrivateFile(
    user_id: bigint,
    file: string,
    name: string
  ): Promise<void> {
    await this.adaptor.send('upload_private_file', { user_id, file, name });
  }

  /* Go-CqHttp APIs */
  public async getCookies(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async getCsrfToken(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async getCredentials(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async getVersionInfo(): Promise<VersionInfo> {
    return (await this.adaptor.send('get_version_info')).data;
  }
  public async getStatus(): Promise<Status> {
    return (await this.adaptor.send('get_status')).data;
  }
  public async setRestart(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async cleanCache(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: '-1'
    });
  }
  public async reloadEventFilter(file: string): Promise<void> {
    await this.adaptor.send('reload_event_filter', { file });
  }
  public async downloadFile(
    url: string,
    thread_count: bigint,
    headers: string[]
  ): Promise<string> {
    return (
      await this.adaptor.send('download_file', { url, thread_count, headers })
    ).data.file;
  }
  public async checkUrlSafely(url: string): Promise<SafelyLevel> {
    return (await this.adaptor.send('check_url_safely', { url })).data.level;
  }
}
