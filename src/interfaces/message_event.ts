/// Message event interfaces

export enum PrivateMessageTempSource {
  GroupChat = 0,
  Consult = 1,
  Search = 2,
  Movie = 3,
  HotChat = 4,
  Verification = 6,
  MultiChat = 7,
  Dating = 8,
  AddressBook = 9
}
export interface PrivateMessageEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'message';
  message_type: 'private';
  sub_type: 'friend' | 'group' | 'group_self' | 'other';
  message_id: bigint;
  user_id: bigint;
  message: string;
  raw_message: string;
  font: bigint;
  sender: Partial<{
    user_id: string;
    nickname: string;
    sex: 'male' | 'female' | 'unknown';
    age: bigint;
    group_id: string;
  }>;
  target_id: bigint;
  temp_source: PrivateMessageTempSource;
}

export interface GroupMessageEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'message';
  message_type: 'group';
  sub_type: 'normal' | 'anonymous' | 'notice';
  message_id: bigint;
  user_id: bigint;
  message: string;
  raw_message: string;
  font: bigint;
  sender: Partial<{
    user_id: string;
    nickname: string;
    sex: 'male' | 'female' | 'unknown';
    age: bigint;
    card: string;
    area: string;
    level: string;
    role: 'owner' | 'admin' | 'member';
    title: string;
  }>;
  group_id: bigint;
  anonymous: {
    id: bigint;
    name: string;
    flag: string;
  } | null;
}
