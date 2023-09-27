/// Worker thread entrance
import { parentPort } from 'worker_threads';
import { Bot } from './models/Bot';
import { Logger } from './models/Logger';

/* Types */
interface MainMessage {
  type: 'terminate';
  data: any;
}

/* Logger */
const logger: Logger = new Logger('WorkerThread');
logger.info('Worker 线程已启动');

/* Start up */
process.on('uncaughtException', (error: Error): void => {
  logger.error('检测到未被捕获的错误', error);
});
process.on('unhandledRejection', (reason: unknown): void => {
  logger.error('检测到未被捕获的异步错误', reason);
});

try {
  logger.info('正在实例化 HaloBot');
  const bot: Bot = await Bot.create();

  parentPort?.on('message', (msg: MainMessage): void => {
    switch (msg.type) {
      case 'terminate':
        bot.stop();
        break;
    }
  });

  await bot.start();
} catch (err: unknown) {
  logger.fatal('无法实例化 HaloBot', err);
  setTimeout((): never => {
    process.exit(1);
  }, 1000);
}
