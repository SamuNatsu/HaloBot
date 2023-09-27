import { fileURLToPath } from 'url';
import { definePlugin } from '../../HaloBotPlugin.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import puppeteer from 'puppeteer';

export default definePlugin({
  meta: {
    namespace: 'rainiar.html_renderer',
    name: 'HTML Renderer',
    author: 'SNRainiar',
    description: 'Basic plugin for rendering HTML with Puppeteer',
    priority: 1,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  readConfig() {
    this.curdir = dirname(fileURLToPath(import.meta.url));

    const conf = readFileSync(join(this.curdir, './config.json'), 'utf-8');
    this.config = JSON.parse(conf);
  },
  async createBrowser() {
    this.browser = await puppeteer.launch({ headless: 'new' });
    this.logger.trace('Browser created');
  },
  async destroyBrowser() {
    if (this.browser !== undefined) {
      await this.browser.close();
      this.browser = undefined;
      this.logger.trace('Browser destroyed');
    }
  },
  async onStart(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this.readConfig();

    if (this.config.mode === 'keep_alive') {
      this.logger.info('Running at keep alive mode');
      await this.createBrowser();
    } else {
      this.logger.info('Running at instant mode');
    }
  },
  async onStop() {
    await this.destroyBrowser();
  },
  async onCall(ev) {
    switch (ev.method_name) {
      case 'render': {
        try {
          this.logger.info('Start render HTML');

          if (this.config.mode !== 'keep_alive') {
            await this.createBrowser();
          }
          const page = await this.browser.newPage();

          await page.setViewport(ev.params.viewport);
          if (ev.params.type === 'file') {
            await page.goto(ev.params.html, { waitUntil: 'networkidle0' });
          } else {
            await page.setContent(ev.params.html, { waitUntil: 'networkidle0' });
          }
          if (ev.params.styles !== undefined) {
            for (const i of ev.params.styles) {
              this.logger.trace(`add style tag: ${i}`);
              await page.addStyleTag({ path: i });
            }
          }
          await page.screenshot({ path: ev.params.path });

          await page.close();
          if (this.config.mode !== 'keep_alive') {
            await this.destroyBrowser();
          }

          ev.resolve();
        } catch (err) {
          ev.reject(err);
        }
        break;
      }
      default:
        ev.reject(new Error('Unknown method'));
    }
  }
});
