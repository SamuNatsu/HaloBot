/// Group title notify notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群成员头衔变更事件
 */
export interface GroupTitleNotifyNoticeEvent extends NoticeEvent {
  notice_type: 'notify';

  /**
   * 提示类型
   */
  sub_type: 'title';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 变更头衔的用户 QQ 号
   */
  user_id: bigint;

  /**
   * 获得的新头衔
   */
  title: string;
}
