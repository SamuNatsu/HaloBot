/// Render module
import ejs from 'ejs';
import fs from 'fs';
import moment from 'moment';
import path from 'path';
import { getCache } from './cache.js';

/* Render help image */
export function renderHelp(plugin, manager) {
  plugin.logger.info('开始渲染帮助菜单' + (manager ? ' (插件管理员)' : ''));

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates',
    manager ? './help_manage.ejs' : './help.ejs'
  );

  return renderTemplate(plugin, templatePath, {
    version: plugin.meta.version
  });
}

/* Render lora list */
export function renderLoraList(plugin, loras, nsfw) {
  plugin.logger.info('开始渲染 Lora 列表' + (nsfw ? ' (NSFW)' : ''));

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/lora_list.ejs'
  );

  return renderTemplate(plugin, templatePath, { loras, nsfw });
}

/* Render lora info with cache */
export function renderLoraInfo(plugin, lora) {
  plugin.logger.info(`开始渲染 Lora 信息: ${lora.lora}`);

  // Return cache
  return getCache(plugin, 'lora__' + lora.name, 3600000, async () => {
    // Template name
    const templatePath = path.join(
      plugin.currentPluginDir,
      './templates/lora_info.ejs'
    );

    return await renderTemplate(plugin, templatePath, { lora });
  });
}

/* Render wrapped image */
export function renderWrappedImage(plugin, image) {
  plugin.logger.info('开始渲染包装图片');

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/wrapped_image.ejs'
  );

  return renderTemplate(plugin, templatePath, { image });
}

/* Render group info */
export function renderGroupInfo(plugin, group, config) {
  plugin.logger.info('开始渲染群组信息');

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/group_info.ejs'
  );

  return renderTemplate(plugin, templatePath, { group, config });
}

/* Render groups */
export function renderGroups(plugin, groups) {
  plugin.logger.info('开始渲染启用群组信息');

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/groups.ejs'
  );

  return renderTemplate(plugin, templatePath, { groups });
}

/* Render EJS */
async function renderTemplate(plugin, templatePath, data) {
  // Dirname
  const dirname = path.dirname(templatePath);

  // Html path
  const htmlPath = path.join(
    dirname,
    moment().format('YYYYMMDDHHmmssSS[.html]')
  );

  // Render template
  const outputHtml = await ejs.renderFile(templatePath, data);

  // Write html file
  fs.writeFileSync(htmlPath, outputHtml);

  // Render image
  const b64Data = await plugin.api.callPluginMethod(
    'rainiar.html_renderer',
    'render',
    {
      type: 'file',
      action: async (page) => {
        // Get DOM size
        const body = await page.$('body');
        const { width, height } = await body.boundingBox();

        // Set viewport as DOM size
        await page.setViewport({
          width: Math.ceil(width),
          height: Math.ceil(height)
        });
      },
      target: 'file://' + htmlPath
    }
  );

  // Delete html file
  fs.rmSync(htmlPath);

  return b64Data;
}
