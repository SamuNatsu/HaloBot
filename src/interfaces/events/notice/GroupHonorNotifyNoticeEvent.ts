/// Group honor notify notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群成员荣誉变更提示事件
 */
export interface GroupHonorNotifyNoticeEvent extends NoticeEvent {
  notice_type: 'notify';

  /**
   * 提示类型
   */
  sub_type: 'honor';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 成员 QQ 号
   */
  user_id: bigint;

  /**
   * 荣誉类型
   */
  honor_type: 'talkative' | 'performer' | 'emotion';
}
