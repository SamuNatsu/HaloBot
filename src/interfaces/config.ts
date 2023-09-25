/// Config interface

export interface Config {
  connection: {
    type: 'forward-http' | 'reverse-http' | 'forward-ws' | 'reverse-ws';
    url?: string;
  };
}
