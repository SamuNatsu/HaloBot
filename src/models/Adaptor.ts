/// Adaptor model

/* Types */
export interface ActionResponse {
  status: 'ok' | 'async' | 'failed';
  retcode: number;
  msg?: string;
  wording?: string;
  data: any;
  echo: number;
}
export interface AdaptorPromiseCallbacks {
  resolve: (value: ActionResponse) => void;
  reject: (reason?: any) => void;
}

/* Export class */
export class ActionError extends Error {
  /* Properties */
  public retcode: number;
  public wording: string;

  /* Constructor */
  public constructor(res: ActionResponse) {
    super(res.msg);
    this.retcode = res.retcode;
    this.wording = res.wording as string;
  }
}
export class Adaptor {
  /* Serial number system */
  private serialNumber: number = 0;
  protected getNextSerialNumber(): number {
    const next: number = this.serialNumber;
    this.serialNumber = (this.serialNumber + 1) & 0x7fffffff;
    return next;
  }

  /* Promise system */
  protected promiseMap: Map<number, AdaptorPromiseCallbacks> = new Map();

  /* Send and receive */
  public async send(
    action: string,
    params?: Record<string, any>
  ): Promise<ActionResponse> {
    return {
      status: 'failed',
      retcode: -1,
      msg: 'Send method MUST be overwrote',
      wording: 'Send 方法必须被重写',
      data: undefined,
      echo: -1
    };
  }
  public messageHandler: (res: any) => void = () => {};

  /* Constructor */
  protected constructor() {}
  public static async create(...args: any[]): Promise<Adaptor> {
    return new Adaptor();
  }
}
