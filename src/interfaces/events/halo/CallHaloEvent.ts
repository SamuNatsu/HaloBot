/// Call halo event interfaces
import { HaloEvent } from './HaloEvnet';

/**
 * HaloBot 调用事件
 */
export interface CallHaloEvent extends HaloEvent {
  halo_event_type: 'call';

  /**
   * 来源插件的名字空间
   */
  from: string;

  /**
   * 目标插件名字空间
   */
  target: string;

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
