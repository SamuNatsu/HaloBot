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

export function readLoraList(plugin) {
  plugin.logger.info('正在读取 Lora 列表');

  // Check loras folder
  const loraDir = path.join(plugin.currentPluginDir, './loras');
  if (!fs.existsSync(loraDir)) {
    plugin.logger.warn(`Loras 文件夹不存在，正在创建：${loraDir}`);
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
      let lora = plugin.api.readYamlFile(filePath);
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
      plugin.logger.info(`Lora 分类 "${lora.category_name}" 已加载`);
    } catch (err) {
      plugin.logger.error(`Lora 文件解析失败: ${filePath}`, err);
    }
  });

  return { loraNSFWList, loraSFWList, loraNameSet, loraAliasMap, loraMap };
}

export function loraAnalyzeAndReplace(plugin, prompt) {
  const found = [];
  const notFound = [];

  // Replace lora alias
  const newPrompt = prompt.replaceAll(
    /<lora:([0-9a-zA-Z-_ ]+):((0|[1-9]\d*)(\.\d*[1-9])?)>/g,
    (_, name, weight) => {
      // Get real name if exists
      let realName;
      if (plugin.loraAliasMap.has(name)) {
        realName = plugin.loraAliasMap.get(name);
      }

      // Classify
      if (plugin.loraNameSet.has(realName ?? name)) {
        found.push({
          name,
          realName,
          weight
        });
      } else {
        notFound.push({
          name,
          realName,
          weight
        });
      }

      // Replace
      return `<lora:${realName ?? name}:${weight}>`;
    }
  );

  return { newPrompt, found, notFound };
}
