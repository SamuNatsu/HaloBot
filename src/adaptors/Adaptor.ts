/// Adaptor abstract class

/* Types */
export interface AdaptorPromiseCallbacks {
  resolve: (value: ActionResponse) => void;
  reject: (reason?: any) => void;
}
export interface ActionResponse {
  status: 'ok' | 'async' | 'failed';
  retcode: number;
  msg?: string;
  wording?: string;
  data: any;
  echo: string;
}

/* Export class */
export abstract class Adaptor {
  /* Serial number system */
  private serialNumber: number = 0;
  protected getNextSerialNumber(): number {
    const next: number = this.serialNumber;
    this.serialNumber = (this.serialNumber + 1) & 0x7fffffff;
    return next;
  }

  /* Promise system */
  private promiseMap: Map<number, AdaptorPromiseCallbacks> = new Map();
  protected setPromiseCallbacks(
    echo: number,
    callbacks: AdaptorPromiseCallbacks
  ): void {
    if (this.promiseMap.has(echo)) {
      throw new Error('Echo duplicated');
    }
    this.promiseMap.set(echo, callbacks);
  }
  protected getPromiseCallbacks(
    serial: number
  ): AdaptorPromiseCallbacks | undefined {
    const callbacks: AdaptorPromiseCallbacks | undefined =
      this.promiseMap.get(serial);
    if (callbacks !== undefined) {
      this.promiseMap.delete(serial);
    }
    return callbacks;
  }

  /* Send */
  public abstract send(
    action: string,
    params?: Record<string, any>
  ): Promise<ActionResponse>;

  /* Message handler */
  public msgHandler: (msg: any) => void = () => {};
}
