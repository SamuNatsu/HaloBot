/// Status interface

/**
 * Go-CqHttp 状态
 */
export interface Status {
  /**
   * 原 CQHTTP 字段
   *
   * @deprecated
   */
  app_initialized: true;

  /**
   * 原 CQHTTP 字段
   *
   * @deprecated
   */
  app_enabled: true;

  /**
   * 原 CQHTTP 字段
   *
   * @deprecated
   */
  plugins_good: true;

  /**
   * 原 CQHTTP 字段
   *
   * @deprecated
   */
  app_good: true;

  /**
   * Bot 是否在线
   */
  online: boolean;

  /**
   * 同 online
   *
   * @deprecated
   */
  good: boolean;

  /**
   * 运行统计
   */
  stat: {
    /**
     * 收到的数据包总数
     */
    packet_received: bigint;

    /**
     * 发送的数据包总数
     */
    packet_sent: bigint;

    /**
     * 数据包丢失总数
     */
    packet_lost: bigint;

    /**
     * 接受信息总数
     */
    message_received: bigint;

    /**
     * 发送信息总数
     */
    message_sent: bigint;

    /**
     * TCP 连接断开次数
     */
    disconnect_times: bigint;

    /**
     * 账号掉线次数
     */
    lost_times: bigint;

    /**
     * 	最后一条消息时间
     */
    last_message_time: bigint;
  };
}
