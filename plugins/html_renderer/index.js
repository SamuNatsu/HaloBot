import { definePlugin } from '../../HaloBotPlugin.js';
import puppeteer from 'puppeteer';
import path from 'path';
import joi from 'joi';

const configSchema = joi.object({
  mode: joi.string().valid('keep_alive', 'instant').required()
});

const renderParamSchema = joi.object({
  type: joi.string().valid('file', 'text').required(),
  viewport: joi
    .object({
      width: joi.number().required(),
      height: joi.number().required(),
      deviceScaleFactor: joi.number(),
      hasTouch: joi.boolean(),
      isLandscape: joi.boolean(),
      isMobile: joi.boolean()
    })
    .required(),
  target: joi.string().required(),
  path: joi.string().required()
});

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
    this.browser = await puppeteer.launch({ headless: 'new' });
    this.logger.debug('浏览器已创建');
  },
  async destroyBrowser() {
    if (this.browser !== undefined) {
      await this.browser.close();
      this.browser = undefined;
      this.logger.debug('浏览器已关闭');
    }
  },
  async onStart() {
    this.config = this.bot.utils.readYamlFile(
      path.join(this.currentPluginDir, './config.yaml')
    );
    const { error } = configSchema.validate(this.config);
    if (error !== undefined) {
      throw error;
    }

    if (this.config.mode === 'keep_alive') {
      this.logger.info('HTML 渲染器将运行在保活模式下');
      this.createBrowser();
    } else {
      this.logger.info('HTML 渲染器将运行在瞬时模式下');
    }
  },
  async onStop() {
    await this.destroyBrowser();
  },
  async onCall(ev) {
    switch (ev.method_name) {
      case 'render': {
        try {
          this.logger.info('收到新的渲染任务');

          const { error } = renderParamSchema.validate(ev.params);
          if (error !== undefined) {
            this.logger.error('渲染参数验证失败', error);
            ev.reject(error);
            return;
          }

          if (this.config.mode === 'instant') {
            await this.createBrowser();
          }
          const page = await this.browser.newPage();

          await page.setViewport(ev.params.viewport);
          if (ev.params.type === 'file') {
            this.logger.info('开始渲染 HTML 文件');
            await page.goto(ev.params.target, { waitUntil: 'networkidle0' });
          } else {
            this.logger.info('开始渲染 HTML 字符串');
            await page.setContent(ev.params.target, {
              waitUntil: 'networkidle0'
            });
          }

          await page.screenshot({ path: ev.params.path });
          this.logger.info(`渲染图片已输出至: ${ev.params.path}`);

          await page.close();
          if (this.config.mode === 'instant') {
            await this.destroyBrowser();
          }

          this.logger.info('渲染完成');
          ev.resolve();
        } catch (err) {
          this.logger.error('渲染出错', err);
          ev.reject(err);
        }
        break;
      }
      default:
        ev.reject(new Error('未知方法'));
    }
  }
});
