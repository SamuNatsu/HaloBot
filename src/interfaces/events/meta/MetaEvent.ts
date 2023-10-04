/// Meta event interface
import { Event } from '../Event';

/**
 * 元事件
 */
export interface MetaEvent extends Event {
  post_type: 'meta_event';

  /**
   * 元事件类型
   */
  meta_event_type: 'heartbeat' | 'lifecycle';
}
