/// Config interface

/* Export interface */
export interface Config {
  connection: {
    type: 'forward-http' | 'reverse-http' | 'forward-ws' | 'reverse-ws' | 'dry-run';
    url?: string;
  };
}
