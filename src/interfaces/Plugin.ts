/// Plugin interface
import { CallCustomEvent } from '../interfaces/custom_event';
import {
  GroupMessageEvent,
  PrivateMessageEvent
} from '../interfaces/message_event';
import {
  HeartbeatMetaEvent,
  LifecycleMetaEvent
} from '../interfaces/meta_event';
import {
  ClientStatusNoticeEvent,
  FriendAddNoticeEvent,
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
  FriendOfflineFileNoticeEvent,
  PokeNotifyNoticeEvent
} from '../interfaces/notice_event';
import {
  FriendRequestEvent,
  GroupRequestEvent
} from '../interfaces/request_event';
import { Bot } from '../models/Bot';
import { Logger } from '../models/Logger';

/* Export interfaces */
export interface Plugin {
  [key: string]:
    | string
    | number
    | bigint
    | boolean
    | symbol
    | undefined
    | object
    | ((this: InjectedPlugin, ...args: any[]) => any);

  /* Properties */
  meta: {
    namespace: string;
    name: string;
    author: string;
    description: string;
    priority: number;
    version: string;
    botVersion: string;
  };

  /* Lifecycle */
  onStart?(this: InjectedPlugin): void | Promise<void>;
  onStop?(this: InjectedPlugin): void | Promise<void>;

  /* Message */
  onGroupMessage?(this: InjectedPlugin, ev: GroupMessageEvent): void;
  onPrivateMessage?(this: InjectedPlugin, ev: PrivateMessageEvent): void;

  /* Notice */
  onClientStatus?(this: InjectedPlugin, ev: ClientStatusNoticeEvent): void;

  onPoke?(this: InjectedPlugin, ev: PokeNotifyNoticeEvent): void;

  onFriendAdd?(this: InjectedPlugin, ev: FriendAddNoticeEvent): void;
  onFriendOfflineFile?(
    this: InjectedPlugin,
    ev: FriendOfflineFileNoticeEvent
  ): void;
  onFriendRecall?(this: InjectedPlugin, ev: FriendRecallNoticeEvent): void;

  onGroupAdmin?(this: InjectedPlugin, ev: GroupAdminNoticeEvent): void;
  onGroupBan?(this: InjectedPlugin, ev: GroupBanNoticeEvent): void;
  onGroupCard?(this: InjectedPlugin, ev: GroupCardNoticeEvent): void;
  onGroupDecrease?(this: InjectedPlugin, ev: GroupDecreaseNoticeEvent): void;
  onGroupEssence?(this: InjectedPlugin, ev: GroupEssenceNoticeEvent): void;
  onGroupHonor?(this: InjectedPlugin, ev: GroupHonorNotifyNoticeEvent): void;
  onGroupIncrease?(this: InjectedPlugin, ev: GroupIncreaseNoticeEvent): void;
  onGroupLuckyKing?(
    this: InjectedPlugin,
    ev: GroupLuckyKingNotifyNoticeEvent
  ): void;
  onGroupUpload?(this: InjectedPlugin, ev: GroupUploadNoticeEvent): void;
  onGroupRecall?(this: InjectedPlugin, ev: GroupRecallNoticeEvent): void;
  onGroupTitle?(this: InjectedPlugin, ev: GroupTitleNotifyNoticeEvent): void;

  /* Request */
  onFriendRequest?(this: InjectedPlugin, ev: FriendRequestEvent): void;
  onGroupRequest?(this: InjectedPlugin, ev: GroupRequestEvent): void;

  /* Meta event */
  onHeartbeat?(this: InjectedPlugin, ev: HeartbeatMetaEvent): void;
  onLifecycle?(this: InjectedPlugin, ev: LifecycleMetaEvent): void;

  /* Custom event */
  onCall?(this: InjectedPlugin, ev: CallCustomEvent): void;
}

interface InjectedPluginProperties {
  readonly bot: Bot;
  readonly logger: Logger;
  readonly currentPluginDir: string;
}

export type InjectedPlugin = Plugin & InjectedPluginProperties;
