/// Group recall notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群消息撤回事件
 */
export interface GroupRecallNoticeEvent extends NoticeEvent {
  notice_type: 'group_recall';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 消息发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 操作者 QQ 号
   */
  operator_id: bigint;

  /**
   * 被撤回的消息 ID
   */
  message_id: bigint;
}
