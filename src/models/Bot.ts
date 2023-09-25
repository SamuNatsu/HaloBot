/// Bot model
import {
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
import { Plugin } from '../interfaces/plugin';
import path from 'path';
import fs from 'fs';
import { Config } from '../interfaces/config';
import YAML from 'yaml';
import { ActionError, ActionResponse, Adaptor } from './Adaptor';
import { ForwardWebSocketAdaptor } from './ForwardWebSocketAdaptor';
import { getDirname } from '../utils';
import { Logger } from './Logger';
import { configSchema } from '../schemas/config';
import { pluginSchema } from '../schemas/plugin';
import { EventHandler } from './EventHandler';
import {
  FriendRecallNoticeEvent,
  GroupAdminNoticeEvent,
  GroupDecreaseNoticeEvent,
  GroupIncreaseNoticeEvent,
  GroupRecallNoticeEvent
} from '../interfaces/notice_event';
import {
  GroupMessageEvent,
  PrivateMessageEvent
} from '../interfaces/message_event';
import {
  FriendRequestEvent,
  GroupRequestEvent
} from '../interfaces/request_event';

/* Export class */
export class Bot {
  /* Properties */
  private adaptor: Adaptor;
  private handler: EventHandler = new EventHandler();
  private logger: Logger = new Logger('HaloBot');

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
    }

    const ret: Bot = new Bot(config, adaptor);
    adaptor.messageHandler = ret.eventDisptach.bind(ret);
    await ret.loadPlugins();

    return ret;
  }

  /* Event despatch */
  private eventDisptach(res: any): void {
    switch (res.post_type) {
      case 'message':
      case 'message_sent':
        switch (res.message_type) {
          case 'private': {
            const tmp: PrivateMessageEvent = res;
            this.logger.info(
              `收到来自 ${tmp.sender.nickname}[${tmp.user_id}] 的私聊消息`,
              tmp.raw_message
            );
            this.handler.process('onPrivateMessage', this, tmp);
            break;
          }
          case 'group': {
            const tmp: GroupMessageEvent = res;
            this.logger.info(
              `收到来自群 [${tmp.group_id}] 内 ${
                tmp.sender.card?.length === 0
                  ? tmp.sender.nickname
                  : tmp.sender.card
              }[${tmp.user_id}] 的群聊消息`,
              tmp.raw_message
            );
            this.handler.process('onGroupMessage', this, tmp);
            break;
          }
        }
        break;
      case 'request':
        switch (res.request_type) {
          case 'friend': {
            const tmp: FriendRequestEvent = res;
            this.logger.info(
              `收到来自 [${tmp.user_id}] 的好友请求`,
              tmp.comment
            );
            this.handler.process('onFriendRequest', this, tmp);
            break;
          }
          case 'group': {
            const tmp: GroupRequestEvent = res;
            this.logger.info(
              `收到来自 [${tmp.user_id}] 的加群 [${tmp.group_id}] ${
                tmp.sub_type === 'add' ? '请求' : '邀请'
              }`,
              res.comment
            );
            this.handler.process('onGroupRequest', this, tmp);
            break;
          }
        }
        break;
      case 'notice':
        switch (res.notice_type) {
          case 'friend_recall': {
            const tmp: FriendRecallNoticeEvent = res;
            this.logger.info(
              `[${tmp.user_id}] 撤回了私聊消息 (${tmp.message_id})`
            );
            this.handler.process('onFriendRecall', this, tmp);
            break;
          }
          case 'group_recall': {
            const tmp: GroupRecallNoticeEvent = res;
            this.logger.info(
              `群 [${tmp.group_id}] 成员 [${tmp.operator_id}] 撤回了群聊消息 (${tmp.message_id})`
            );
            this.handler.process('onGroupRecall', this, tmp);
            break;
          }
          case 'group_increase': {
            const tmp: GroupIncreaseNoticeEvent = res;
            this.logger.info(
              `群 [${tmp.group_id}] 因为成员 [${tmp.opeator_id}] ${
                tmp.sub_type === 'approve' ? '同意' : '邀请'
              }而新增了成员 [${tmp.user_id}]`
            );
            this.handler.process('onGroupIncrease', this, tmp);
            break;
          }
          case 'group_decrease': {
            const tmp: GroupDecreaseNoticeEvent = res;
            this.logger.info(
              `群 [${tmp.group_id}] 因为成员 [${tmp.opeator_id}] ${
                tmp.sub_type === 'leave' ? '主动退群' : '踢出成员'
              }而减少了成员 [${tmp.user_id}]`
            );
            this.handler.process('onGroupDecrease', this, tmp);
            break;
          }
          case 'group_admin': {
            const tmp: GroupAdminNoticeEvent = res;
            this.logger.info(
              `群 [${tmp.group_id}] ${
                tmp.sub_type === 'set' ? '设置了' : '取消了'
              }成员 [${tmp.user_id}] 的管理员权限`
            );
            this.handler.process('onGroupAdminUpadte', this, tmp);
            break;
          }
          case 'group_upload':
            for (const i of this.plugins) {
              if (i.onGroupFileUpload !== undefined) {
                i.onGroupFileUpload(this, res);
              }
            }
            break;
          case 'group_ban':
            for (const i of this.plugins) {
              if (i.onGroupBan !== undefined) {
                i.onGroupBan(this, res);
              }
            }
            break;
          case 'friend_add':
            for (const i of this.plugins) {
              if (i.onFriendAdd !== undefined) {
                i.onFriendAdd(this, res);
              }
            }
            break;
          case 'notify':
            switch (res.sub_type) {
              case 'poke':
                for (const i of this.plugins) {
                  if (i.onPoke !== undefined) {
                    i.onPoke(this, res);
                  }
                }
                break;
              case 'lucky_king':
                for (const i of this.plugins) {
                  if (i.onGroupLuckyKing !== undefined) {
                    i.onGroupLuckyKing(this, res);
                  }
                }
                break;
              case 'honor':
                for (const i of this.plugins) {
                  if (i.onGroupHonorUpdate !== undefined) {
                    i.onGroupHonorUpdate(this, res);
                  }
                }
                break;
              case 'title':
                for (const i of this.plugins) {
                  if (i.onGroupTitleUpdate !== undefined) {
                    i.onGroupTitleUpdate(this, res);
                  }
                }
                break;
            }
            break;
          case 'group_card':
            for (const i of this.plugins) {
              if (i.onGroupCardUpdate !== undefined) {
                i.onGroupCardUpdate(this, res);
              }
            }
            break;
          case 'offline_file':
            for (const i of this.plugins) {
              if (i.onOfflineFile !== undefined) {
                i.onOfflineFile(this, res);
              }
            }
            break;
          case 'client_status':
            for (const i of this.plugins) {
              if (i.onClientStatusUpdate !== undefined) {
                i.onClientStatusUpdate(this, res);
              }
            }
            break;
          case 'essence':
            for (const i of this.plugins) {
              if (i.onGroupEssenceUpdate !== undefined) {
                i.onGroupEssenceUpdate(this, res);
              }
            }
            break;
        }
        break;
      case 'meta_event':
        switch (res.meta_event_type) {
          case 'heartbeat':
            this.handler.process('onHeartbeat', this, res);
            break;
          case 'lifecycle':
            this.handler.process('onLifecycle', this, res);
            break;
        }
        break;
    }
  }

  /* Start */
  public start(): void {
    this.logger.info('now starting plugins');
    for (const i of this.plugins) {
      if (i.onStart !== undefined) {
        i.onStart(this);
      }
      this.handler.registerPlugin(i);
      this.logger.info(`plugin "${i.meta.name}" started`);
    }
  }

  /* Plugins */
  private plugins: Plugin[] = [];
  private async loadPlugins(): Promise<void> {
    this.logger.info('now loading plugins');

    const dirname: string = getDirname();
    const pluginDir: string = path.join(dirname, './plugins');
    if (!fs.existsSync(pluginDir)) {
      this.logger.warn('plugins folder not exists, now create a new one');
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const pluginEntries: string[] = [];
    fs.readdirSync(pluginDir).forEach((value: string): void => {
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
        const plugin: Plugin = (await import('file://' + i)).default;
        const { error } = pluginSchema.validate(plugin);
        if (error !== undefined) {
          throw error;
        }

        this.plugins.push(plugin);
        this.logger.info(`plugin "${plugin.meta.name}" found`);
      } catch (err: unknown) {
        this.logger.warn(`fail to load plugin at "${i}"`, err);
      }
    }

    this.logger.info('now sorting plugins by priority');
    this.plugins.sort(
      (a: Plugin, b: Plugin): number => a.meta.priority - b.meta.priority
    );
  }

  /* Halo APIs */
  public async reloadPlugins(): Promise<void> {
    this.logger.info('now reloading plugins');

    for (const i of this.plugins) {
      if (i.onStop !== undefined) {
        i.onStop(this);
      }
      this.logger.info(`plugin "${i.meta.name}" stopped`);
    }

    this.plugins = [];
    this.handler.clear();
    this.logger.info('all plugins were released');

    await this.loadPlugins();

    this.logger.info('now starting plugins');
    for (const i of this.plugins) {
      if (i.onStart !== undefined) {
        i.onStart(this);
      }
      this.handler.registerPlugin(i);
      this.logger.info(`plugin "${i.meta.name}" started`);
    }
  }
  public getLogger(name: string): Logger {
    return new Logger(name);
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
  public async getForwardMsg() {}
  public async sendGroupForwardMsg() {}
  public async sendPrivateForwardMsg() {}
  public async getGroupMsgHistory() {}

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
      echo: -1
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
      echo: -1
    });
  }
  public async getCsrfToken(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: -1
    });
  }
  public async getCredentials(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: -1
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
      echo: -1
    });
  }
  public async cleanCache(): Promise<never> {
    throw new ActionError({
      status: 'failed',
      retcode: -1,
      msg: 'Not supported by Go-CqHttp',
      wording: 'Go-CqHttp 未支持该 API',
      data: undefined,
      echo: -1
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
