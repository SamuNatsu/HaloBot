/// Message sender interface

/**
 * 消息发送者
 */
export interface MessageSender {
  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 性别
   */
  sex: 'female' | 'male' | 'unknown';

  /**
   * 年龄
   */
  age?: bigint;
}
