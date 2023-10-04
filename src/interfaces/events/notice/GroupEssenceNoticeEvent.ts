/// Group essence notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 精华消息变更事件
 */
export interface GroupEssenceNoticeEvent extends NoticeEvent {
  notice_type: 'essence';

  /**
   * 消息子类型
   */
  sub_type: 'add' | 'delete';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 消息发送者 QQ 号
   */
  sender_id: bigint;

  /**
   * 操作者 QQ 号
   */
  operator_id: bigint;

  /**
   * 消息 ID
   */
  message_id: bigint;
}
