/// Main entrance
import { Bot } from './models/Bot';
import { Logger } from './models/Logger';

const logger: Logger = new Logger('Main');
logger.info('欢迎使用 HaloBot！');

logger.info('正在创建实例化机器人');
try {
  const bot: Bot = await Bot.create();
  await bot.start();
} catch (err: unknown) {
  logger.fatal('无法实例化机器人', err);
}
