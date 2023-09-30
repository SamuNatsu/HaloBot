import { definePlugin } from '../../HaloBotPlugin.js';
import { parse } from 'shell-quote';
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import joi from 'joi';
import async from 'async';
import moment from 'moment';
import url from 'url';

const loraPageLine = 10;

/* Text */
const loraReadme = `请在这个文件夹下存放支持的 Lora 列表信息
每个文件将作为一个 Lora 分类，以 YAML 文件格式存储，使用 .yaml 扩展名
如果文件名以下划线 _ 开头，则这个文件会被忽略，你可以用它来禁用一些 Lora 信息

一个文件模板已经自动生成为 "_template.yaml"，你可以查看如何填写
`;
const loraTemplate = `# 这里填写分类的名字，必填
category_name: 未分类

# 这里是该分类下 Lora 的信息列表，必填
list:
  # 以下是一个样例填写
  - lora: 测试 Lora  # Lora 的显示名称，必填
    name: test  # Lora 的调用名称，即 <lora:XXX:1> 中的那个 XXX，必填
    alias: test  # Lora 调用别名，有些调用名称特别长，所以插件提供了使用别名替换的功能，这是可选的
    nsfw: false # Lora 是否为 NSFW，在 SFW 群聊里该 Lora 将不会出现在 Lora 列表中，但是你仍然可以使用它，默认为 false
    tokens: # Lora 触发词信息表，这是一个对象类型，键为触发词，值为描述信息，用于告诉用户需要哪些触发词来使用 Lora，这是可选的
      test1: 测试触发词 1
      test2: 测试触发词 2
`;

/* Schemas */
const configSchema = joi.object({
  manager: joi
    .string()
    .pattern(/^[1-9]\d*$/)
    .required(),
  api: joi.string().uri().required(),
  queue_size: joi.number().integer().min(1).default(5),
  lora_page_size: joi.number().integer().min(1).default(10),
  model_name: joi.string().required(),
  sampler_name: joi.string().required(),
  prepend_prompt: joi.string().allow('').default(''),
  prepend_negative_prompt: joi.string().allow('').default(''),
  sfw_prepend_negative_prompt: joi.string().allow('').default(''),
  upscaler_name: joi.string().required()
});
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

/* Export plugin */
export default definePlugin({
  meta: {
    namespace: 'rainiar.sd',
    name: 'StableDiffusion',
    author: 'SNRainiar',
    description: '用于 HaloBot 的 StableDiffusion 插件',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  readLoraList() {
    // Check loras folder
    const loraDir = path.join(this.currentPluginDir, './loras');
    if (!fs.existsSync(loraDir)) {
      this.logger.warn(`Loras 文件夹不存在，正在创建：${loraDir}`);
      fs.mkdirSync(loraDir, { recursive: true });
      fs.writeFileSync(path.join(loraDir, './README.txt'), loraReadme);
      fs.writeFileSync(path.join(loraDir, './_template.yaml'), loraTemplate);
    }

    // Scann loras folder
    const loraCategory = {};
    const loraList = [];
    const loraMap = new Map();
    const loraNameSet = new Set();
    const loraAliasMap = new Map();
    fs.readdirSync(loraDir).forEach((value) => {
      // Check file name
      if (value.startsWith('_') || !value.endsWith('.yaml')) {
        return;
      }

      const filePath = path.join(loraDir, value);
      try {
        // Read category
        let lora = this.bot.utils.readYamlFile(filePath);
        const { error, value } = loraSchema.validate(lora);
        if (error !== undefined) {
          throw error;
        }
        lora = value;

        // Check alias conflict
        lora.list.forEach((value) => {
          if (value.alias !== undefined) {
            if (loraNameSet.has(value.alias)) {
              throw new Error(
                `Lora "${value.lora}" 的别名 "${value.alias}" 与其他 Lora 的调用名发生冲突`
              );
            }
            if (loraAliasMap.has(value.alias)) {
              throw new Error(
                `Lora "${value.lora}" 的别名 "${value.alias}" 与其他 Lora 的别名发生冲突`
              );
            }
          }
        });

        // Update data
        loraCategory[lora.category_name] = [
          loraList.length,
          loraList.length + lora.list.length
        ];
        lora.list.forEach((value) => {
          loraList.push(value);
          loraMap.set(value.name, value);
          loraNameSet.add(value.name);
          if (value.alias !== undefined) {
            loraAliasMap.set(value.alias, value.name);
          }
        });
        this.logger.info(
          `Lora 分类 "${lora.category_name}" 已加载`
        );
      } catch (err) {
        this.logger.error(`Lora 文件解析失败: ${filePath}`, err);
      }
    });

    // Store
    this.loraCategory = loraCategory;
    this.loraList = loraList;
    this.loraMap = loraMap;
    this.loraNameSet = loraNameSet;
    this.loraAliasMap = loraAliasMap;
  },
  loraAnalyzeAndReplace(prompt) {
    const found = [];
    const notFound = [];
    const newPrompt = prompt.replaceAll(
      /<lora:([0-9a-zA-Z-_ ]+):((0|[1-9]\d*)(\.\d*[1-9])?)>/g,
      (_, name, weight) => {
        // Get real name if exists
        let realName;
        if (this.loraAliasMap.has(name)) {
          realName = this.loraAliasMap.get(name);
        }

        // Classify
        if (this.loraNameSet.has(realName ?? name)) {
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
  },
  async getGroupRow(groupId) {
    const row = await this.db('enabled_groups')
      .select()
      .where('group_id', groupId);
    return row.length === 0 ? null : row[0];
  },
  async generateWorker(data) {
    // Replace prompt
    const { newPrompt, found, notFound } = this.loraAnalyzeAndReplace(
      data.prompt
    );
    const time = moment().format('YYYY-MM-DD HH:mm:ss');

    // Send message
    let msg = `现在开始处理${
      data.groupId === undefined ? '您' : ` [CQ:at,qq=${data.userId}] `
    }的生成请求`;
    if (data.hires) {
      msg += '\n🔍高分辨率已开启';
    }
    if (found.length !== 0) {
      msg +=
        '\n✅检测到支持的 Lora：\n' +
        found
          .map(
            (value) =>
              `[${value.name}] ${
                this.loraMap.get(value.realName ?? value.name).lora
              } (${value.weight})`
          )
          .join('\n');
    }
    if (notFound.length !== 0) {
      msg +=
        '\n❌检测到不支持的 Lora：\n' +
        notFound
          .map((value) => `[${value.name}] ??? (${value.weight})`)
          .join('\n');
    }
    if (data.groupId === undefined) {
      this.bot.sendPrivateMsg(data.userId, msg);
    } else {
      this.bot.sendGroupMsg(data.groupId, msg);
    }

    // Get group config
    let group;
    if (data.groupId !== undefined) {
      group = await this.getGroupRow(data.groupId);
    }

    // Create params
    let finalPrompt;
    if (data.groupId === undefined) {
      finalPrompt = [this.config.prepend_prompt, newPrompt]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    } else {
      finalPrompt = [
        this.config.prepend_prompt,
        group.prepend_prompt,
        newPrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    }

    let finalNegativePrompt;
    if (data.groupId === undefined) {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        data.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    } else if (group.nsfw) {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        group.prepend_negative_prompt,
        data.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    } else {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        group.prepend_negative_prompt,
        this.config.sfw_prepend_negative_prompt,
        data.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    }

    const mratio = /^([1-9]\d*):([1-9]\d*)$/.exec(data.ratio);
    const ratio = parseInt(mratio[1]) / parseInt(mratio[2]);
    const h = Math.ceil(Math.sqrt(262144 / ratio));
    const w = Math.ceil(h * ratio);

    const params = {
      override_settings: {
        sd_model_checkpoint: this.config.model_name
      },
      prompt: finalPrompt,
      negative_prompt: finalNegativePrompt,
      sampler_name: this.config.sampler_name,
      steps: data.iterationSteps,
      restore_faces: false,
      tiling: false,
      width: w,
      height: h,
      enable_hr: data.hires,
      hr_scale: data.scale,
      hr_checkpoint_name: this.config.model_name,
      hr_sampler_name: this.config.sampler_name,
      hr_second_pass_steps: data.iterSteps,
      hr_prompt: finalPrompt,
      hr_negative_prompt: finalNegativePrompt,
      hr_upscaler: this.config.upscaler_name,
      denoising_strength: data.denoising,
      seed: data.seed ?? -1
    };
    this.logger.trace('绘图参数', params);

    // Send request
    const res = await fetch(url.resolve(this.config.api, '/sdapi/v1/txt2img'), {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(params)
    });
    const json = await res.json();
    json.info = JSON.parse(json.info);

    // Send msg
    if (data.groupId === undefined) {
      this.bot.sendPrivateMsg(
        data.userId,
        `提交时间：${data.query_time}\n处理时间：${time}\n正向提示词：${data.prompt}\n负向提示词：${data.negativePrompt}\n种子：${json.info.seed}\n[CQ:image,file=base64://${json.images[0]}]`
      );
    } else {
      this.bot.sendGroupMsg(
        data.groupId,
        `[CQ:at,qq=${data.userId}]\n提交时间：${data.query_time}\n处理时间：${time}\n正向提示词：${data.prompt}\n负向提示词：${data.negativePrompt}\n种子：${json.info.seed}\n[CQ:image,file=base64://${json.images[0]}]`
      );
    }
  },
  async onStart() {
    // Initialize config
    this.config = this.bot.utils.readYamlFile(
      path.join(this.currentPluginDir, './config.yaml')
    );
    const { error, value } = configSchema.validate(this.config);
    if (error !== undefined) {
      throw error;
    }
    this.config = value;
    this.logger.info(`插件管理员：${this.config.manager}`);

    // Initialzie lora list
    this.readLoraList();

    // Initialize database
    this.db = this.bot.utils.openCurrentPluginDB(import.meta.url);
    await this.db.transaction(async (trx) => {
      // Check options table
      let ret = await trx.schema.hasTable('options');
      if (!ret) {
        this.logger.warn('数据库中未找到 options 表，正在新建');
        await trx.schema.createTable('options', (tb) => {
          tb.string('key').primary();
          tb.text('value');
        });
      }

      // Check enabled_groups table
      ret = await trx.schema.hasTable('enabled_groups');
      if (!ret) {
        this.logger.warn('数据库中未找到 enabled_groups 表，正在新建');
        await trx.schema.createTable('enabled_groups', (tb) => {
          tb.bigInteger('group_id').primary();
          tb.boolean('nsfw');
          tb.text('prepend_prompt');
          tb.text('prepend_negative_prompt');
        });
      }
    });

    // Initialize tutorial
    this.tutorials = this.bot.utils.readYamlFile(
      path.join(this.currentPluginDir, './tutorials.yaml')
    );

    // Initialize generate queue
    this.queue = async.queue(this.generateWorker.bind(this), 1);
    this.queue.error((err, task) => {
      this.logger.error('生成出错', err, task);
      if (task.groupId === undefined) {
        this.bot.sendPrivateMsg(task.userId, '生成失败\n请联系管理员检查错误');
      } else {
        this.bot.sendGroupMsg(
          task.groupId,
          `[CQ:at,qq=${task.userId}] 生成失败\n请联系管理员检查错误`
        );
      }
    });
  },
  onPrivateMessage(ev) {
    // Check command
    if (!ev.raw_message.startsWith('#sd')) {
      return;
    }

    const cmd = ev.raw_message.slice(3);
    const argv = parse(cmd);
    const program = new Command();
    program.exitOverride();
    program.configureOutput({
      writeErr: () => {},
      writeOut: () => {}
    });

    program.action(() => {
      this.bot.sendPrivateMsg(
        ev.user_id,
        `【StableDiffusion 插件】\nVer.${this.meta.version}\n欢迎使用 AI 绘图！\n你可以在私聊中以及授权的群里使用 AI 绘图功能。\n请使用命令 [#sd help] 查看帮助。`
      );
    });

    program
      .command('help')
      .argument('[sub]')
      .action((sub) => {
        switch (sub) {
          case undefined:
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【插件帮助】\n[#sd help draw] 查看绘图帮助\n[#sd help lora] 查看 Lora 帮助` +
                (this.config.manager === String(ev.user_id)
                  ? '\n[#sd help manage] 查看管理帮助'
                  : '')
            );
            break;
          case 'draw':
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【绘图帮助】\n建议在私聊里查看教程以避免刷屏\n[#sd tutorial [页码]] 查看绘图教程的某一页\n[#sd draw [...]] 绘图命令，具体使用请查看绘图教程`
            );
            break;
          case 'lora':
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【Lora 帮助】\n建议在私聊里查看 Lora 信息以避免刷屏\n[#sd loras [页码]] 查看 Lora 列表的某一页\n[#sd lora <序号>] 查看某序号 Lora 的详细信息`
            );
            break;
          case 'manage':
            if (this.config.manager !== String(ev.user_id)) {
              this.bot.sendPrivateMsg(
                ev.user_id,
                `【插件帮助】\n找不到名为 "${sub}" 的帮助子项`
              );
              break;
            }
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【管理帮助】\n以下命令只能通过私聊触发，且只有插件管理员能得到响应。\n[#sd groups] 查看所有启用插件的群号\n[#sd enable <群号>] 在某个群中启用插件\n[#sd disable <群号>] 在某个群中禁用插件\n[#sd sfw <群号>] 设置某个群为健全群\n[#sd nsfw <群号>] 设置某个群为不健全群\n[#sd prompt <群号> <正向提示词>] 设置某个群额外的正向提示词\n[#sd negative_prompt <群号> <负向提示词>] 设置某个群的额外负向提示词`
            );
            break;
          default:
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【插件帮助】\n找不到名为 "${sub}" 的帮助子项`
            );
        }
      });

    program
      .command('tutorial')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.bot.sendPrivateMsg(ev.user_id, `【绘图教程】\n页码不合法`);
          return;
        }
        if (page > this.tutorials.length) {
          this.bot.sendPrivateMsg(ev.user_id, `【绘图教程】\n没有更多的页了`);
          return;
        }

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【绘图教程 (${page}/${this.tutorials.length})】\n${this.tutorials[
            page - 1
          ].trim()}`
        );
      });

    program
      .command('draw')
      .option('-p|--prompt <prompt>', undefined, '')
      .option('-n|--negativePrompt <prompt>', undefined, '')
      .option('-i|--iterationSteps <steps>', undefined, '25')
      .option('-s|--seed <seed>')
      .option('-r|--ratio <ratio>', undefined, '1:1')
      .option('-h|--no-hires')
      .option('-S|--scale <scale>', undefined, '2')
      .option('-I|--iterSteps <steps>', undefined, '10')
      .option('-d|--denoising <denoising>', undefined, '0.2')
      .action(async (opt) => {
        // Check queue
        if (this.queue.length() >= this.config.queue_size) {
          this.bot.sendPrivateMsg(
            ev.user_id,
            `等待队列已满，你的请求提交失败\n队列还有 ${this.queue.queue_size} 个正在等待`
          );
          return;
        }

        // Validate
        if (!/^(2[0-9]|3[0-9]|40)$/.test(opt.iterationSteps)) {
          this.bot.sendPrivateMsg(ev.user_id, `迭代步数 (-i) 参数不合法`);
          return;
        }
        opt.iterationSteps = parseInt(opt.iterationSteps);

        if (opt.seed !== undefined) {
          if (!/^(0|[1-9]\d*)$/.test(opt.seed)) {
            this.bot.sendPrivateMsg(ev.user_id, `种子 (-s) 参数不合法`);
            return;
          }
          opt.seed = parseInt(opt.seed);
        }

        if (!/^[1-9]\d*:[1-9]\d*$/.test(opt.ratio)) {
          this.bot.sendPrivateMsg(ev.user_id, `宽高比 (-r) 参数不合法`);
          return;
        }

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.scale)) {
          this.bot.sendPrivateMsg(ev.user_id, `放大倍数 (-S) 参数不合法`);
          return;
        }
        opt.scale = parseFloat(opt.scale);
        if (opt.scale < 1 || opt.scale > 3) {
          this.bot.sendPrivateMsg(ev.user_id, `放大倍数 (-S) 参数不合法`);
          return;
        }

        if (!/^(0|1?\d|20)$/.test(opt.iterSteps)) {
          this.bot.sendPrivateMsg(ev.user_id, `迭代步数 (-I) 参数不合法`);
          return;
        }
        opt.iterSteps = parseInt(opt.iterSteps);

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.denoising)) {
          this.bot.sendPrivateMsg(ev.user_id, `重绘幅度 (-d) 参数不合法`);
          return;
        }
        opt.denoising = parseFloat(opt.denoising);
        if (opt.denoising > 1) {
          this.bot.sendPrivateMsg(ev.user_id, `重绘幅度 (-d) 参数不合法`);
          return;
        }

        // Push task
        opt.query_time = moment().format('YYYY-MM-DD HH:mm:ss');
        opt.userId = ev.user_id;

        await this.bot.sendPrivateMsg(
          ev.user_id,
          `生成请求已提交\n你是等待队列的第 ${this.queue.length() + 1} 个`
        );
        this.queue.push(opt);
      });

    /** loras, lora */

    program.command('groups').action(async () => {
      if (this.config.manager !== String(ev.user_id)) {
        return;
      }

      const res = await this.db('enabled_groups').select();
      const groups = res.map(
        (value) => `${value.group_id}${value.nsfw ? '🔞' : ''}`
      );
      if (groups.length === 0) {
        this.bot.sendPrivateMsg(
          ev.user_id,
          '【插件管理】\n插件没有在任何群中生效'
        );
      } else {
        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n插件在以下群中生效：\n${groups.join(', ')}`
        );
      }
    });

    program
      .command('enable')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .insert({
            group_id: groupId,
            nsfw: false,
            prepend_prompt: '',
            prepend_negative_prompt: ''
          })
          .onConflict()
          .ignore();

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n插件已在群 [${groupId}] 中启用`
        );
      });

    program
      .command('disable')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups').delete().where('group_id', groupId);

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n插件已在群 [${groupId}] 中禁用`
        );
      });

    program
      .command('sfw')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ nsfw: false })
          .where('group_id', groupId);

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n群 [${groupId}] 已开启健全模式`
        );
      });

    program
      .command('nsfw')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ nsfw: true })
          .where('group_id', groupId);

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n群 [${groupId}] 已开启不健全模式`
        );
      });

    program
      .command('prompt')
      .argument('<groupId>')
      .argument('<prompt>')
      .action(async (groupId, prompt) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ prepend_prompt: prompt })
          .where('group_id', groupId);

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n群 [${groupId}] 的附加正向提示词已更新`
        );
      });

    program
      .command('negative_prompt')
      .argument('<groupId>')
      .argument('<prompt>')
      .action(async (groupId, prompt) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(ev.user_id, `【插件管理】\n群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ prepend_negative_prompt: prompt })
          .where('group_id', groupId);

        this.bot.sendPrivateMsg(
          ev.user_id,
          `【插件管理】\n群 [${groupId}] 的附加负向提示词已更新`
        );
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  }
});
