/// Group card notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 群成员名片更新事件
 */
export interface GroupCardNoticeEvent extends NoticeEvent {
  notice_type: 'group_card';

  /**
   * 群号
   */
  group_id: bigint;

  /**
   * 成员 QQ 号
   */
  user_id: bigint;

  /**
   * 新名片
   */
  card_new: string;

  /**
   * 旧名片
   */
  card_old: string;
}
