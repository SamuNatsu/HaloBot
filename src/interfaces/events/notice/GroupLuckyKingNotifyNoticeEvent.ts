/// Group lucky king notify notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群红包运气王提示事件
 */
export interface GroupLuckyKingNotifyNoticeEvent extends NoticeEvent {
  notice_type: 'notify';

  /**
   * 提示类型
   */
  sub_type: 'lucky_king';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 红包发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 运气王 QQ 号
   */
  target_id: bigint;
}
