/// Message part interface

/**
 * 消息片段
 */
export interface MessagePart {
  /**
   * 消息类型
   */
  type: string;

  /**
   * 消息数据
   */
  data: Record<string, any>;
}
