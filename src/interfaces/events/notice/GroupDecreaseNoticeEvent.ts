/// Group decrease notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群成员减少事件
 */
export interface GroupDecreaseNoticeEvent extends NoticeEvent {
  notice_type: 'group_decrease';

  /**
   * 事件子类型
   */
  sub_type: 'kick' | 'kick_me' | 'leave';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 操作者 QQ 号
   */
  operator_id: bigint;

  /**
   * 离开者 QQ 号
   */
  user_id: bigint;
}
