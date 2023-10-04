/// Private message event interface
import { MessageEvent } from './MessageEvent';
import { MessageSender } from './MessageSender';

/**
 * 临时会话来源
 */
enum PrivateMessageTempSource {
  /**
   * 群聊
   */
  GroupChat = 0,

  /**
   * QQ 咨询
   */
  Consult = 1,

  /**
   * 查找
   */
  Search = 2,

  /**
   * QQ电影
   */
  Movie = 3,

  /**
   * 热聊
   */
  HotChat = 4,

  /**
   * 验证消息
   */
  Verification = 6,

  /**
   * 多人聊天
   */
  MultiChat = 7,

  /**
   * 约会
   */
  Dating = 8,

  /**
   * 通讯录
   */
  AddressBook = 9
}

/**
 * 私聊消息事件
 */
export interface PrivateMessageEvent extends MessageEvent {
  message_type: 'private';
  sub_type: 'friend' | 'group' | 'group_self';

  /**
   * 发送人信息
   */
  sender: MessageSender & {
    /**
     * 临时群消息来源群号
     */
    group_id?: bigint;
  };

  /**
   * 接收者 QQ 号
   */
  target_id: bigint;

  /**
   * 临时会话来源
   */
  temp_source: PrivateMessageTempSource;
}
