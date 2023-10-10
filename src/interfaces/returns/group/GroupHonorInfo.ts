/// Group honor info interface

/**
 * 群荣耀信息
 */
export interface GroupHonorInfo {
  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 当前龙王
   */
  current_talkative?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 持续天数
     */
    day_count: bigint;
  };

  /**
   * 历史龙王
   */
  talkative_list?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 荣耀描述
     */
    description: string;
  }[];

  /**
   * 群聊之火
   */
  performer_list?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 荣耀描述
     */
    description: string;
  }[];

  /**
   * 群聊炽焰
   */
  legend_list?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 荣耀描述
     */
    description: string;
  }[];

  /**
   * 冒尖小春笋
   */
  strong_newbie_list?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 荣耀描述
     */
    description: string;
  }[];

  /**
   * 快乐之源
   */
  emotion_list?: {
    /**
     * QQ 号
     */
    user_id: bigint;

    /**
     * 昵称
     */
    nickname: string;

    /**
     * 头像 URL
     */
    avatar: string;

    /**
     * 荣耀描述
     */
    description: string;
  }[];
}
