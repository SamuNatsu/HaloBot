/// Event interface

/**
 * 通用事件
 */
export interface Event {
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
    | 'message_sent'
    | 'request'
    | 'notice'
    | 'meta_event'
    | 'halo_event';
}
