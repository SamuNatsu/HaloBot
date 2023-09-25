/// Event handler model
import { Plugin } from '../interfaces/plugin';

export class EventHandler {
  /* Properties */
  private handlerMap: Map<string, Function[]> = new Map();

  /* Methods */
  private register(name: string, func: Function): void {
    if (!this.handlerMap.has(name)) {
      this.handlerMap.set(name, []);
    }
    this.handlerMap.get(name)?.push(func);
  }

  public registerPlugin(plugin: Plugin): void {
    Object.keys(plugin)
      .filter((value: string): boolean => /^on[A-Z]/.test(value))
      .forEach((value: string): void => {
        if (typeof plugin[value] !== 'function') {
          return;
        }
        this.register(value, plugin[value].bind(plugin));
      });
  }
  public clear(): void {
    this.handlerMap.clear();
  }
  public process(name: string, ...args: any[]): void {
    this.handlerMap.get(name)?.forEach((value: Function): void => {
      value(...args);
    });
  }
}
