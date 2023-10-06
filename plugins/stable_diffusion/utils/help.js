/// Help module

export async function renderHelp(plugin, manager) {
  plugin.logger.info('开始渲染帮助菜单');

  // Render ejs
  const fileName = manager
    ? './templates/help_admin.ejs'
    : './templates/help.ejs';
  const inputPath = path.join(plugin.currentPluginDir, fileName);
  const outputHtmlPath = path.join(
    plugin.currentPluginDir,
    './templates/help.html'
  );
  const outputHtml = await ejs.renderFile(inputPath, {
    version: plugin.meta.version
  });
  fs.writeFileSync(outputHtmlPath, outputHtml);

  // Render picture
  const b64 = await plugin.api.callPluginMethod(
    'rainiar.html_renderer',
    'render',
    {
      type: 'file',
      action: async (page) => {
        const body = await page.$('body');
        const { width, height } = await body.boundingBox();
        await page.setViewport({
          width: Math.ceil(width),
          height: Math.ceil(height)
        });
      },
      target: 'file://' + outputHtmlPath
    }
  );
  fs.rmSync(outputHtmlPath);

  return b64;
}
