/// Config interface

/* Export interface */
export interface Config {
  connection: {
    type: 'none' | 'http' | 'websocket' | 'fake';
    config?: {
      http_forward?: string;
      http_reverse_port?: number;
      http_reverse_path?: string;
      ws_type?: 'forward' | 'reverse';
      ws_forward?: string;
      ws_reverse_port?: number;
      ws_reverse_path?: string;
      fake_reverse_port?: number;
      fake_reverse_path?: string;
    }
  };
}
