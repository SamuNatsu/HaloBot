/// Logger model
import chalk from 'chalk';

/* Export class */
export class Logger {
  /* Properties */
  private name: string;

  /* Constructor */
  public constructor(name: string) {
    this.name = name;
  }

  /* Methods */
  private printTime(): void {
    process.stdout.write(`[${new Date().toISOString()}] `);
  }
  private printName(): void {
    process.stdout.write(` (${this.name}): `);
  }
  private printArgs(args: any[]): void {
    process.stdout.write('\n');
    for (const i of args) {
      if (i instanceof Error) {
        process.stdout.write(chalk.gray(i.stack ?? `${i.name}: ${i.message}`));
      } else {
        process.stdout.write(chalk.gray(JSON.stringify(i, undefined, 2)));
      }
      process.stdout.write('\n');
    }
  }
  private printTemplate(level: string, msg: string, args: any[]): void {
    this.printTime();
    process.stdout.write(level);
    this.printName();
    process.stdout.write(chalk.blueBright(msg));
    this.printArgs(args);
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
