/// Message event interfaces
import { CqEvent } from './CqEvent';

/**
 * Go-CqHttp 临时会话来源
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
 * Go-CqHttp 消息发送者
 */
interface MessageSender {
  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 发送者昵称
   */
  nickname: string;

  /**
   * 发送者性别
   */
  sex: 'male' | 'female' | 'unknown';

  /**
   * 发送者年龄
   */
  age?: bigint;
}

/**
 * Go-CqHttp 消息事件
 */
interface MessageEvent extends CqEvent {
  post_type: 'message' | 'message_send';

  /**
   * 消息类型
   */
  message_type: 'private' | 'group';

  /**
   * 消息子类型
   */
  sub_type:
    | 'friend'
    | 'group'
    | 'group_self'
    | 'normal'
    | 'anonymous'
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
  message: string;

  /**
   * CQ 码格式的消息
   */
  raw_message: string;

  /**
   * 字体
   */
  font: bigint;
}

/**
 * Go-CqHttp 私聊消息事件
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

/**
 * Go-CqHttp 群聊消息事件
 */
export interface GroupMessageEvent extends MessageEvent {
  message_type: 'group';
  sub_type: 'normal' | 'anonymous' | 'notice';

  /**
   * 发送人信息
   */
  sender: MessageSender & {
    /**
     * 群名片
     */
    card: string;

    /**
     * 地区
     */
    area?: string;

    /**
     * 成员等级
     */
    level: string;

    /**
     * 角色
     */
    role: 'owner' | 'admin' | 'member';

    /**
     * 专属头衔
     */
    title: string;
  };

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 匿名信息
   */
  anonymous: {
    /**
     * 匿名用户 ID
     */
    id: bigint;

    /**
     * 匿名用户名称
     */
    name: string;

    /**
     * 匿名用户 flag
     */
    flag: string;
  } | null;
}
