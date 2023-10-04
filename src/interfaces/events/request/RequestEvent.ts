/// Request event interface
import { Event } from '../Event';

/**
 * 请求事件
 */
export interface RequestEvent extends Event {
  post_type: 'request';

  /**
   * 请求类型
   */
  request_type: 'friend' | 'group';
}
