/// Poke notify notice event interface
import { NoticeEvent } from './NoticeEvent';

/**
 * 好友戳一戳事件
 */
export interface PokeNotifyNoticeEvent extends NoticeEvent {
  notice_type: 'notify';

  /**
   * 提示类型
   */
  sub_type: 'poke';

  /**
   * 发送者 QQ 号
   */
  sender_id?: bigint;

  /**
   * 群号
   */
  group_id?: bigint;

  /**
   * 发送者 QQ 号
   */
  user_id: bigint;

  /**
   * 被戳者 QQ 号
   */
  target_id: bigint;
}
