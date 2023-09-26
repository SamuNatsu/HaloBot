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

/* Export interface */
export interface Plugin {
  [key: string]: any;

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
  onStart?(bot: Bot, logger: Logger): void | Promise<void>;
  onStop?(): void | Promise<void>;

  /* Message */
  onGroupMessage?(ev: GroupMessageEvent): void;
  onPrivateMessage?(ev: PrivateMessageEvent): void;

  /* Notice */
  onClientStatus?(ev: ClientStatusNoticeEvent): void;

  onPoke?(ev: PokeNotifyNoticeEvent): void;

  onFriendAdd?(ev: FriendAddNoticeEvent): void;
  onFriendOfflineFile?(ev: FriendOfflineFileNoticeEvent): void;
  onFriendRecall?(ev: FriendRecallNoticeEvent): void;

  onGroupAdmin?(ev: GroupAdminNoticeEvent): void;
  onGroupBan?(ev: GroupBanNoticeEvent): void;
  onGroupCard?(ev: GroupCardNoticeEvent): void;
  onGroupDecrease?(ev: GroupDecreaseNoticeEvent): void;
  onGroupEssence?(ev: GroupEssenceNoticeEvent): void;
  onGroupHonor?(ev: GroupHonorNotifyNoticeEvent): void;
  onGroupIncrease?(ev: GroupIncreaseNoticeEvent): void;
  onGroupLuckyKing?(ev: GroupLuckyKingNotifyNoticeEvent): void;
  onGroupUpload?(ev: GroupUploadNoticeEvent): void;
  onGroupRecall?(ev: GroupRecallNoticeEvent): void;
  onGroupTitle?(ev: GroupTitleNotifyNoticeEvent): void;

  /* Request */
  onFriendRequest?(ev: FriendRequestEvent): void;
  onGroupRequest?(ev: GroupRequestEvent): void;

  /* Meta event */
  onHeartbeat?(ev: HeartbeatMetaEvent): void;
  onLifecycle?(ev: LifecycleMetaEvent): void;

  /* Custom event */
  onCall?(ev: CallCustomEvent): void;
}
