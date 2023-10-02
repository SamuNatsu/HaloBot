/// Event dispatcher model
import { Plugin } from '../interfaces/Plugin';
import { CallHaloEvent } from '../interfaces/halo_event';
import {
  GroupMessageEvent,
  PrivateMessageEvent
} from '../interfaces/message_event';
import { LifecycleMetaEvent } from '../interfaces/meta_event';
import {
  FriendAddNoticeEvent,
  FriendOfflineFileNoticeEvent,
  FriendRecallNoticeEvent,
  GroupAdminNoticeEvent,
  GroupBanNoticeEvent,
  GroupCardNoticeEvent,
  GroupDecreaseNoticeEvent,
  GroupEssenceNoticeEvent,
  GroupHonorNotifyNoticeEvent,
  GroupIncreaseNoticeEvent,
  GroupLuckyKingNotifyNoticeEvent,
  GroupRecallNoticeEvent,
  GroupTitleNotifyNoticeEvent,
  GroupUploadNoticeEvent,
  PokeNotifyNoticeEvent
} from '../interfaces/notice_event';
import {
  FriendRequestEvent,
  GroupRequestEvent
} from '../interfaces/request_event';
import { deepFreezeObject, overflowTrunc, replaceWhitespaces } from '../utils';
import { Logger } from './Logger';

/* Export class */
export class EventDispatcher {
  /* Properties */
  private logger: Logger = new Logger('EventDispatcher');
  private listenerMap: Map<string, [string, Function][]> = new Map();

  /* Methods */
  private relay(name: string, ev: any): void {
    const listeners: [string, Function][] | undefined =
      this.listenerMap.get(name);
    if (listeners === undefined) {
      return;
    }
    for (const i of listeners) {
      try {
        i[1](ev);
      } catch (err: unknown) {
        this.logger.error(
          `插件 [${i[0]}] 抛出了未被捕获的错误于：${name}`,
          err
        );
      }
    }
  }
  private relayTarget(name: string, target: string, ev: CallHaloEvent): void {
    const listeners: [string, Function][] | undefined =
      this.listenerMap.get(name);
    if (listeners === undefined) {
      return;
    }
    const tgt: [string, Function] | undefined = listeners.find(
      (value: [string, Function]): boolean => value[0] === target
    );
    if (tgt === undefined) {
      ev.reject(new Error(`不存在可以响应方法调用的插件: ${target}`));
      return;
    }
    try {
      tgt[1](ev);
    } catch (err: unknown) {
      this.logger.error(
        `插件 [${target}] 抛出了未被捕获的错误于：${name}`,
        err
      );
    }
  }

  public register(plugin: Plugin): void {
    for (const i in plugin) {
      if (!/^on[A-Z]/.test(i) || !(typeof plugin[i] === 'function')) {
        continue;
      }
      if (!this.listenerMap.has(i)) {
        this.listenerMap.set(i, []);
      }
      this.listenerMap
        .get(i)
        ?.push([plugin.meta.namespace, (plugin[i] as Function).bind(plugin)]);
    }
  }
  public clear(): void {
    this.listenerMap.clear();
  }
  public dispatch(ev: any): void {
    deepFreezeObject(ev);
    switch (ev.post_type) {
      case 'message':
      case 'message_sent':
        switch (ev.message_type) {
          case 'private': {
            const tmp: PrivateMessageEvent = ev;
            this.logger.info(
              `收到 ${tmp.sender.nickname}[${tmp.user_id}] 的消息 (${tmp.message_id})`,
              overflowTrunc(replaceWhitespaces(tmp.raw_message))
            );
            this.relay('onPrivateMessage', tmp);
            break;
          }
          case 'group': {
            const tmp: GroupMessageEvent = ev;
            this.logger.info(
              `收到群 [${tmp.group_id}] 内 ${
                tmp.sender.card?.length === 0
                  ? tmp.sender.nickname
                  : tmp.sender.card
              }[${tmp.user_id}] 的消息 (${tmp.message_id})`,
              overflowTrunc(replaceWhitespaces(tmp.raw_message))
            );
            this.relay('onGroupMessage', tmp);
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
            this.logger.info(`[${tmp.user_id}] 撤回了消息 (${tmp.message_id})`);
            this.relay('onFriendRecall', tmp);
            break;
          }
          case 'group_recall': {
            const tmp: GroupRecallNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.operator_id}] 撤回了 [${tmp.user_id}] 发送的消息 (${tmp.message_id})`
            );
            this.relay('onFriendRecall', tmp);
            break;
          }
          case 'group_increase': {
            const tmp: GroupIncreaseNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.opeator_id}] ${
                tmp.sub_type === 'approve' ? '同意' : '邀请'
              } [${tmp.user_id}] 加入`
            );
            this.relay('onGroupIncrease', tmp);
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
            this.relay('onGroupDecrease', tmp);
            break;
          }
          case 'group_admin': {
            const tmp: GroupAdminNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.user_id}] ${
                tmp.sub_type === 'set' ? '被设为管理员' : '被移除管理员'
              }`
            );
            this.relay('onGroupAdmin', tmp);
            break;
          }
          case 'group_upload': {
            const tmp: GroupUploadNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.user_id}] 上传了文件: ${tmp.file.name}`
            );
            this.relay('onGroupUpload', tmp);
            break;
          }
          case 'group_ban': {
            const tmp: GroupBanNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.opeator_id}] ${
                tmp.sub_type === 'ban' ? '禁言了' : '解除禁言了'
              } 成员 [${tmp.user_id}]`
            );
            this.relay('onGroupBan', tmp);
            break;
          }
          case 'friend_add': {
            const tmp: FriendAddNoticeEvent = ev;
            this.logger.info(`新增了好友 [${tmp.user_id}]`);
            this.relay('onFriendAdd', tmp);
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
                this.relay('onPoke', tmp);
                break;
              }
              case 'lucky_king': {
                const tmp: GroupLuckyKingNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 发送的红包产生了运气王 [${tmp.target_id}]`
                );
                this.relay('onGroupLuckyKing', tmp);
                break;
              }
              case 'honor': {
                const tmp: GroupHonorNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 获得了荣誉: ${tmp.honor_type}`
                );
                this.relay('onGroupHonor', tmp);
                break;
              }
              case 'title': {
                const tmp: GroupTitleNotifyNoticeEvent = ev;
                this.logger.info(
                  `群 [${tmp.group_id}] 内 [${tmp.user_id}] 获得了头衔: ${tmp.title}`
                );
                this.relay('onGroupTitle', tmp);
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
            this.relay('onGroupCard', tmp);
            break;
          }
          case 'offline_file': {
            const tmp: FriendOfflineFileNoticeEvent = ev;
            this.logger.info(
              `收到 [${tmp.user_id}] 的离线文件: ${tmp.file.name}`
            );
            this.relay('onFriendOfflineFile', tmp);
            break;
          }
          case 'client_status': {
            this.relay('onClientStatus', ev);
            break;
          }
          case 'essence': {
            const tmp: GroupEssenceNoticeEvent = ev;
            this.logger.info(
              `群 [${tmp.group_id}] 内 [${tmp.operator_id}] ${
                tmp.sub_type === 'add' ? '添加了' : '移除了'
              } 精华消息 (${tmp.message_id})`
            );
            this.relay('onGroupEssence', tmp);
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
              overflowTrunc(replaceWhitespaces(tmp.comment))
            );
            this.relay('onFriendRequest', tmp);
            break;
          }
          case 'group': {
            const tmp: GroupRequestEvent = ev;
            this.logger.info(
              `收到 [${tmp.user_id}] 的加群 [${tmp.group_id}] ${
                tmp.sub_type === 'add' ? '请求' : '邀请'
              }`,
              overflowTrunc(replaceWhitespaces(tmp.comment))
            );
            this.relay('onGroupRequest', tmp);
            break;
          }
          default:
            this.logger.error('检测到未知的请求上报', ev);
        }
        break;
      case 'meta_event':
        switch (ev.meta_event_type) {
          case 'heartbeat':
            this.relay('onHeartbeat', ev);
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
            this.relay('onLifecycle', tmp);
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
            if (tmp.target !== undefined) {
              this.logger.info(
                `收到上报给插件 [${tmp.target}] 的方法调用: ${tmp.method_name}`
              );
              this.relayTarget('onCall', tmp.target, tmp);
            } else {
              this.logger.info(`收到全局方法调用: ${tmp.method_name}`);
              this.relay('onCall', tmp);
            }
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
}
