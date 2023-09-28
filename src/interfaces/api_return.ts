/// API return interfaces

export enum SafelyLevel {
  Safe = 1,
  Unknown = 2,
  Dangerous = 3
}

export interface LoginInfo {
  user_id: bigint;
  nickname: string;
}
export interface ModelShowInfo {
  model_show: string;
  need_pay: string;
}
export interface OnlineClientInfo {
  app_id: bigint;
  device_name: string;
  device_kind: string;
}

export interface StrangerInfo {
  user_id: bigint;
  nickname: string;
  sex: 'male' | 'female' | 'unknown';
  age: bigint;
  qid: string;
  level: bigint;
  login_days: bigint;
}
export interface FriendInfo {
  user_id: bigint;
  nickname: string;
  remark: string;
}
export interface UnidirectionalFriendInfo {
  user_id: bigint;
  nickname: string;
  source: string;
}

export interface ForwardMessage {
  content: string;
  sender: {
    nickname: string;
    user_id: bigint;
  };
  time: bigint;
}
export interface ForwardMessageInfo {
  message_id: bigint;
  forward_id: string;
}

export interface MsgInfo {
  group: boolean;
  group_id?: bigint;
  message_id: bigint;
  real_id: bigint;
  message_type: 'private' | 'group';
  sender: {
    nickname: string;
    user_id: bigint;
  };
  time: bigint;
  message: string;
  raw_message: string;
}

export interface ImageFileInfo {
  size: bigint;
  filename: string;
  url: string;
}
export interface ImageOcrData {
  texts: {
    text: string;
    confidence: bigint;
    coordinates: number[];
  }[];
  language: string;
}

export interface GroupInfo {
  group_id: bigint;
  group_name: string;
  group_memo: string;
  group_create_time: bigint;
  group_level: bigint;
  member_count: bigint;
  max_member_count: bigint;
}
export interface GroupMemberInfo {
  group_id: bigint;
  user_id: bigint;
  nickname: string;
  card: string;
  sex: 'male' | 'female' | 'unknown';
  age: bigint;
  area: string;
  join_time: bigint;
  last_sent_time: bigint;
  level: string;
  role: 'owner' | 'admin' | 'member';
  unfriendly: boolean;
  title: string;
  title_expire_time: bigint;
  card_changeable: boolean;
  shut_up_timestamp: bigint;
}
export interface GroupHonorInfo {
  group_id: bigint;
  current_talkative?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    day_count: bigint;
  };
  talkative_list?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    description: string;
  }[];
  performer_list?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    description: string;
  }[];
  legend_list?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    description: string;
  }[];
  strong_newbie_list?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    description: string;
  }[];
  emotion_list?: {
    user_id: bigint;
    nickname: string;
    avatar: string;
    description: string;
  }[];
}
export interface GroupSystemMsg {
  invited_requests: {
    request_id: bigint;
    invitor_uin: bigint;
    invitor_nick: string;
    group_id: bigint;
    group_name: string;
    checked: boolean;
    actor: bigint;
  }[] | null;
  join_requests: {
    request_id: bigint;
    requester_uin: bigint;
    requester_nick: string;
    message: string;
    group_id: bigint;
    group_name: string;
    checked: boolean;
    actor: bigint;
  }[] | null;
}
export interface GroupEssenceMsg {
  sender_id: bigint;
  sender_nick: string;
  sender_time: bigint;
  operator_id: bigint;
  operator_nick: string;
  operator_time: bigint;
  message_id: bigint;
}
export interface GroupAtAllRemain {
  can_at_all: boolean;
  remain_at_all_count_for_group: bigint;
  remain_at_all_count_for_uin: bigint;
}

export interface GroupNotice {
  sender_id: bigint;
  publish_time: bigint;
  message: {
    text: string;
    images: {
      height: string;
      width: string;
      id: string;
    }[];
  };
}

export interface GroupFileSystemInfo {
  file_count: bigint;
  limit_count: bigint;
  used_space: bigint;
  total_space: bigint;
}
export interface GroupFileFolderInfo {
  files: {
    group_id: bigint;
    file_id: string;
    file_name: string;
    busid: bigint;
    file_size: bigint;
    upload_time: bigint;
    dead_time: bigint;
    modify_time: bigint;
    download_times: bigint;
    uploader: bigint;
    uploader_name: string;
  }[];
  folders: {
    group_id: bigint;
    folder_id: string;
    folder_name: string;
    create_time: bigint;
    creator: bigint;
    creator_name: string;
    total_file_count: bigint;
  }[];
}

export interface VersionInfo {
  app_name: string;
  app_version: string;
  app_full_name: string;
  protocol_name: bigint;
  protocol_version: string;
  coolq_edition: string;
  coolq_directory: string;
  'go-cqhttp': boolean;
  plugin_version: string;
  plugin_build_bigint: bigint;
  plugin_build_configuration: string;
  runtime_version: string;
  runtime_os: string;
  version: string;
}
export interface Status {
  app_initialized: boolean;
  app_enabled: boolean;
  plugins_good: boolean;
  app_good: boolean;
  online: boolean;
  good: boolean;
  stat: {
    packet_received: bigint;
    packet_sent: bigint;
    packet_lost: bigint;
    message_received: bigint;
    message_sent: bigint;
    disconnect_times: bigint;
    lost_times: bigint;
    last_message_time: bigint;
  };
}
