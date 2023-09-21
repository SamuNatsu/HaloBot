/// Forward WebSocket adaptor class
import { RawData, WebSocket } from 'ws';
import { ActionResponse, Adaptor, AdaptorPromiseCallbacks } from './Adaptor';

/* Export class */
export class ForwardWebSocketAdaptor extends Adaptor {
  /* WebSocket */
  private socket: WebSocket;

  /* Constructor */
  constructor(url: string) {
    super();

    this.socket = new WebSocket(url);
    this.socket.on('error', console.error);
    this.socket.on('open', (): void => {
      console.log('Forward WebSocket adaptor connected');
    });
    this.socket.on('message', (data: RawData): void => {
      try {
        const json: any = JSON.parse(data.toString());
        if (json.echo !== undefined) {
          const callbacks: AdaptorPromiseCallbacks | undefined =
            this.getPromiseCallbacks(json.echo);
          if (callbacks === undefined) {
            throw new Error('Echo lost');
          }
          callbacks.resolve(json);
          return;
        }
        this.msgHandler(json);
      } catch (err: unknown) {
        throw err;
      }
    });
  }

  /* Send */
  public send(
    action: string,
    params: Record<string, any> = {}
  ): Promise<ActionResponse> {
    return new Promise<ActionResponse>(
      (
        resolve: (value: ActionResponse) => void,
        reject: (reason?: any) => void
      ): void => {
        const echo: number = this.getNextSerialNumber();
        this.setPromiseCallbacks(echo, { resolve, reject });
        this.socket.send(JSON.stringify({ action, params, echo }));
      }
    );
  }
}
