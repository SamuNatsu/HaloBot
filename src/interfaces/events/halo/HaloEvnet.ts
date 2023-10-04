/// Halo event interface
import { Event } from '../Event';

/**
 * HaloBot 事件
 */
export interface HaloEvent extends Event {
  self_id: 0n;
  post_type: 'halo_event';

  /**
   * HaloBot 事件类型
   */
  halo_event_type: 'call';
}
