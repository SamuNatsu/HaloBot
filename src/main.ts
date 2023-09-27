/// Main entrance
import { Worker } from 'worker_threads';
import { Logger } from './models/Logger';
import { getDirname } from './utils';
import { join } from 'path';

/* Paths */
const dirname: string = getDirname();
const workerPath: string = join(dirname, './worker.min.mjs');

/* Logger */
const logger: Logger = new Logger('Main');

/* Worker */
let worker: Worker;
function startWorker() {
  worker = new Worker(workerPath);

  worker.on('exit', (code: number): void => {
    if (code === 0) {
      logger.info('Worker 线程已停止');
    } else if (code === 128) {
      logger.warn('Worker 线程请求重启');
      startWorker();
    } else {
      logger.fatal(`Worker 线程意外停止: ${code}`);
    }
  });
}

/* Start worker */
logger.info('欢迎使用 HaloBot！');

let intFlg: boolean = false;
process.on('SIGINT', (): void => {
  if (intFlg) {
    return;
  }
  intFlg = true;

  logger.warn('收到终止信号，HaloBot 即将退出');
  worker.postMessage({ type: 'terminate' });
});

startWorker();
