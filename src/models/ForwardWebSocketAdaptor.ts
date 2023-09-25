/// Forward WebSocket adaptor model
import { RawData, WebSocket } from 'ws';
import {
  ActionError,
  ActionResponse,
  Adaptor,
  AdaptorPromiseCallbacks
} from './Adaptor';
import JSONbig from 'json-bigint';

/* Export class */
export class ForwardWebSocketAdaptor extends Adaptor {
  /* WebSocket */
  private socket: WebSocket;

  /* Send and receive */
  public async send(
    action: string,
    params: Record<string, any> = {}
  ): Promise<ActionResponse> {
    return new Promise<ActionResponse>(
      (
        resolve: (value: ActionResponse) => void,
        reject: (reason?: any) => void
      ): void => {
        const echo: number = this.getNextSerialNumber();
        this.promiseMap.set(echo, { resolve, reject });
        this.socket.send(JSON.stringify({ action, params, echo }));
      }
    );
  }

  /* Constructor */
  protected constructor(socket: WebSocket) {
    super();
    this.socket = socket;
  }
  public static create(url: string): Promise<Adaptor> {
    return new Promise<ForwardWebSocketAdaptor>(
      (
        resolve: (value: ForwardWebSocketAdaptor) => void,
        reject: (reason?: any) => void
      ): void => {
        const socket: WebSocket = new WebSocket(url);
        const ret: ForwardWebSocketAdaptor = new ForwardWebSocketAdaptor(
          socket
        );

        socket.on('error', (err: any): void => {
          if (err.errno === -111) {
            reject(err);
          }
        });
        socket.on('open', (): void => {
          resolve(ret);
        });
        socket.on('message', (raw: RawData): void => {
          try {
            const json: ActionResponse = JSONbig.parse(raw.toString());
            if (json.echo !== undefined) {
              const callbacks: AdaptorPromiseCallbacks | undefined =
                ret.promiseMap.get(json.echo);
              ret.promiseMap.delete(json.echo);
              if (callbacks === undefined) {
                throw new Error('Echo lost');
              }

              if (json.status === 'failed') {
                callbacks.reject(new ActionError(json));
              } else {
                callbacks.resolve(json);
              }
            } else {
              ret.messageHandler(json);
            }
          } catch (err: unknown) {
            throw err;
          }
        });
      }
    );
  }
}
