/// Adaptor model

/* Types */
export interface ActionResponse {
  status: 'ok' | 'async' | 'failed';
  retcode: number;
  msg?: string;
  wording?: string;
  data: any;
  echo: string;
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
export abstract class Adaptor {
  /* Serial number system */
  private serialNumber: bigint = 0n;
  protected getNextSerialNumber(): string {
    const next: bigint = this.serialNumber;
    this.serialNumber = this.serialNumber + 1n;
    return String(next);
  }

  /* Promise system */
  protected promiseMap: Map<string, AdaptorPromiseCallbacks> = new Map();

  /* Send and receive */
  public abstract send(
    action: string,
    params?: Record<string, any>
  ): Promise<ActionResponse>;
  public messageHandler: (res: any) => void = () => {};

  /* Constructor */
  protected constructor() {}
  public static async create(...args: any[]): Promise<void> {
    throw new Error('禁止实例化抽象类');
  }

  /* Singleton */
  protected static instance?: Adaptor;
  public static getInstance(): Adaptor {
    if (Adaptor.instance === undefined) {
      throw new Error('适配器未被具象实例化');
    }
    return Adaptor.instance;
  }
}
