/// Logger model
import chalk from 'chalk';
import moment from 'moment';

/* Export class */
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
        str += chalk.gray(i.stack ?? `${i.name}: ${i.message}`);
      } else {
        str += chalk.gray(JSON.stringify(i, undefined, 2));
      }
      str += '\n';
    }
    process.stdout.write(str);
  }

  public trace(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.gray('TRACE'), msg, args);
  }
  public debug(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.blue('DEBUG'), msg, args);
  }
  public info(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.green('INFO'), msg, args);
  }
  public warn(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.yellow('WARN'), msg, args);
  }
  public error(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.red('ERROR'), msg, args);
  }
  public fatal(msg: string, ...args: any[]): void {
    this.printTemplate(chalk.magenta('FATAL'), msg, args);
  }
}
