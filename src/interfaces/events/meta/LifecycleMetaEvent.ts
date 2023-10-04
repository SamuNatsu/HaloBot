/// Lifecycle meta event interface
import { MetaEvent } from './MetaEvent';

/**
 * 生命周期元事件
 */
export interface LifecycleMetaEvent extends MetaEvent {
  meta_event_type: 'lifecycle';

  /**
   * 生命周期子类型
   */
  sub_type: 'connect' | 'disable' | 'enable';
}
