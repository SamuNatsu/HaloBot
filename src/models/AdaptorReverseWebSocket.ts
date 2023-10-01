/// Forward WebSocket adaptor model
import { RawData, WebSocket, WebSocketServer } from 'ws';
import {
  ActionError,
  ActionResponse,
  Adaptor,
  AdaptorPromiseCallbacks
} from './Adaptor';
import JB from 'json-bigint';
import { Logger } from './Logger';

const JSONbig = JB({
  useNativeBigInt: true,
  alwaysParseAsBig: true
});

/* Export class */
export class AdaptorReverseWebSocket extends Adaptor {
  /* Properties */
  private logger: Logger = new Logger('Adaptor:ReverseWebsocket');
  private socket?: WebSocket;

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

        if (this.socket === undefined) {
          this.logger.warn(
            `连接未建立，无法向端点 ${action} 发送数据包 [${echo}]，将自动拒绝`,
            params
          );
          reject(<ActionResponse>{
            status: 'failed',
            retcode: -1,
            msg: 'adaptor rejected',
            wording: '适配器已拒绝',
            data: undefined,
            echo: '-1'
          });
          return;
        }

        this.promiseMap.set(echo, { resolve, reject });
        this.socket.send(JSONbig.stringify({ action, params, echo }));
      }
    );
  }

  /* Constructor */
  public static create(port: number, path?: string): Promise<Adaptor> {
    return new Promise<AdaptorReverseWebSocket>(
      (
        resolve: (value: AdaptorReverseWebSocket) => void,
        reject: (reason?: any) => void
      ): void => {
        // Create server
        let server: WebSocketServer;
        try {
          server = new WebSocketServer({ path, port });
        } catch (err: unknown) {
          reject(err);
          return;
        }

        // Create adaptor
        const ret: AdaptorReverseWebSocket = new AdaptorReverseWebSocket();

        // Set event listeners
        server.on('listening', (): void => {
          ret.logger.debug('适配器已创建');
          resolve(ret);
        });
        server.on('error', (err: Error): void => {
          ret.logger.error('适配器错误', err);
        });
        server.on('connection', (socket: WebSocket): void => {
          // Skip when connected
          if (ret.socket !== undefined) {
            socket.close();
            return;
          }

          // Setup connection
          ret.socket = socket;
          socket.onclose = (): void => {};
          socket.on('close', (_: number, reason: Buffer): void => {
            ret.logger.warn(`反向连接断开: ${reason.toString()}`);
            ret.socket = undefined;
          });
          socket.on('error', (err: Error): void => {
            ret.logger.error('适配器错误', err);
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

          ret.logger.info('反向连接已建立');
        });
      }
    );
  }
}
