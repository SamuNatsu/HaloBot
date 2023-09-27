import { fileURLToPath } from 'url';
import { definePlugin } from '../../HaloBotPlugin.js';
import { dirname, join } from 'path';

export default definePlugin({
  meta: {
    namespace: 'rainiar.test',
    name: 'Test',
    author: 'SNRainiar',
    description: 'Test',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  onStart(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this.curdir = dirname(fileURLToPath(import.meta.url));

    setTimeout(async () => {
      this.logger.trace('try render');
      await this.bot.callPluginMethod(
        'render',
        {
          viewport: {
            width: 800,
            height: 600
          },
          type: 'file',
          html: 'file://' + join(this.curdir, './index.html'),
          path: join(this.curdir, './a.png')
        },
        'rainiar.html_renderer'
      );
      this.logger.trace('render done');
    }, 2000);
  }
});
