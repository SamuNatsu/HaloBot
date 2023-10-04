import { definePlugin } from '../../HaloBotPlugin.js';
import puppeteer from 'puppeteer';
import path from 'path';
import joi from 'joi';
import async from 'async';

/* Schemas */
const configSchema = joi.object({
  mode: joi.string().valid('keep_alive', 'instant').required(),
  parallel_count: joi.number().integer().min(1).default(5),
  instant_timeout: joi.number().integer().min(1).default(10)
});
const renderParamSchema = joi.object({
  type: joi.string().valid('file', 'text').required(),
  viewport: joi.object({
    width: joi.number(),
    height: joi.number()
  }),
  action: joi.function(),
  target: joi.string().required(),
  path: joi.string()
});

/* Export plugin */
export default definePlugin({
  meta: {
    namespace: 'rainiar.html_renderer',
    name: 'HTML 渲染器',
    author: 'SNRainiar',
    description: '基于 Puppeteer 的 HTML 渲染器',
    priority: 1,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  async createBrowser() {
    if (this.browser === undefined) {
      this.browser = await puppeteer.launch({ headless: 'new' });
      this.logger.debug('浏览器已创建');
    }
  },
  async destroyBrowser() {
    if (this.browser !== undefined) {
      await this.browser.close();
      this.browser = undefined;
      this.logger.debug('浏览器已关闭');
    }
  },
  async renderWorker(task) {
    this.logger.info('收到新的渲染任务');

    // Verify params
    const { error } = renderParamSchema.validate(task.params);
    if (error !== undefined) {
      this.logger.error('渲染参数验证失败', error);
      task.reject(error);
      return;
    }

    // Create instant
    if (this.config.mode === 'instant') {
      await this.createBrowser();
    }
    const page = await this.browser.newPage();

    // Set params
    if (task.params.viewport !== undefined) {
      await page.setViewport(task.params.viewport);
    }
    if (task.params.type === 'file') {
      this.logger.info('开始渲染 HTML 文件');
      await page.goto(task.params.target, { waitUntil: 'networkidle0' });
    } else {
      this.logger.info('开始渲染 HTML 字符串');
      await page.setContent(task.params.target, {
        waitUntil: 'networkidle0'
      });
    }
    if (task.action !== undefined) {
      await task.action(page);
    }

    // Create screenshot
    const b64 = await page.screenshot({
      path: task.params.path,
      encoding: 'base64'
    });
    if (task.params.path !== undefined) {
      this.logger.info(`渲染图片已输出至: ${task.params.path}`);
    }

    // Cleanup
    await page.close();
    this.logger.info('渲染完成');
    task.resolve(b64);
  },
  async onStart() {
    // Read config
    this.config = this.api.readYamlFile(
      path.join(this.currentPluginDir, './config.yaml')
    );
    const { error, value } = configSchema.validate(this.config);
    if (error !== undefined) {
      throw error;
    }
    this.config = value;

    // Check mode
    if (this.config.mode === 'keep_alive') {
      this.logger.info('HTML 渲染器将运行在保活模式下');
      this.createBrowser();
    } else {
      this.logger.info('HTML 渲染器将运行在瞬时模式下');
    }

    // Create workers
    this.queue = async.queue(
      this.renderWorker.bind(this),
      this.config.parallel_count
    );
    this.queue.error((err, task) => {
      this.logger.error('渲染出错', err);
      task.reject(err);
    });
    this.queue.drain(() => {
      if (this.config.mode !== 'instant') {
        return;
      }
      this.timeout = setTimeout(async () => {
        await this.destroyBrowser();
      }, this.config.instant_timeout * 1000);
    });
  },
  async onStop() {
    this.queue.kill();
    await this.destroyBrowser();
  },
  async onCall(ev) {
    switch (ev.method_name) {
      case 'render': {
        clearTimeout(this.timeout);
        this.queue.push(ev);
        this.logger.info(
          `已添加 1 个任务至队列，现在队列中有 ${this.queue.length()} 个任务`
        );
        break;
      }
      default:
        ev.reject(new Error('未知方法'));
    }
  }
});
