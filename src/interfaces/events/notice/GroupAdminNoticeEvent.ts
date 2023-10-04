/// Group admin notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群管理员变动事件
 */
export interface GroupAdminNoticeEvent extends NoticeEvent {
  notice_type: 'group_admin';

  /**
   * 事件子类型
   */
  sub_type: 'set' | 'unset';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 管理员 QQ 号
   */
  user_id: bigint;
}
