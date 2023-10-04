/// Notice event interface
import { Event } from '../Event';

/**
 * 通知事件
 */
export interface NoticeEvent extends Event {
  post_type: 'notice';

  /**
   * 通知类型
   */
  notice_type:
    | 'friend_recall'
    | 'group_recall'
    | 'group_increase'
    | 'group_decrease'
    | 'group_admin'
    | 'group_upload'
    | 'group_ban'
    | 'friend_add'
    | 'group_card'
    | 'offline_file'
    | 'client_status'
    | 'essence'
    | 'notify';
}
