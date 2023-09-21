/// Plugin interface
import { Bot } from '../models/Bot';
import { GroupMessageEvent, PrivateMessageEvent } from './message_event';
import { HeartbeatMetaEvent, LifecycleMetaEvent } from './meta_event';
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
  OfflineFileNoticeEvent,
  PokeNotifyNoticeEvent
} from './notice_event';
import { FriendRequestEvent, GroupRequestEvent } from './request_event';

export interface Plugin {
  /* Properties */
  meta: {
    name: string;
    author: string;
    info: string;
    priority: number;
    version: string;
    haloVersion: string;
  };
  [key: string]: any;

  /* Lifecycle */
  onStart?(bot: Bot): void;
  onStop?(bot: Bot): void;

  /* Message */
  onPrivateMessage?(bot: Bot, ev: PrivateMessageEvent): void;
  onGroupMessage?(bot: Bot, ev: GroupMessageEvent): void;

  /* Notice */
  onFriendRecall?(bot: Bot, ev: FriendRecallNoticeEvent): void;
  onGroupRecall?(bot: Bot, ev: GroupRecallNoticeEvent): void;
  onGroupIncrease?(bot: Bot, ev: GroupIncreaseNoticeEvent): void;
  onGroupDecrease?(bot: Bot, ev: GroupDecreaseNoticeEvent): void;
  onGroupAdminUpdate?(bot: Bot, ev: GroupAdminNoticeEvent): void;
  onGroupFileUpload?(bot: Bot, ev: GroupUploadNoticeEvent): void;
  onGroupBan?(bot: Bot, ev: GroupBanNoticeEvent): void;
  onFriendAdd?(bot: Bot, ev: FriendAddNoticeEvent): void;
  onPoke?(bot: Bot, ev: PokeNotifyNoticeEvent): void;
  onGroupLuckyKing?(bot: Bot, ev: GroupLuckyKingNotifyNoticeEvent): void;
  onGroupHonorUpdate?(bot: Bot, ev: GroupHonorNotifyNoticeEvent): void;
  onGroupTitleUpdate?(bot: Bot, ev: GroupTitleNotifyNoticeEvent): void;
  onGroupCardUpdate?(bot: Bot, ev: GroupCardNoticeEvent): void;
  onOfflineFile?(bot: Bot, ev: OfflineFileNoticeEvent): void;
  onClientStatusUpdate?(bot: Bot, ev: ClientStatusNoticeEvent): void;
  onGroupEssenceUpdate?(bot: Bot, ev: GroupEssenceNoticeEvent): void;

  /* Request */
  onFriendRequest?(bot: Bot, ev: FriendRequestEvent): void;
  onGroupRequest?(bot: Bot, ev: GroupRequestEvent): void;

  /* Meta event */
  onHeartbeat?(bot: Bot, ev: HeartbeatMetaEvent): void;
  onLifecycle?(bot: Bot, ev: LifecycleMetaEvent): void;
}
