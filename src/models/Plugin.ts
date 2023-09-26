/// Plugin model
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
import { PluginMeta } from '../interfaces/plugin_meta';
import {
  FriendRequestEvent,
  GroupRequestEvent
} from '../interfaces/request_event';
import { Bot } from './Bot';
import { Logger } from './Logger';

/* Export class */
export class Plugin {
  [key: string]: any;

  /* Properties */
  protected bot: Bot;
  protected logger: Logger;

  public readonly meta: PluginMeta;

  /* Constructor */
  public constructor(bot: Bot, logger: Logger, meta: PluginMeta) {
    this.bot = bot;
    this.logger = logger;
    this.meta = meta;
  }

  /* Lifecycle */
  public onStart?(): void | Promise<void>;
  public onStop?(): void | Promise<void>;

  /* Message */
  public onGroupMessage?(ev: GroupMessageEvent): void;
  public onPrivateMessage?(ev: PrivateMessageEvent): void;

  /* Notice */
  public onClientStatus?(ev: ClientStatusNoticeEvent): void;

  public onPoke?(ev: PokeNotifyNoticeEvent): void;

  public onFriendAdd?(ev: FriendAddNoticeEvent): void;
  public onFriendOfflineFile?(ev: FriendOfflineFileNoticeEvent): void;
  public onFriendRecall?(ev: FriendRecallNoticeEvent): void;

  public onGroupAdmin?(ev: GroupAdminNoticeEvent): void;
  public onGroupBan?(ev: GroupBanNoticeEvent): void;
  public onGroupCard?(ev: GroupCardNoticeEvent): void;
  public onGroupDecrease?(ev: GroupDecreaseNoticeEvent): void;
  public onGroupEssence?(ev: GroupEssenceNoticeEvent): void;
  public onGroupHonor?(ev: GroupHonorNotifyNoticeEvent): void;
  public onGroupIncrease?(ev: GroupIncreaseNoticeEvent): void;
  public onGroupLuckyKing?(ev: GroupLuckyKingNotifyNoticeEvent): void;
  public onGroupUpload?(ev: GroupUploadNoticeEvent): void;
  public onGroupRecall?(ev: GroupRecallNoticeEvent): void;
  public onGroupTitle?(ev: GroupTitleNotifyNoticeEvent): void;

  /* Request */
  public onFriendRequest?(ev: FriendRequestEvent): void;
  public onGroupRequest?(ev: GroupRequestEvent): void;

  /* Meta event */
  public onHeartbeat?(ev: HeartbeatMetaEvent): void;
  public onLifecycle?(ev: LifecycleMetaEvent): void;

  /* Custom event */
  public onCall?(ev: CallCustomEvent): void;
}
