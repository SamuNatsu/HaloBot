/// Logger model
import chalk from 'chalk';
import moment from 'moment';
import util from 'util';

/**
 * 日志记录器
 */
export class Logger {
  /* Properties */
  private name: string;

  /* Constructor */
  public constructor(name: string) {
    this.name = name;
  }

  /* Methods */
  private printTemplate(level: string, msg: string, args: any[]): void {
    let str: string = `[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${level} (${
      this.name
    }): ${chalk.blueBright(msg)}\n`;
    for (const i of args) {
      if (i instanceof Error) {
        str += util.inspect(i, { showHidden: false, depth: null, colors: true });
      } else if (typeof i === 'string') {
        str += chalk.gray(i);
      } else {
        str += util.inspect(i, { showHidden: true, depth: null, colors: true, compact: false });
      }
      str += '\n';
    }
    process.stdout.write(str);
  }

  /**
   * 打印追踪日志
   */
  public trace(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.gray('TRACE'), msg, args);
  }

  /**
   * 打印调试日志
   */
  public debug(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.blue('DEBUG'), msg, args);
  }

  /**
   * 打印信息日志
   */
  public info(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.green('INFO'), msg, args);
  }

  /**
   * 打印警告日志
   */
  public warn(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.yellow('WARN'), msg, args);
  }

  /**
   * 打印错误日志
   */
  public error(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.red('ERROR'), msg, args);
  }

  /**
   * 打印严重错误日志
   */
  public fatal(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.magenta('FATAL'), msg, args);
  }
}
