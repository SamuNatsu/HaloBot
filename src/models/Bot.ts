/// Bot model
import { ActionResponse, Adaptor } from '../adaptors/Adaptor';
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

/* Export class */
export class Bot {
  /* Properties */
  private adaptor: Adaptor;

  /* Constructor */
  private constructor(adaptor: Adaptor) {
    this.adaptor = adaptor;
  }
  public static async create(adaptor: Adaptor): Promise<void> {
    const ret: Bot = new Bot(adaptor);
    await ret.loadPlugins();
  }

  /* Start */
  public start(): void {
    process.stdin.resume();
  }

  /* Plugins */
  private plugins: Plugin[] = [];
  private async loadPlugins(): Promise<void> {
    const dirname: string = path.dirname(__filename);
    const pluginDir: string = path.join(dirname, './plugins');
    if (!fs.existsSync(pluginDir)) {
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
      const plugin: any = await import(i);
      this.plugins.push(plugin.default);
    }
    this.plugins.sort(
      (a: Plugin, b: Plugin): number => a.meta.priority - b.meta.priority
    );

    for (const i of this.plugins) {
      if (i.onStart !== undefined) {
        i.onStart(this);
      }
    }
  }

  /* Halo APIs */
  public reloadPlugins(): void {
    for (const i of this.plugins) {
      if (i.onStop !== undefined) {
        i.onStop(this);
      }
    }
    for (const i of this.plugins) {
      if (i.onStart !== undefined) {
        i.onStart(this);
      }
    }
  }

  /* Account APIs */
  public async getLoginInfo(): Promise<LoginInfo> {
    const res: ActionResponse = await this.adaptor.send('get_login_info');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async setQqProfile(
    nickname: string,
    company: string,
    email: string,
    college: string,
    personal_note: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_qq_profile', {
      nickname,
      company,
      email,
      college,
      personal_note
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async qidianGetAccountInfo(): Promise<any> {
    const res: ActionResponse = await this.adaptor.send(
      'qidian_get_account_info'
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getModelShow(model: string): Promise<ModelShowInfo[]> {
    const res: ActionResponse = await this.adaptor.send('_get_model_show', {
      model
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.variants;
  }
  public async setModelShow(model: string, model_show: string): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('_set_model_show', {
      model,
      model_show
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async getOnlineClients(
    no_cache?: boolean
  ): Promise<OnlineClientInfo[]> {
    const res: ActionResponse = await this.adaptor.send('get_online_clients', {
      no_cache
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.clients;
  }

  /* Friend info APIs */
  public async getStrangerInfo(
    user_id: bigint,
    no_cache?: boolean
  ): Promise<StrangerInfo> {
    const res: ActionResponse = await this.adaptor.send('get_stranger_info', {
      user_id,
      no_cache
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getFriendList(): Promise<FriendInfo[]> {
    const res: ActionResponse = await this.adaptor.send('get_friend_list');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getUnidirectionalFirendList(): Promise<UnidirectionalFriendInfo> {
    const res: ActionResponse = await this.adaptor.send(
      'get_unidirectional_friend_list'
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }

  /* Friend operation APIs */
  public async deleteFriend(user_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('delete_friend', {
      user_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async deleteUnidirectionalFriend(user_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send(
      'delete_unidirectional_friend',
      { user_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }

  /* Message APIs */
  public async sendPrivateMsg(
    user_id: bigint,
    message: string,
    auto_escape?: boolean,
    group_id?: bigint
  ): Promise<bigint> {
    const res: ActionResponse = await this.adaptor.send('send_private_msg', {
      user_id,
      message,
      auto_escape,
      group_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.message_id;
  }
  public async sendGroupMsg(
    group_id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    const res: ActionResponse = await this.adaptor.send('send_group_msg', {
      group_id,
      message,
      auto_escape
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.message_id;
  }
  public async sendMsg(
    message_type: 'private' | 'group',
    id: bigint,
    message: string,
    auto_escape?: boolean
  ): Promise<bigint> {
    const res: ActionResponse = await this.adaptor.send('send_msg', {
      message_type,
      user_id: message_type === 'private' ? id : undefined,
      group_id: message_type === 'group' ? id : undefined,
      message,
      auto_escape
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.message_id;
  }
  public async getMsg(message_id: bigint): Promise<MsgInfo> {
    const res: ActionResponse = await this.adaptor.send('get_msg', {
      message_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async deleteMsg(message_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('delete_msg', {
      message_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async markMsgAsRead(message_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('mark_msg_as_read', {
      message_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async getForwardMsg() {}
  public async sendGroupForwardMsg() {}
  public async sendPrivateForwardMsg() {}
  public async getGroupMsgHistory() {}

  /* Image APIs */
  public async getImage(file: string): Promise<ImageFileInfo> {
    const res: ActionResponse = await this.adaptor.send('get_image', { file });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async canSendImage(): Promise<boolean> {
    const res: ActionResponse = await this.adaptor.send('can_send_image');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.yes;
  }
  public async ocrImage(image: string): Promise<ImageOcrData> {
    const res: ActionResponse = await this.adaptor.send('ocr_image', { image });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }

  /* Record APIs */
  public async getRecord(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async canSendRecord(): Promise<boolean> {
    const res: ActionResponse = await this.adaptor.send('can_send_record');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.yes;
  }

  /* Handling APIs */
  public async setFriendAddRequest(
    flag: string,
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send(
      'set_friend_add_request',
      { flag, approve, remark }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupAddRequest(
    flag: string,
    type: 'add' | 'invite',
    approve?: boolean,
    remark?: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send(
      'set_group_add_request',
      { flag, type, approve, remark }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }

  /* Group info APIs */
  public async getGroupInfo(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<GroupInfo> {
    const res: ActionResponse = await this.adaptor.send('get_group_info', {
      group_id,
      no_cache
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupList(no_cache?: boolean): Promise<GroupInfo[]> {
    const res: ActionResponse = await this.adaptor.send('get_group_list', {
      no_cache
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupMemberInfo(
    group_id: bigint,
    user_id: bigint,
    no_cache?: boolean
  ): Promise<GroupMemberInfo> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_member_info',
      { group_id, user_id, no_cache }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupMemberList(
    group_id: bigint,
    no_cache?: boolean
  ): Promise<Partial<GroupMemberInfo>[]> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_member_list',
      { group_id, no_cache }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
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
    const res: ActionResponse = await this.adaptor.send(
      'get_group_honor_info',
      { group_id, type }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupSystemMsg(): Promise<GroupSystemMsg> {
    const res: ActionResponse = await this.adaptor.send('get_group_system_msg');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getEssenceMsgList(group_id: bigint): Promise<GroupEssenceMsg[]> {
    const res: ActionResponse = await this.adaptor.send(
      'get_essence_msg_list',
      { group_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupAtAllRemain(
    group_id: bigint
  ): Promise<GroupAtAllRemain> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_at_all_remain',
      { group_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }

  /* Group setting APIs */
  public async setGroupName(
    group_id: bigint,
    group_name: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_name', {
      group_id,
      group_name
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupPortrait(
    group_id: bigint,
    file: string,
    cache?: 0 | 1
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_portrait', {
      group_id,
      file,
      cache
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupAdmin(
    group_id: bigint,
    user_id: bigint,
    enable?: boolean
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_admin', {
      group_id,
      user_id,
      enable
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupCard(
    group_id: bigint,
    user_id: bigint,
    card: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_card', {
      group_id,
      user_id,
      card
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupSpecialTitle(
    group_id: bigint,
    user_id: bigint,
    special_title?: string,
    duration?: bigint
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_card', {
      group_id,
      user_id,
      special_title,
      duration
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }

  /* Group operation APIs */
  public async setGroupBan(
    group_id: bigint,
    user_id: bigint,
    duration?: bigint
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_ban', {
      group_id,
      user_id,
      duration
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupWholeBan(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_whole_ban', {
      group_id,
      enable
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupAnonymousBan(
    group_id: bigint,
    flag: string,
    duration?: bigint
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send(
      'set_group_anonymous_ban',
      { group_id, flag, duration }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setEssenceMsg(message_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_essence_msg', {
      message_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async deleteEssenceMsg(message_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('delete_essence_msg', {
      message_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async sendGroupSign(group_id: bigint): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('send_group_sign', {
      group_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async sendGroupAnonymous(
    group_id: bigint,
    enable?: boolean
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_anonymous', {
      group_id,
      enable
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async sendGroupNotice(
    group_id: bigint,
    content: string,
    image?: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('_send_group_notice', {
      group_id,
      content,
      image
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async getGroupNotice(group_id: bigint): Promise<GroupNotice[]> {
    const res: ActionResponse = await this.adaptor.send('_get_group_notice', {
      group_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async setGroupKick(
    group_id: bigint,
    user_id: bigint,
    reject_add_request?: boolean
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_kick', {
      group_id,
      user_id,
      reject_add_request
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async setGroupLeave(
    group_id: bigint,
    is_dismiss?: boolean
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('set_group_leave', {
      group_id,
      is_dismiss
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }

  /* File APIs */
  public async uploadGroupFile(
    group_id: bigint,
    file: string,
    name: string,
    folder?: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('upload_group_file', {
      group_id,
      file,
      name,
      folder
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async deleteGroupFile(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('delete_group_file', {
      group_id,
      file_id,
      busid
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async createGroupFileFolder(
    group_id: bigint,
    name: string,
    parent_id: '/'
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send(
      'create_group_file_folder',
      { group_id, name, parent_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async deleteGroupFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('delete_group_folder', {
      group_id,
      folder_id
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async getGroupFileSystemInfo(
    group_id: bigint
  ): Promise<GroupFileSystemInfo> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_file_system_info',
      { group_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupRootFiles(
    group_id: bigint
  ): Promise<GroupFileFolderInfo> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_root_files',
      { group_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupFilesByFolder(
    group_id: bigint,
    folder_id: string
  ): Promise<GroupFileFolderInfo> {
    const res: ActionResponse = await this.adaptor.send(
      'get_group_files_by_folder',
      { group_id, folder_id }
    );
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getGroupFileUrl(
    group_id: bigint,
    file_id: string,
    busid: bigint
  ): Promise<string> {
    const res: ActionResponse = await this.adaptor.send('get_group_file_url', {
      group_id,
      file_id,
      busid
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.url;
  }
  public async uploadPrivateFile(
    user_id: bigint,
    file: string,
    name: string
  ): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('upload_private_file', {
      user_id,
      file,
      name
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }

  /* Go-CqHttp APIs */
  public async getCookies(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async getCsrfToken(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async getCredentials(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async getVersionInfo(): Promise<VersionInfo> {
    const res: ActionResponse = await this.adaptor.send('get_version_info');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async getStatus(): Promise<Status> {
    const res: ActionResponse = await this.adaptor.send('get_status');
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data;
  }
  public async setRestart(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async cleanCache(): Promise<never> {
    throw new Error('Not supported by go-cqhttp');
  }
  public async reloadEventFilter(file: string): Promise<void> {
    const res: ActionResponse = await this.adaptor.send('reload_event_filter', {
      file
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
  }
  public async downloadFile(
    url: string,
    thread_count: bigint,
    headers: string[]
  ): Promise<string> {
    const res: ActionResponse = await this.adaptor.send('download_file', {
      url,
      thread_count,
      headers
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.file;
  }
  public async checkUrlSafely(url: string): Promise<SafelyLevel> {
    const res: ActionResponse = await this.adaptor.send('check_url_safely', {
      url
    });
    if (res.status === 'failed') {
      throw new Error(res.wording, { cause: res });
    }
    return res.data.level;
  }
}
