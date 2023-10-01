/// Custom event interfaces
import { CqEvent } from './CqEvent';

/**
 * HaloBot 调用事件
 */
export interface CallHaloEvent extends CqEvent {
  self_id: -1n;
  post_type: 'halo_event';

  /**
   * HaloBot 事件类型
   */
  halo_event_type: 'call';

  /**
   * 目标插件名字空间
   */
  target?: string;

  /**
   * 方法名
   */
  method_name: string;

  /**
   * 调用参数
   */
  params: any;

  /**
   * Promise 回调
   */
  resolve: (value: any) => void;

  /**
   * Promise 异常回调
   */
  reject: (reason?: any) => void;
}
