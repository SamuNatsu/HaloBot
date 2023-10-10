/// Forward message info interface

/**
 * 合并转发消息信息
 */
export interface ForwardMessageInfo {
  /**
   * 消息内容
   */
  content: string;

  /**
   * 发送者
   */
  sender: {
    /**
     * 昵称
     */
    nickname: string;

    /**
     * QQ 号
     */
    user_id: bigint;
  };

  /**
   * 发送时间
   */
  time: bigint;
}
