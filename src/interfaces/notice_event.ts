/// Notice event interfaces

export interface FriendRecallNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'friend_recall';
  user_id: bigint;
  message_id: bigint;
}

export interface GroupRecallNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_recall';
  group_id: bigint;
  user_id: bigint;
  operator_id: bigint;
  message_id: bigint;
}

export interface GroupIncreaseNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_increase';
  sub_type: 'approve' | 'invite';
  group_id: bigint;
  opeator_id: bigint;
  user_id: bigint;
}

export interface GroupDecreaseNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_decrease';
  sub_type: 'leave' | 'kick' | 'kick_me';
  group_id: bigint;
  opeator_id: bigint;
  user_id: bigint;
}

export interface GroupAdminNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_admin';
  sub_type: 'set' | 'unset';
  group_id: bigint;
  user_id: bigint;
}

export interface GroupUploadNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_upload';
  group_id: bigint;
  user_id: bigint;
  file: {
    id: string;
    name: string;
    size: bigint;
    busid: bigint;
  };
}

export interface GroupBanNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_ban';
  sub_type: 'ban' | 'lift_ban';
  group_id: bigint;
  opeator_id: bigint;
  user_id: bigint;
  duration: bigint;
}

export interface FriendAddNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'friend_add';
  user_id: bigint;
}

export interface PokeNotifyNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'notify';
  sub_type: 'poke';
  sender_id?: bigint;
  group_id?: bigint;
  user_id: bigint;
  target_id: bigint;
}

export interface GroupLuckyKingNotifyNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'notify';
  sub_type: 'lucky_king';
  group_id: bigint;
  user_id: bigint;
  target_id: bigint;
}

export interface GroupHonorNotifyNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'notify';
  sub_type: 'honor';
  group_id: bigint;
  user_id: bigint;
  honor_type: 'talkative' | 'performer' | 'emotion';
}

export interface GroupTitleNotifyNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'notify';
  sub_type: 'title';
  group_id: bigint;
  user_id: bigint;
  title: string;
}

export interface GroupCardNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'group_card';
  group_id: bigint;
  user_id: bigint;
  card_new: string;
  card_old: string;
}

export interface OfflineFileNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'offline_file';
  user_id: bigint;
  file: {
    name: string;
    size: bigint;
    url: string;
  };
}

export interface ClientStatusNoticeEvent {
  post_type: 'notice';
  notice_type: 'client_status';
  client: {
    app_id: bigint;
    device_name: string;
    device_kind: string;
  };
  online: boolean;
}

export interface GroupEssenceNoticeEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'notice';
  notice_type: 'essence';
  sub_type: 'add' | 'delete';
  group_id: bigint;
  sender_id: bigint;
  operator_id: bigint;
  message_id: number;
}
