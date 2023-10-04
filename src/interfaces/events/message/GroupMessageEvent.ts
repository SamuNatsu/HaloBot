/// Group message event interface
import { MessageEvent } from './MessageEvent';
import { MessageSender } from './MessageSender';

/**
 * 群聊消息事件
 */
export interface GroupMessageEvent extends MessageEvent {
  message_type: 'group';
  sub_type: 'anonymous' | 'normal' | 'notice';

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
    role: 'admin' | 'member' | 'owner';

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
