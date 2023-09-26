/// Custom event interfaces

export interface CallCustomEvent {
  time: bigint;
  post_type: 'custom_event';
  custom_event_type: 'call';
  call_from: string;
  target?: string;
  method_name: string;
  params: any;
  resolve: (value: any) => void,
  reject: (reason?: any) => void
}
