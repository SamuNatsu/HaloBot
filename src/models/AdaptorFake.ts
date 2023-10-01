/// Fake adaptor model
import {
  ActionError,
  ActionResponse,
  Adaptor,
  AdaptorPromiseCallbacks
} from './Adaptor';
import { Logger } from './Logger';
import express from 'express';

/* Export class */
export class AdaptorFake extends Adaptor {
  /* Logger */
  private logger: Logger = new Logger('Adaptor:Fake');

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
        this.logger.trace(
          `向端点 ${action} 发送了数据包 [${echo}]，请及时回复或拒绝`,
          params
        );
      }
    );
  }

  /* Constructor */
  private constructor() {
    super();
  }
  public static create(port: number, path?: string): Promise<Adaptor> {
    return new Promise<AdaptorFake>(
      (
        resolve: (value: AdaptorFake) => void,
        reject: (reason?: any) => void
      ): void => {
        // Create http server
        let started: boolean = false;
        const server = express();
        server.use(express.json());

        // Create adaptor
        const ret: AdaptorFake = new AdaptorFake();

        // Set listeners
        server.post(
          (path ?? '') + '/event',
          (req: express.Request, res: express.Response): express.Response => {
            ret.logger.trace('接收到上报', req.body);
            ret.messageHandler(req.body);
            return res.sendStatus(204);
          }
        );
        server.post(
          (path ?? '') + '/response',
          (req: express.Request, res: express.Response): express.Response => {
            ret.logger.trace('接收到回复', req.body);

            // Get callbacks
            const callbacks: AdaptorPromiseCallbacks | undefined =
              ret.promiseMap.get(req.body.echo);
            ret.promiseMap.delete(req.body.echo);
            if (callbacks === undefined) {
              ret.logger.error('找不到回复的异步接口', req.body);
              return res.sendStatus(404);
            }

            // Handle callback
            if (req.body.status === 'failed') {
              callbacks.reject(new ActionError(req.body));
            } else {
              callbacks.resolve(req.body);
            }
            return res.sendStatus(204);
          }
        );
        server.use(
          (
            err: Error,
            req: express.Request,
            res: express.Response,
            _: express.NextFunction
          ): express.Response => {
            ret.logger.error('适配器错误', err, req.body);
            return res.sendStatus(500);
          }
        );

        // Start listening
        server
          .listen(port, (): void => {
            ret.logger.debug('适配器已创建');
            started = true;
            resolve(ret);
          })
          .on('error', (err): void => {
            if (!started) {
              reject(err);
              return;
            }
            ret.logger.error('适配器错误', err);
          });
      }
    );
  }
}
