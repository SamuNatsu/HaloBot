/// Message event interface
import { MessagePart } from '../../MessagePart';
import { Event } from '../Event';

/**
 * 消息事件
 */
export interface MessageEvent extends Event {
  post_type: 'message' | 'message_sent';

  /**
   * 消息类型
   */
  message_type: 'group' | 'private';

  /**
   * 消息子类型
   */
  sub_type:
    | 'anonymous'
    | 'friend'
    | 'group'
    | 'group_self'
    | 'normal'
    | 'notice';

  /**
   * 消息 ID
   */
  message_id: bigint;

  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 消息链
   */
  message: string | MessagePart[];

  /**
   * CQ 码格式的消息
   */
  raw_message: string;

  /**
   * 字体
   */
  font: bigint;
}
