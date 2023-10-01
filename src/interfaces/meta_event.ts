/// Meta event interfaces
import { CqEvent } from './CqEvent';

/**
 * Go-CqHttp 元事件
 */
interface MetaEvent extends CqEvent {
  /**
   * 元事件类型
   */
  meta_event_type: 'heartbeat' | 'lifecycle';
}

/**
 * Go-CqHttp 心跳元事件
 */
export interface HeartbeatMetaEvent extends MetaEvent {
  post_type: 'meta_event';
  meta_event_type: 'heartbeat';

  /**
   * 应用程序状态
   */
  status: {
    /**
     * 程序是否初始化完毕
     */
    app_initialized: boolean;

    /**
     * 程序是否可用
     */
    app_enabled: boolean;

    /**
     * 插件正常
     */
    plugins_good: boolean | null;

    /**
     * 程序正常
     */
    app_good: boolean;

    /**
     * 是否在线
     */
    online: boolean;

    /**
     * 统计信息
     */
    stat: {
      /**
       * 收包数
       */
      packet_received: bigint;

      /**
       * 发包数
       */
      packet_sent: bigint;

      /**
       * 丢包数
       */
      packet_lost: bigint;

      /**
       * 消息接收数
       */
      message_received: bigint;

      /**
       * 消息发送数
       */
      message_sent: bigint;

      /**
       * 连接断开次数
       */
      disconnect_times: bigint;

      /**
       * 连接丢失次数
       */
      lost_times: bigint;

      /**
       * 最后一次消息时间
       */
      last_message_time: bigint;
    };
  };

  /**
   * 距离上一次心跳包的时间（毫秒）
   */
  interval: bigint;
}

/**
 * Go-CqHttp 生命周期元事件
 */
export interface LifecycleMetaEvent extends MetaEvent {
  meta_event_type: 'lifecycle';

  /**
   * 生命周期子类型
   */
  sub_type: 'enable' | 'disable' | 'connect';
}
