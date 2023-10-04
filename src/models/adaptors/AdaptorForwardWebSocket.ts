/// Forward WebSocket adaptor model
import { RawData, WebSocket } from 'ws';
import {
  ActionError,
  ActionResponse,
  Adaptor,
  AdaptorPromiseCallbacks
} from './Adaptor';
import JB from 'json-bigint';
import { Logger } from '../Logger';

const JSONbig = JB({
  useNativeBigInt: true,
  alwaysParseAsBig: true
});

/* Export class */
export class AdaptorForwardWebSocket extends Adaptor {
  /* Properties */
  private logger: Logger = new Logger('适配器:正向 WebSocket');
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
        const echo: string = this.getNextSerialNumber();
        this.promiseMap.set(echo, { resolve, reject });
        this.socket.send(JSONbig.stringify({ action, params, echo }));
      }
    );
  }

  /* Constructor */
  protected constructor(socket: WebSocket) {
    super();
    this.socket = socket;
  }
  public static create(url: string): Promise<void> {
    return new Promise<void>(
      (
        resolve: (value: void) => void,
        reject: (reason?: any) => void
      ): void => {
        // Create WebSocket
        let started: boolean = false;
        const socket: WebSocket = new WebSocket(url);

        // Create adaptor
        const ret: AdaptorForwardWebSocket = new AdaptorForwardWebSocket(
          socket
        );

        // Set event listeners
        socket.on('error', (err: Error): void => {
          if (!started) {
            reject(err);
            return;
          }
          ret.logger.error('适配器错误', err);
        });
        socket.on('open', (): void => {
          ret.logger.debug('适配器已创建');
          started = true;
          Adaptor.instance = ret;
          resolve();
        });
        socket.on('close', (_, reason: Buffer): void => {
          ret.logger.warn(`适配器已断开: ${reason.toString()}`);
        });
        socket.on('message', (raw: RawData): void => {
          const json: ActionResponse = JSONbig.parse(raw.toString());
          if (json.echo !== undefined) {
            // Get callbacks
            const callbacks: AdaptorPromiseCallbacks | undefined =
              ret.promiseMap.get(json.echo);
            ret.promiseMap.delete(json.echo);
            if (callbacks === undefined) {
              ret.logger.error('找不到回复的异步接口', json);
              return;
            }

            // Handle callback
            if (json.status === 'failed') {
              callbacks.reject(new ActionError(json));
            } else {
              callbacks.resolve(json);
            }
          } else {
            // Handle event
            ret.messageHandler(json);
          }
        });
      }
    );
  }
}
