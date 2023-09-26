/// Meta event interfaces

export interface HeartbeatMetaEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'meta_event';
  meta_event_type: 'heartbeat';
  status: {
    app_initialized: boolean;
    app_enabled: boolean;
    plugins_good: boolean | null;
    app_good: boolean;
    online: boolean;
    stat: {
      packet_received: bigint;
      packet_sent: bigint;
      packet_lost: bigint;
      message_received: bigint;
      message_sent: bigint;
      disconnect_times: bigint;
      lost_times: bigint;
      last_message_time: bigint;
    };
  };
  interval: bigint;
}

export interface LifecycleMetaEvent {
  time: bigint;
  self_id: bigint;
  post_type: 'meta_event';
  meta_event_type: 'lifecycle';
  sub_type: 'enable' | 'disable' | 'connect';
}
