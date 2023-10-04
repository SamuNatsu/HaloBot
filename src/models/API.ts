/// API model
import { Command } from 'commander';
import { MessagePart } from '../interfaces/MessagePart';
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
import { GroupMessageEvent } from '../interfaces/events/message/GroupMessageEvent';
import { PrivateMessageEvent } from '../interfaces/events/message/PrivateMessageEvent';
import { FriendRequestEvent } from '../interfaces/events/request/FriendRequestEvent';
import { GroupRequestEvent } from '../interfaces/events/request/GroupRequestEvent';
import { truncText } from '../utils';
import { ActionError, Adaptor } from './adaptors/Adaptor';
import { Logger } from './Logger';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import JB from 'json-bigint';
import YAML from 'yaml';
import { EventDispatcher } from './EventDispatcher';
import { CallHaloEvent } from '../interfaces/events/halo/CallHaloEvent';
import { InjectedPlugin } from '../interfaces/Plugin';
import { PluginManager } from './PluginManager';

/* Special JSON */
const JSONbig = JB({ useNativeBigInt: true, alwaysParseAsBig: true });

/* Export class */
export class API {
  /* Properties */
  private namespace: string;
  private rootPath: string;
  private logger: Logger = new Logger('API');

  /* Constructor */
  public constructor(namespace: string, rootPath: string) {
    this.namespace = namespace;
    this.rootPath = rootPath;
  }

  /* HaloBot utils API */

  /**
   * 读取 Json 文件
   */
  readJsonFile(path: string, intAsBigInt: boolean = false): any {
    const raw: string = fs.readFileSync(path, 'utf-8');
    return intAsBigInt ? JSONbig.parse(raw) : JSON.parse(raw);
  }

  /**
   * 写入 Json 文件
   */
  saveJsonFile(path: string, data: any, prettify: boolean = false): void {
    fs.writeFileSync(
      path,
      JSONbig.stringify(data, undefined, prettify ? 2 : undefined)
    );
  }

  /**
   * 读取 Yaml 文件
   */
  readYamlFile(path: string, intAsBigInt: boolean = false): any {
    const raw: string = fs.readFileSync(path, 'utf-8');
    return intAsBigInt ? YAML.parse(raw, { intAsBigInt }) : YAML.parse(raw);
  }

  /**
   * 写入 Yaml 文件
   */
  saveYamlFile(path: string, data: any): void {
    fs.writeFileSync(path, YAML.stringify(data));
  }

  /**
   * 打开自定义数据库
   */
  openDB(options: Knex.Config): Knex {
    this.logger.info('用户请求打开自定义数据库', options);
    return knex(options);
  }

  /**
   * 创建命令解析程序
   */
  createCommandProgram(): Command {
    const ret: Command = new Command();
    ret.exitOverride();
    ret.configureOutput({
      writeErr: () => {},
      writeOut: () => {}
    });

    return ret;
  }

  /* Halo debug API */

  /**
   * 向事件分发器推送自定义事件
   */
  pushEvent(ev: any): void {
    this.logger.debug('用户推送了一个自定义事件', ev);
    EventDispatcher.getInstance().dispatch(ev);
  }

  /**
   * 获取插件元信息表
   */
  getPluginMetas(): InjectedPlugin['meta'][] {
    this.logger.debug('用户请求插件元信息表');
    return PluginManager.getInstance().getPluginMetas();
  }

  /**
   * 重启 HaloBot
   */
  async restartBot(): Promise<void> {
    this.logger.debug('用户请求重启 HaloBot');
    await PluginManager.getInstance().stopPlugins();
    process.exit(128);
  }

  /**
   * 重启所有插件
   */
  async restartPlugins(): Promise<void> {
    this.logger.debug('用户请求重启插件');
    await PluginManager.getInstance().stopPlugins();
    await PluginManager.getInstance().startPlugins();
  }

  /* Halo APIs */

  /**
   * 调用插件方法
   */
  public callPluginMethod(
    target: string,
    method_name: string,
    params: any
  ): Promise<any> {
    return new Promise<any>(
      (resolve: (value: any) => void, reject: (reason?: any) => void): void => {
        EventDispatcher.getInstance().dispatch(<CallHaloEvent>{
          time: BigInt(Math.floor(Date.now() / 1000)),
          self_id: 0n,
          post_type: 'halo_event',
          halo_event_type: 'call',
          from: this.namespace,
          target,
          method_name,
          params,
          resolve,
          reject
        });
      }
    );
  }

  /* Quick operation APIs */

  /**
   * 快速回复消息
   */
  public async reply(
    ev: PrivateMessageEvent | GroupMessageEvent,
    reply: string,
    auto_escape?: boolean
  ): Promise<void> {
    if (ev.message_type === 'group') {
      this.logger.info(`向群 [${ev.group_id}] 回复了消息`, truncText(reply));
    } else if (ev.sender.group_id === undefined) {
      this.logger.info(`向 [${ev.user_id}] 回复了消息`, truncText(reply));
    } else {
      this.logger.info(
        `向群 [${ev.sender.group_id}] 内 [${ev.user_id}] 回复了临时消息`,
        truncText(reply)
      );
    }
    await Adaptor.getInstance().send('.handle_quick_operation', {
      context: ev,
      operation: {
        reply,
        auto_escape
      }
    });
  }

  /**
   * 快速回复好友请求
   */
  public async replyFriendRequest(
    ev: FriendRequestEvent,
    approve: boolean,
    remark?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('.handle_quick_operation', {
      context: ev,
      operation: {
        approve,
        remark
      }
    });
  }

  /**
   * 快速回复加群请求/邀请
   */
  public async replyGroupRequest(
    ev: GroupRequestEvent,
    approve: boolean,
    reason?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('.handle_quick_operation', {
      context: ev,
      operation: {
        approve,
        reason
      }
    });
  }

  /* Account APIs */

  /**
   * 获取登录号信息
   */
  public async getLoginInfo(): Promise<LoginInfo> {
    return (await Adaptor.getInstance().send('get_login_info')).data;
  }

  /**
   * 设置登录号资料
   */
  public async setQqProfile(
    nickname: string,
    company: string,
    email: string,
    college: string,
    personal_note: string
  ): Promise<void> {
    await Adaptor.getInstance().send('set_qq_profile', {
      nickname,
      company,
      email,
      college,
      personal_note
    });
  }

  /**
   * 获取企点账号信息
   */
  public async qidianGetAccountInfo(): Promise<any> {
    return (await Adaptor.getInstance().send('qidian_get_account_info')).data;
  }

  /**
   * 获取在线机型
   */
  public async getModelShow(model: string): Promise<ModelShowInfo[]> {
    return (await Adaptor.getInstance().send('_get_model_show', { model })).data
      .variants;
  }

  /**
   * 设置在线机型
   */
  public async setModelShow(model: string, model_show: string): Promise<void> {
    await Adaptor.getInstance().send('_set_model_show', { model, model_show });
  }

  /**
   * 获取当前账号在线客户端列表
   */
  public async getOnlineClients(
    no_cache?: boolean
  ): Promise<OnlineClientInfo[]> {
    return (
      await Adaptor.getInstance().send('get_online_clients', { no_cache })
    ).data.clients;
  }

  /* Friend info APIs */

  /**
   * 获取陌生人信息
   */
  public async getStrangerInfo(
    user_id: bigint,
    no_cache?: boolean
  ): Promise<StrangerInfo> {
    return (
      await Adaptor.getInstance().send('get_stranger_info', {
        user_id,
        no_cache
      })
    ).data;
  }

  /**
   * 获取陌生人信息
   */
  public async getFriendList(): Promise<FriendInfo[]> {
    return (await Adaptor.getInstance().send('get_friend_list')).data;
  }

  /**
   * 获取单向好友列表
   */
  public async getUnidirectionalFirendList(): Promise<UnidirectionalFriendInfo> {
    return (await Adaptor.getInstance().send('get_unidirectional_friend_list'))
      .data;
  }

  /* Friend operation APIs */

  /**
   * 删除好友
   */
  public async deleteFriend(user_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('delete_friend', { user_id });
  }

  /**
   * 删除单向好友
   */
  public async deleteUnidirectionalFriend(user_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('delete_unidirectional_friend', {
      user_id
    });
  }

  /* Message APIs */

  /**
   * 发送私聊消息
   */
  public async sendPrivateMsg(
    user_id: bigint,
    message: string,
    auto_escape?: boolean,
    group_id?: bigint
  ): Promise<bigint> {
    if (group_id === undefined) {
      this.logger.info(`向 [${user_id}] 发送了消息`, truncText(message));
    } else {
      this.logger.info(
        `向群 [${group_id}] 内 [${user_id}] 发送了临时消息`,
        truncText(message)
      );
    }
    return (
      await Adaptor.getInstance().send('send_private_msg', {
        user_id,
        message,
        auto_escape,
        group_id
      })
    ).data.message_id;
  }

  /**
   * 发送群聊消息
   */
  public async sendGroupMsg(
    group_id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    this.logger.info(`向群 [${group_id}] 发送了消息`, truncText(message));
    return (
      await Adaptor.getInstance().send('send_group_msg', {
        group_id,
        message,
        auto_escape
      })
    ).data.message_id;
  }

  /**
   * 发送消息
   */
  public async sendMsg(
    message_type: 'private' | 'group',
    id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    if (message_type === 'private') {
      this.logger.info(`向 [${id}] 发送了消息`, truncText(message));
    } else {
      this.logger.info(`向群 [${id}] 发送了消息`, truncText(message));
    }
    return (
      await Adaptor.getInstance().send('send_msg', {
        message_type,
        user_id: message_type === 'private' ? id : undefined,
        group_id: message_type === 'group' ? id : undefined,
        message,
        auto_escape
      })
    ).data.message_id;
  }

  /**
   * 获取消息
   */
  public async getMsg(message_id: bigint): Promise<MsgInfo> {
    return (await Adaptor.getInstance().send('get_msg', { message_id })).data;
  }

  /**
   * 撤回消息
   */
  public async deleteMsg(message_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('delete_msg', { message_id });
  }

  /**
   * 标记消息已读
   */
  public async markMsgAsRead(message_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('mark_msg_as_read', { message_id });
  }

  /**
   * 获取合并转发内容
   */
  public async getForwardMsg(message_id: bigint): Promise<ForwardMessage[]> {
    return (await Adaptor.getInstance().send('get_forward_msg', { message_id }))
      .data.messages;
  }

  /**
   * 发送合并转发群聊
   */
  public async sendGroupForwardMsg(
    group_id: bigint,
    messages: MessagePart[]
  ): Promise<ForwardMessageInfo> {
    return (
      await Adaptor.getInstance().send('send_group_forward_msg', {
        group_id,
        messages
      })
    ).data;
  }

  /**
   * 发送合并转发私聊
   */
  public async sendPrivateForwardMsg(
    user_id: bigint,
    messages: MessagePart[]
  ): Promise<ForwardMessageInfo> {
    return (
      await Adaptor.getInstance().send('send_private_forward_msg', {
        user_id,
        messages
      })
    ).data;
  }

  /**
   * 获取群消息历史记录
   */
  public async getGroupMsgHistory(
    group_id: bigint,
    message_seq?: bigint
  ): Promise<GroupMessageEvent[]> {
    return (
      await Adaptor.getInstance().send('get_group_msg_history', {
        group_id,
        message_seq
      })
    ).data.messages;
  }

  /* Image APIs */

  /**
   * 获取图片信息
   */
  public async getImage(file: string): Promise<ImageFileInfo> {
    return (await Adaptor.getInstance().send('get_image', { file })).data;
  }

  /**
   * 检查是否可以发送图片
   */
  public async canSendImage(): Promise<boolean> {
    return (await Adaptor.getInstance().send('can_send_image')).data.yes;
  }

  /**
   * 图片 OCR
   */
  public async ocrImage(image: string): Promise<ImageOcrData> {
    return (await Adaptor.getInstance().send('ocr_image', { image })).data;
  }

  /* Record APIs */

  /**
   * 获取语音
   */
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

  /**
   * 检查是否可以发送语音
   */
  public async canSendRecord(): Promise<boolean> {
    return (await Adaptor.getInstance().send('can_send_record')).data.yes;
  }

  /* Handling APIs */

  /**
   * 处理加好友请求
   */
  public async setFriendAddRequest(
    flag: string,
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('set_friend_add_request', {
      flag,
      approve,
      remark
    });
  }

  /**
   * 处理加群请求/邀请
   */
  public async setGroupAddRequest(
    flag: string,
    type: 'add' | 'invite',
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_add_request', {
      flag,
      type,
      approve,
      remark
    });
  }

  /* Group info APIs */

  /**
   * 获取群信息
   */
  public async getGroupInfo(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<GroupInfo> {
    return (
      await Adaptor.getInstance().send('get_group_info', { group_id, no_cache })
    ).data;
  }

  /**
   * 获取群列表
   */
  public async getGroupList(no_cache?: boolean): Promise<GroupInfo[]> {
    return (await Adaptor.getInstance().send('get_group_list', { no_cache }))
      .data;
  }

  /**
   * 获取群成员信息
   */
  public async getGroupMemberInfo(
    group_id: bigint,
    user_id: bigint,
    no_cache?: boolean
  ): Promise<GroupMemberInfo> {
    return (
      await Adaptor.getInstance().send('get_group_member_info', {
        group_id,
        user_id,
        no_cache
      })
    ).data;
  }

  /**
   * 获取群成员列表
   */
  public async getGroupMemberList(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<Partial<GroupMemberInfo>[]> {
    return (
      await Adaptor.getInstance().send('get_group_member_list', {
        group_id,
        no_cache
      })
    ).data;
  }

  /**
   * 获取群荣誉信息
   */
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
    return (
      await Adaptor.getInstance().send('get_group_honor_info', {
        group_id,
        type
      })
    ).data;
  }

  /**
   * 获取群系统消息
   */
  public async getGroupSystemMsg(): Promise<GroupSystemMsg> {
    return (await Adaptor.getInstance().send('get_group_system_msg')).data;
  }

  /**
   * 获取精华消息列表
   */
  public async getEssenceMsgList(group_id: bigint): Promise<GroupEssenceMsg[]> {
    return (
      await Adaptor.getInstance().send('get_essence_msg_list', { group_id })
    ).data;
  }

  /**
   * 获取群 at 全体成员剩余次数
   */
  public async getGroupAtAllRemain(
    group_id: bigint
  ): Promise<GroupAtAllRemain> {
    return (
      await Adaptor.getInstance().send('get_group_at_all_remain', { group_id })
    ).data;
  }

  /* Group setting APIs */

  /**
   * 设置群名
   */
  public async setGroupName(
    group_id: bigint,
    group_name: string
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_name', {
      group_id,
      group_name
    });
  }

  /**
   * 设置群头像
   */
  public async setGroupPortrait(
    group_id: bigint,
    file: string,
    cache?: 0 | 1
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_portrait', {
      group_id,
      file,
      cache
    });
  }

  /**
   * 设置群管理员
   */
  public async setGroupAdmin(
    group_id: bigint,
    user_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_admin', {
      group_id,
      user_id,
      enable
    });
  }

  /**
   * 设置群名片
   */
  public async setGroupCard(
    group_id: bigint,
    user_id: bigint,
    card: string
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_card', {
      group_id,
      user_id,
      card
    });
  }

  /**
   * 设置群组专属头衔
   */
  public async setGroupSpecialTitle(
    group_id: bigint,
    user_id: bigint,
    special_title?: string,
    duration?: bigint
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_card', {
      group_id,
      user_id,
      special_title,
      duration
    });
  }

  /* Group operation APIs */

  /**
   * 群单人禁言
   */
  public async setGroupBan(
    group_id: bigint,
    user_id: bigint,
    duration?: bigint
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_ban', {
      group_id,
      user_id,
      duration
    });
  }

  /**
   * 群全员禁言
   */
  public async setGroupWholeBan(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_whole_ban', {
      group_id,
      enable
    });
  }

  /**
   * 群匿名用户禁言
   */
  public async setGroupAnonymousBan(
    group_id: bigint,
    flag: string,
    duration?: bigint
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_anonymous_ban', {
      group_id,
      flag,
      duration
    });
  }

  /**
   * 设置精华消息
   */
  public async setEssenceMsg(message_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('set_essence_msg', { message_id });
  }

  /**
   * 移出精华消息
   */
  public async deleteEssenceMsg(message_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('delete_essence_msg', { message_id });
  }

  /**
   * 群打卡
   */
  public async sendGroupSign(group_id: bigint): Promise<void> {
    await Adaptor.getInstance().send('send_group_sign', { group_id });
  }

  /**
   * 群设置匿名
   */
  public async setGroupAnonymous(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_anonymous', {
      group_id,
      enable
    });
  }

  /**
   * 发送群公告
   */
  public async sendGroupNotice(
    group_id: bigint,
    content: string,
    image?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('_send_group_notice', {
      group_id,
      content,
      image
    });
  }

  /**
   * 获取群公告
   */
  public async getGroupNotice(group_id: bigint): Promise<GroupNotice[]> {
    return (await Adaptor.getInstance().send('_get_group_notice', { group_id }))
      .data;
  }

  /**
   * 群组踢人
   */
  public async setGroupKick(
    group_id: bigint,
    user_id: bigint,
    reject_add_request?: boolean
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_kick', {
      group_id,
      user_id,
      reject_add_request
    });
  }

  /**
   * 退出群组
   */
  public async setGroupLeave(
    group_id: bigint,
    is_dismiss?: boolean
  ): Promise<void> {
    await Adaptor.getInstance().send('set_group_leave', {
      group_id,
      is_dismiss
    });
  }

  /* File APIs */

  /**
   * 上传群文件
   */
  public async uploadGroupFile(
    group_id: bigint,
    file: string,
    name: string,
    folder?: string
  ): Promise<void> {
    await Adaptor.getInstance().send('upload_group_file', {
      group_id,
      file,
      name,
      folder
    });
  }

  /**
   * 删除群文件
   */
  public async deleteGroupFile(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<void> {
    await Adaptor.getInstance().send('delete_group_file', {
      group_id,
      file_id,
      busid
    });
  }

  /**
   * 创建群文件文件夹
   */
  public async createGroupFileFolder(
    group_id: bigint,
    name: string,
    parent_id: '/'
  ): Promise<void> {
    await Adaptor.getInstance().send('create_group_file_folder', {
      group_id,
      name,
      parent_id
    });
  }

  /**
   * 删除群文件文件夹
   */
  public async deleteGroupFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<void> {
    await Adaptor.getInstance().send('delete_group_folder', {
      group_id,
      folder_id
    });
  }

  /**
   * 获取群文件系统信息
   */
  public async getGroupFileSystemInfo(
    group_id: bigint
  ): Promise<GroupFileSystemInfo> {
    return (
      await Adaptor.getInstance().send('get_group_file_system_info', {
        group_id
      })
    ).data;
  }

  /**
   * 获取群根目录文件列表
   */
  public async getGroupRootFiles(
    group_id: bigint
  ): Promise<GroupFileFolderInfo> {
    return (
      await Adaptor.getInstance().send('get_group_root_files', { group_id })
    ).data;
  }

  /**
   * 获取群子目录文件列表
   */
  public async getGroupFilesByFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<GroupFileFolderInfo> {
    return (
      await Adaptor.getInstance().send('get_group_files_by_folder', {
        group_id,
        folder_id
      })
    ).data;
  }

  /**
   * 获取群文件资源链接
   */
  public async getGroupFileUrl(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<string> {
    return (
      await Adaptor.getInstance().send('get_group_file_url', {
        group_id,
        file_id,
        busid
      })
    ).data.url;
  }

  /**
   * 上传私聊文件
   */
  public async uploadPrivateFile(
    user_id: bigint,
    file: string,
    name: string
  ): Promise<void> {
    await Adaptor.getInstance().send('upload_private_file', {
      user_id,
      file,
      name
    });
  }

  /* Go-CqHttp APIs */

  /**
   * 获取 Cookies
   */
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

  /**
   * 获取 CSRF Token
   */
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

  /**
   * 获取 QQ 相关接口凭证
   */
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

  /**
   * 获取版本信息
   */
  public async getVersionInfo(): Promise<VersionInfo> {
    return (await Adaptor.getInstance().send('get_version_info')).data;
  }

  /**
   * 获取状态
   */
  public async getStatus(): Promise<Status> {
    return (await Adaptor.getInstance().send('get_status')).data;
  }

  /**
   * 重启 Go-CqHttp
   */
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

  /**
   * 清理缓存
   */
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

  /**
   * 重载事件过滤器
   */
  public async reloadEventFilter(file: string): Promise<void> {
    await Adaptor.getInstance().send('reload_event_filter', { file });
  }

  /**
   * 下载文件到缓存目录
   */
  public async downloadFile(
    url: string,
    thread_count: bigint,
    headers: string[]
  ): Promise<string> {
    return (
      await Adaptor.getInstance().send('download_file', {
        url,
        thread_count,
        headers
      })
    ).data.file;
  }

  /**
   * 检查链接安全性
   */
  public async checkUrlSafely(url: string): Promise<SafelyLevel> {
    return (await Adaptor.getInstance().send('check_url_safely', { url })).data
      .level;
  }
}
