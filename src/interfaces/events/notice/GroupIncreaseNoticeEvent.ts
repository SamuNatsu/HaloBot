/// Group increase notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群成员增加事件
 */
export interface GroupIncreaseNoticeEvent extends NoticeEvent {
  notice_type: 'group_increase';

  /**
   * 事件子类型
   */
  sub_type: 'approve' | 'invite';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 操作者 QQ 号
   */
  opeator_id: bigint;

  /**
   * 加入者 QQ 号
   */
  user_id: bigint;
}
