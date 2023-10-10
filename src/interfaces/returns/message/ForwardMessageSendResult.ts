/// Forward message send result interface

/**
 * 合并转发发送结果
 */
export interface ForwardMessageSendResult {
  /**
   * 消息 ID
   */
  message_id: bigint;

  /**
   * 转发消息 ID
   */
  forward_id: string;
}
