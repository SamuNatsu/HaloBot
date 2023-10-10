/// Message info interface
import { MessagePart } from '../../MessagePart';

/**
 * 消息信息
 */
export interface MessageInfo {
  /**
   * 是否为群聊消息
   */
  group: boolean;

  /**
   * 群号
   */
  group_id?: bigint;

  /**
   * 消息 ID
   */
  message_id: bigint;

  /**
   * 消息真实 ID
   */
  real_id: bigint;

  /**
   * 消息类型
   */
  message_type: 'private' | 'group';

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

  /**
   * 消息内容
   */
  message: string | MessagePart[];

  /**
   * 原始消息内容
   */
  raw_message: string;
}
