/// Friend recall notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 私聊消息撤回事件
 */
export interface FriendRecallNoticeEvent extends NoticeEvent {
  notice_type: 'friend_recall';

  /**
   * 好友 QQ 号
   */
  user_id: bigint;

  /**
   * 被撤回的消息 ID
   */
  message_id: bigint;
}
