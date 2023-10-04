/// Friend add notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 好友添加事件
 */
export interface FriendAddNoticeEvent extends NoticeEvent {
  notice_type: 'friend_add';

  /**
   * 新添加好友 QQ 号
   */
  user_id: bigint;
}
