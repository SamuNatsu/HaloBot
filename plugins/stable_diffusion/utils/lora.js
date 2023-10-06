/// Lora utils
import fs from 'fs';
import path from 'path';
import joi from 'joi';

/* Schemas */
const loraSchema = joi.object({
  category_name: joi.string().required(),
  list: joi
    .array()
    .items({
      lora: joi.string().required(),
      name: joi.string().required(),
      alias: joi.string(),
      nsfw: joi.boolean().default(false),
      tokens: joi.object().pattern(/^.+$/, joi.string())
    })
    .required()
});

export function readLoraList() {
  this.logger.info('正在读取 Lora 列表');

  // Check loras folder
  const loraDir = path.join(this.currentPluginDir, './loras');
  if (!fs.existsSync(loraDir)) {
    this.logger.warn(`Loras 文件夹不存在，正在创建：${loraDir}`);
    fs.mkdirSync(loraDir);
  }

  // Scan loras folder
  const loraNameSet = new Set();
  const loraAliasMap = new Map();
  const loraNSFWList = [];
  const loraSFWList = [];
  const loraMap = new Map();
  fs.readdirSync(loraDir).forEach((value) => {
    // Check file name
    const filePath = path.join(loraDir, value);
    if (value.startsWith('_') || !value.endsWith('.yaml')) {
      return;
    }

    try {
      // Read category
      let lora = this.api.readYamlFile(filePath);
      const { error, value } = loraSchema.validate(lora);
      if (error !== undefined) {
        throw error;
      }
      lora = value;

      // Check alias conflict
      lora.list.forEach((value) => {
        if (loraNameSet.has(value.name)) {
          throw new Error(
            `Lora "${value.lora}" 的名字 "${value.name}" 与其他 Lora 的名字发生冲突`
          );
        }
        if (value.alias === undefined) {
          return;
        }
        if (loraNameSet.has(value.alias)) {
          throw new Error(
            `Lora "${value.lora}" 的别名 "${value.alias}" 与其他 Lora 的名字发生冲突`
          );
        }
        if (loraAliasMap.has(value.alias)) {
          throw new Error(
            `Lora "${value.lora}" 的别名 "${value.alias}" 与其他 Lora 的别名发生冲突`
          );
        }
      });

      // Split SFW and NSFW
      loraNSFWList.push(lora);
      const list = lora.list.filter((value) => !value.nsfw);
      if (list.length > 0) {
        loraSFWList.push({ ...lora, list });
      }

      // Update data
      lora.list.forEach((value) => {
        loraNameSet.add(value.name);
        loraMap.set(value.alias ?? value.name, value);
        if (value.alias !== undefined) {
          loraAliasMap.set(value.alias, value.name);
        }
      });
      this.logger.info(`Lora 分类 "${lora.category_name}" 已加载`);
    } catch (err) {
      this.logger.error(`Lora 文件解析失败: ${filePath}`, err);
    }
  });

  return { loraNSFWList, loraSFWList, loraNameSet, loraAliasMap, loraMap };
}

export async function renderLoraList(loras, nsfw) {
  this.logger.info('开始渲染 Lora 列表' + (nsfw ? ' (NSFW)' : ''));

  // Render ejs
  const inputPath = path.join(
    this.currentPluginDir,
    './templates/lora_list.ejs'
  );
  const outputHtmlPath = path.join(
    this.currentPluginDir,
    './templates/lora_list.html'
  );
  const outputHtml = await ejs.renderFile(inputPath, { loras, nsfw });
  fs.writeFileSync(outputHtmlPath, outputHtml);

  // Render picture
  const b64 = await this.api.callPluginMethod(
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
