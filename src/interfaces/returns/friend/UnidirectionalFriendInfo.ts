/// Unidirectional friend info

/**
 * 单项好友信息
 */
export interface UnidirectionalFriendInfo {
  /**
   * QQ 号
   */
  user_id: bigint;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 来源
   */
  source: string;
}
