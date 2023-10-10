/// Group essence message interface

/**
 * 群精华消息
 */
export interface GroupEssenceMessage {
  /**
   * 发送者 QQ 号
   */
  sender_id: bigint;

  /**
   * 发送者昵称
   */
  sender_nick: string;

  /**
   * 发送时间
   */
  sender_time: bigint;

  /**
   * 操作者 QQ 号
   */
  operator_id: bigint;

  /**
   * 操作者昵称
   */
  operator_nick: string;

  /**
   * 精华设置时间
   */
  operator_time: bigint;

  /**
   * 消息 ID
   */
  message_id: bigint;
}
