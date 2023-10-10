/// Friend info interface

/**
 * 好友信息
 */
export interface FriendInfo {
  /**
   * QQ 号
   */
  user_id: bigint;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 备注名
   */
  remark: string;
}
