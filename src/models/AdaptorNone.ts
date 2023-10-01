/// None adaptor model
import { ActionResponse, Adaptor } from './Adaptor';
import { Logger } from './Logger';

/* Export class */
export class AdaptorNone extends Adaptor {
  /* Logger */
  private logger: Logger = new Logger('Adaptor:None');

  /* Send and receive */
  public async send(action: string, params: any): Promise<ActionResponse> {
    return new Promise<ActionResponse>(
      (_, reject: (reason?: any) => void): void => {
        this.logger.trace(`向端点 ${action} 发送了数据包，将自动拒绝`, params);
        reject(<ActionResponse>{
          status: 'failed',
          retcode: -1,
          msg: 'adaptor rejected',
          wording: '适配器已拒绝',
          data: undefined,
          echo: '-1'
        });
      }
    );
  }

  /* Constructor */
  private constructor() {
    super();
    this.logger.debug('适配器已创建');
  }
  public static async create(): Promise<Adaptor> {
    return new AdaptorNone();
  }
}
