/// Event dispatcher model
import { Plugin } from '../interfaces/Plugin';
import { CallHaloEvent } from '../interfaces/events/halo/CallHaloEvent';
import { GroupMessageEvent } from '../interfaces/events/message/GroupMessageEvent';
import { PrivateMessageEvent } from '../interfaces/events/message/PrivateMessageEvent';
import { LifecycleMetaEvent } from '../interfaces/events/meta/LifecycleMetaEvent';
import { FriendAddNoticeEvent } from '../interfaces/events/notice/FriendAddNoticeEvent';
import { FriendOfflineFileNoticeEvent } from '../interfaces/events/notice/FriendOfflineFileNoticeEvent';
import { FriendRecallNoticeEvent } from '../interfaces/events/notice/FriendRecallNoticeEvent';
import { GroupAdminNoticeEvent } from '../interfaces/events/notice/GroupAdminNoticeEvent';
import { GroupBanNoticeEvent } from '../interfaces/events/notice/GroupBanNoticeEvent';
import { GroupCardNoticeEvent } from '../interfaces/events/notice/GroupCardNoticeEvent';
import { GroupDecreaseNoticeEvent } from '../interfaces/events/notice/GroupDecreaseNoticeEvent';
import { GroupEssenceNoticeEvent } from '../interfaces/events/notice/GroupEssenceNoticeEvent';
import { GroupHonorNotifyNoticeEvent } from '../interfaces/events/notice/GroupHonorNotifyNoticeEvent';
import { GroupIncreaseNoticeEvent } from '../interfaces/events/notice/GroupIncreaseNoticeEvent';
import { GroupLuckyKingNotifyNoticeEvent } from '../interfaces/events/notice/GroupLuckyKingNotifyNoticeEvent';
import { GroupRecallNoticeEvent } from '../interfaces/events/notice/GroupRecallNoticeEvent';
import { GroupTitleNotifyNoticeEvent } from '../interfaces/events/notice/GroupTitleNotifyNoticeEvent';
import { GroupUploadNoticeEvent } from '../interfaces/events/notice/GroupUploadNoticeEvent';
import { PokeNotifyNoticeEvent } from '../interfaces/events/notice/PokeNotifyNoticeEvent';
import { FriendRequestEvent } from '../interfaces/events/request/FriendRequestEvent';
import { GroupRequestEvent } from '../interfaces/events/request/GroupRequestEvent';
import { deepFreezeObject, truncText } from '../utils';
import { AccountDatabase } from './AccountDatabase';
import { Logger } from './Logger';

/* Export class */
export class EventDispatcher {
  /* Properties */
  private static instance?: EventDispatcher;

  private logger: Logger = new Logger('事件分发器');
  private listenerMap: Map<
    string,
    { namespace: string; listener: Function }[]
  > = new Map();

  /* Methods */
  private emit(name: string, ev: any): void {
    // Get listeners
    const listeners: { namespace: string; listener: Function }[] | undefined =
      this.listenerMap.get(name);
    if (listeners === undefined) {
      return;
    }

    // Emit listeners
    for (const i of listeners) {
      try {
        i.listener(ev);
      } catch (err: unknown) {
        this.logger.error(
          `插件 [${i.namespace}] 抛出了未被捕获的错误于：${name}`,
          err
        );
      }
    }
  }

  private emitTarget(name: string, target: string, ev: CallHaloEvent): void {
    // Get listeners
    const listeners: { namespace: string; listener: Function }[] | undefined =
      this.listenerMap.get(name);
    if (listeners === undefined) {
      return;
    }

    // Get target
    const targetListener:
      | { namespace: string; listener: Function }
      | undefined = listeners.find(
      (value: { namespace: string; listener: Function }): boolean =>
        value.namespace === target
    );
    if (targetListener === undefined) {
      ev.reject(new Error(`不存在可以响应方法调用的插件: ${target}`));
      return;
    }

    // Emit listner
    try {
      targetListener.listener(ev);
    } catch (err: unknown) {
      this.logger.error(
        `插件 [${target}] 抛出了未被捕获的错误于：${name}`,
        err
      );
    }
  }

  public register(plugin: Plugin): void {
    for (const i in plugin) {
      // Check listener
      if (!/^on[A-Z]/.test(i) || !(typeof plugin[i] === 'function')) {
        continue;
      }

      // Check map key
      if (!this.listenerMap.has(i)) {
        this.listenerMap.set(i, []);
      }

      // Add listener
      this.listenerMap.get(i)?.push({
        namespace: plugin.meta.namespace,
        listener: (plugin[i] as Function).bind(plugin)
      });
    }
  }

  public clear(): void {
    this.listenerMap.clear();
  }

  public async dispatch(ev: any): Promise<void> {
    // Freeze event object
    deepFreezeObject(ev);

    // Dispatch event
    switch (ev.post_type) {
      case 'message':
      case 'message_sent':
        switch (ev.message_type) {
          case 'group': {
            const tmp: GroupMessageEvent = ev;

            // Get group name
            const groupName: string =
              await AccountDatabase.getInstance().getGroupName(tmp.group_id);

            this.logger.info(
              `收到群 ${groupName}[${tmp.group_id}] 内 ${
                tmp.sender.card?.length === 0
                  ? tmp.sender.nickname
                  : tmp.sender.card
              }[${tmp.user_id}] 发送的消息 (${tmp.message_id})`,
              truncText(tmp.raw_message)
            );
            this.emit('onGroupMessage', tmp);
            break;
          }
          case 'private': {
            const tmp: PrivateMessageEvent = ev;
            this.logger.info(
              `收到 ${tmp.sender.nickname}[${tmp.user_id}] 发送的消息 (${tmp.message_id})`,
              truncText(tmp.raw_message)
            );
            this.emit('onPrivateMessage', tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的消息上报', ev);
        }
        break;
      case 'notice':
        switch (ev.notice_type) {
          case 'friend_recall': {
            const tmp: FriendRecallNoticeEvent = ev;

            // Get nickname
            const userNickname: string =
              await AccountDatabase.getInstance().getUserNickname(tmp.user_id);

            this.logger.info(
              `${userNickname}[${tmp.user_id}] 撤回了消息 (${tmp.message_id})`
            );
            this.emit('onFriendRecall', tmp);
            break;
          }
          case 'group_recall': {
            const tmp: GroupRecallNoticeEvent = ev;

            // Get group name and nickname
            const groupName: string =
              await AccountDatabase.getInstance().getGroupName(tmp.group_id);
            const userNickname: string =
              await AccountDatabase.getInstance().getGroupMemberNickname(
                tmp.group_id,
                tmp.user_id
              );

            this.logger.info(
              `群 ${groupName}[${tmp.group_id}] 内 [${tmp.operator_id}] 撤回了 ${userNickname}[${tmp.user_id}] 发送的消息 (${tmp.message_id})`
            );
            this.emit('onFriendRecall', tmp);
            break;
          }
          case 'group_increase': {
            const tmp: GroupIncreaseNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.opeator_id}] ${
                tmp.sub_type === 'approve' ? '同意' : '邀请'
              } [${tmp.user_id}] 加入`
            );
            this.emit('onGroupIncrease', tmp);
            break;
          }
          case 'group_decrease': {
            const tmp: GroupDecreaseNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.opeator_id}] ${
                tmp.sub_type === 'leave'
                  ? '主动离开了群聊'
                  : `将成员 [${tmp.user_id}] 踢出群聊`
              }`
            );
            this.emit('onGroupDecrease', tmp);
            break;
          }
          case 'group_admin': {
            const tmp: GroupAdminNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.user_id}] ${
                tmp.sub_type === 'set' ? '被设为管理员' : '被移除管理员'
              }`
            );
            this.emit('onGroupAdmin', tmp);
            break;
          }
          case 'group_upload': {
            const tmp: GroupUploadNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.user_id}] 上传了文件: ${tmp.file.name}`
            );
            this.emit('onGroupUpload', tmp);
            break;
          }
          case 'group_ban': {
            const tmp: GroupBanNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.opeator_id}] ${
                tmp.sub_type === 'ban' ? '禁言了' : '解除禁言了'
              } 成员 [${tmp.user_id}]`
            );
            this.emit('onGroupBan', tmp);
            break;
          }
          case 'friend_add': {
            const tmp: FriendAddNoticeEvent = ev;
            this.logger.info(`新增了好友 [${tmp.user_id}]`);
            this.emit('onFriendAdd', tmp);
            break;
          }
          case 'notify':
            switch (ev.sub_type) {
              case 'poke': {
                const tmp: PokeNotifyNoticeEvent = ev;
                if (tmp.group_id !== undefined) {
                  this.logger.info(
                    `群 [${tmp.group_id}] 内 [${tmp.user_id}] 戳了 [${tmp.target_id}]`
                  );
                } else {
                  this.logger.info(`[${tmp.user_id}] 戳了你`);
                }
                this.emit('onPoke', tmp);
                break;
              }
              case 'lucky_king': {
                const tmp: GroupLuckyKingNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 发送的红包产生了运气王 [${tmp.target_id}]`
                );
                this.emit('onGroupLuckyKing', tmp);
                break;
              }
              case 'honor': {
                const tmp: GroupHonorNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 获得了荣誉: ${tmp.honor_type}`
                );
                this.emit('onGroupHonor', tmp);
                break;
              }
              case 'title': {
                const tmp: GroupTitleNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 获得了头衔: ${tmp.title}`
                );
                this.emit('onGroupTitle', tmp);
                break;
              }
              default:
                this.logger.error('检测到未知的通知上报', ev);
            }
            break;
          case 'group_card': {
            const tmp: GroupCardNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.user_id}] 更新了群名片: "${tmp.card_old}" -> "${tmp.card_new}"`
            );
            this.emit('onGroupCard', tmp);
            break;
          }
          case 'offline_file': {
            const tmp: FriendOfflineFileNoticeEvent = ev;
            this.logger.info(
              `收到 [${tmp.user_id}] 的离线文件: ${tmp.file.name}`
            );
            this.emit('onFriendOfflineFile', tmp);
            break;
          }
          case 'client_status': {
            this.emit('onClientStatus', ev);
            break;
          }
          case 'essence': {
            const tmp: GroupEssenceNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.operator_id}] ${
                tmp.sub_type === 'add' ? '添加了' : '移除了'
              } 精华消息 (${tmp.message_id})`
            );
            this.emit('onGroupEssence', tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的通知上报', ev);
        }
        break;
      case 'request':
        switch (ev.request_type) {
          case 'friend': {
            const tmp: FriendRequestEvent = ev;
            this.logger.info(
              `收到 [${tmp.user_id}] 的好友请求`,
              truncText(tmp.comment)
            );
            this.emit('onFriendRequest', tmp);
            break;
          }
          case 'group': {
            const tmp: GroupRequestEvent = ev;
            this.logger.info(
              `收到 [${tmp.user_id}] 的加群 [${tmp.group_id}] ${
                tmp.sub_type === 'add' ? '请求' : '邀请'
              }`,
              truncText(tmp.comment)
            );
            this.emit('onGroupRequest', tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的请求上报', ev);
        }
        break;
      case 'meta_event':
        switch (ev.meta_event_type) {
          case 'heartbeat':
            this.emit('onHeartbeat', ev);
            break;
          case 'lifecycle': {
            const tmp: LifecycleMetaEvent = ev;
            this.logger.info(
              `收到 Go-CqHttp 的生命周期上报: ${
                tmp.sub_type === 'connect'
                  ? '连接'
                  : tmp.sub_type === 'disable'
                  ? '禁用'
                  : '启用'
              }`
            );
            this.emit('onLifecycle', tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的元事件上报', ev);
        }
        break;
      case 'halo_event': {
        switch (ev.halo_event_type) {
          case 'call': {
            const tmp: CallHaloEvent = ev;
            this.logger.info(
              `收到插件 [${tmp.from}] 发送给插件 [${tmp.target}] 的方法调用: ${tmp.method_name}`
            );
            this.emitTarget('onCall', tmp.target, tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的自定义事件上报', ev);
        }
        break;
      }
      default:
        this.logger.error('检测到未知的上报', ev);
    }
  }

  /* Singleton */
  private constructor() {}
  public static getInstance(): EventDispatcher {
    if (EventDispatcher.instance === undefined) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }
}
