/// Render module
import path from 'path';
import moment from 'moment';
import fs from 'fs';
import ejs from 'ejs';

export function renderHelp(plugin, manager) {
  plugin.logger.info('开始渲染帮助菜单');

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

export function renderLoraList(plugin, loras, nsfw) {
  plugin.logger.info('开始渲染 Lora 列表' + (nsfw ? ' (NSFW)' : ''));

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/lora_list.ejs'
  );

  return renderTemplate(plugin, templatePath, { loras, nsfw });
}

export function renderLoraInfo(plugin, lora) {
  plugin.logger.info(`开始渲染 Lora 信息: ${lora.lora}`);

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/lora_info.ejs'
  );

  return renderTemplate(plugin, templatePath, lora);
}

export function renderGroups(plugin, groups) {
  plugin.logger.info('开始渲染启用群组信息');

  // Template name
  const templatePath = path.join(
    plugin.currentPluginDir,
    './templates/groups.ejs'
  );

  return renderTemplate(plugin, templatePath, { groups });
}

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
