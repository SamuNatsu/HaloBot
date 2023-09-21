/// Request event interfaces

export interface FriendRequestEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'request';
  request_type: 'friend';
  user_id: bigint;
  comment: string;
  flag: string;
}

export interface GroupRequestEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'request';
  request_type: 'group';
  sub_type: 'add' | 'invite';
  group_id: bigint;
  user_id: bigint;
  comment: string;
  flag: string;
}
