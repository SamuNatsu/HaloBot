/// CQ event interface

/**
 * Go-CqHttp 通用事件
 */
export interface CqEvent {
  /**
   * 事件发生的 Unix 时间戳
   */
  time: bigint;

  /**
   * 收到事件的机器人的 QQ 号
   */
  self_id: bigint;

  /**
   * 上报类型
   */
  post_type:
    | 'message'
    | 'message_send'
    | 'request'
    | 'notice'
    | 'meta_event'
    | 'halo_event';
}
