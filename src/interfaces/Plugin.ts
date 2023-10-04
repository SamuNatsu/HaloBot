/// Plugin interface
import { Knex } from 'knex';
import { API } from '../models/API';
import { Logger } from '../models/Logger';
import { CallHaloEvent } from './events/halo/CallHaloEvent';
import { GroupMessageEvent } from './events/message/GroupMessageEvent';
import { PrivateMessageEvent } from './events/message/PrivateMessageEvent';
import { HeartbeatMetaEvent } from './events/meta/HeartbeatMetaEvent';
import { LifecycleMetaEvent } from './events/meta/LifecycleMetaEvent';
import { ClientStatusNoticeEvent } from './events/notice/ClientStatusNoticeEvent';
import { FriendAddNoticeEvent } from './events/notice/FriendAddNoticeEvent';
import { FriendOfflineFileNoticeEvent } from './events/notice/FriendOfflineFileNoticeEvent';
import { FriendRecallNoticeEvent } from './events/notice/FriendRecallNoticeEvent';
import { GroupAdminNoticeEvent } from './events/notice/GroupAdminNoticeEvent';
import { GroupBanNoticeEvent } from './events/notice/GroupBanNoticeEvent';
import { GroupCardNoticeEvent } from './events/notice/GroupCardNoticeEvent';
import { GroupDecreaseNoticeEvent } from './events/notice/GroupDecreaseNoticeEvent';
import { GroupEssenceNoticeEvent } from './events/notice/GroupEssenceNoticeEvent';
import { GroupHonorNotifyNoticeEvent } from './events/notice/GroupHonorNotifyNoticeEvent';
import { GroupIncreaseNoticeEvent } from './events/notice/GroupIncreaseNoticeEvent';
import { GroupLuckyKingNotifyNoticeEvent } from './events/notice/GroupLuckyKingNotifyNoticeEvent';
import { GroupRecallNoticeEvent } from './events/notice/GroupRecallNoticeEvent';
import { GroupTitleNotifyNoticeEvent } from './events/notice/GroupTitleNotifyNoticeEvent';
import { GroupUploadNoticeEvent } from './events/notice/GroupUploadNoticeEvent';
import { PokeNotifyNoticeEvent } from './events/notice/PokeNotifyNoticeEvent';
import { FriendRequestEvent } from './events/request/FriendRequestEvent';
import { GroupRequestEvent } from './events/request/GroupRequestEvent';

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
  onGroupRecall?(this: InjectedPlugin, ev: GroupRecallNoticeEvent): void;
  onGroupTitle?(this: InjectedPlugin, ev: GroupTitleNotifyNoticeEvent): void;
  onGroupUpload?(this: InjectedPlugin, ev: GroupUploadNoticeEvent): void;
  onPoke?(this: InjectedPlugin, ev: PokeNotifyNoticeEvent): void;

  /* Request */
  onFriendRequest?(this: InjectedPlugin, ev: FriendRequestEvent): void;
  onGroupRequest?(this: InjectedPlugin, ev: GroupRequestEvent): void;

  /* Meta event */
  onHeartbeat?(this: InjectedPlugin, ev: HeartbeatMetaEvent): void;
  onLifecycle?(this: InjectedPlugin, ev: LifecycleMetaEvent): void;

  /* Halo event */
  onCall?(this: InjectedPlugin, ev: CallHaloEvent): void;
}

interface InjectedPluginProperties {
  /**
   * HaloBot API 接口
   */
  readonly api: API;

  /**
   * 插件目录
   */
  readonly currentPluginDir: string;

  /**
   * 插件本地数据库
   */
  readonly db: Knex;

  /**
   * 插件日志记录器
   */
  readonly logger: Logger;
}

export type InjectedPlugin = Plugin & InjectedPluginProperties;
