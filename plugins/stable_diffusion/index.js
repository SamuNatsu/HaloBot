import { definePlugin } from '../../HaloBotPlugin.js';
import { parse } from 'shell-quote';
import path from 'path';
import fs from 'fs';
import joi from 'joi';
import async from 'async';
import moment from 'moment';
import url from 'url';
import ejs from 'ejs';
import { readLoraList, renderLoraList } from './utils/lora.js';
import { saveImage } from './utils/image.js';

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
  upscaler_name: joi.string().required(),
  history_count: joi.number().integer().default(0)
});

/* Export plugin */
export default definePlugin({
  meta: {
    namespace: 'rainiar.stable_diffusion',
    name: 'StableDiffusion',
    author: 'SNRainiar',
    description: '用于 HaloBot 的 StableDiffusion 插件',
    priority: 50,
    version: '2.0.0',
    botVersion: '1.0.0'
  },
  async renderHelp() {
    this.logger.info('开始渲染帮助菜单');

    // Render ejs
    const inputPath = path.join(this.currentPluginDir, './templates/help.ejs');
    const outputHtmlPath = path.join(
      this.currentPluginDir,
      './templates/help.html'
    );
    const outputHtml = await ejs.renderFile(inputPath, {
      version: this.meta.version
    });
    fs.writeFileSync(outputHtmlPath, outputHtml);

    // Render picture
    this.helpImage = await this.api.callPluginMethod(
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
  },
  getLoraInfo(ord, nsfw = true) {
    // Check order
    const ls = nsfw ? this.loraNSFWFlatList : this.loraSFWFlatList;
    if (ord > ls.length) {
      return `序号不合法`;
    }

    return `【Lora 信息】\n名字：${ls[ord].lora}${
      ls[ord].nsfw ? '🔞' : ''
    }\n全名：${ls[ord].name}${
      ls[ord].alias !== undefined ? `\n别名：${ls[ord].alias}` : ''
    }${
      ls[ord].tokens !== undefined
        ? `\n触发词列表：\n${Object.entries(ls[ord].tokens)
            .map((value) => `"${value[0]}"：${value[1]}`)
            .join('\n')}`
        : ''
    }`;
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
  async generateWorker(task) {
    // Replace prompt
    const { newPrompt, found, notFound } = this.loraAnalyzeAndReplace(
      task.prompt
    );
    const time = moment().format('YYYY-MM-DD HH:mm:ss');

    // Send message
    let msg = `现在开始处理${
      task.ev.message_type === 'private'
        ? '您'
        : ` [CQ:at,qq=${task.ev.user_id}] `
    }的生成请求`;
    if (task.hires) {
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
    if (task.resolve === undefined) {
      this.api.reply(task.ev, msg);
    }

    // Get group config
    let group;
    if (task.ev.message_type === 'group') {
      group = await this.getGroupRow(task.ev.group_id);
    }

    // Create params
    let finalPrompt;
    if (task.ev.message_type === 'private' || task.resolve !== undefined) {
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
    if (task.ev.message_type === 'private' || task.resolve !== undefined) {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        task.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    } else if (group.nsfw) {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        group.prepend_negative_prompt,
        task.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    } else {
      finalNegativePrompt = [
        this.config.prepend_negative_prompt,
        group.prepend_negative_prompt,
        this.config.sfw_prepend_negative_prompt,
        task.negativePrompt
      ]
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .join(',');
    }

    const mratio = /^([1-9]\d*):([1-9]\d*)$/.exec(task.ratio);
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
      steps: task.iterationSteps,
      restore_faces: false,
      tiling: false,
      width: w,
      height: h,
      enable_hr: task.hires,
      hr_scale: task.scale,
      hr_checkpoint_name: this.config.model_name,
      hr_sampler_name: this.config.sampler_name,
      hr_second_pass_steps: task.iterSteps,
      hr_prompt: finalPrompt,
      hr_negative_prompt: finalNegativePrompt,
      hr_upscaler: this.config.upscaler_name,
      denoising_strength: task.denoising,
      seed: task.seed ?? -1
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

    // If is call
    if (task.resolve !== undefined) {
      task.resolve(json.images[0]);
      return;
    }

    // Save image
    await saveImage.apply(this, task.ev, params, json.images[0]);

    // Send msg
    this.api.reply(
      task.ev,
      `${
        task.ev.message_type === 'group'
          ? `[CQ:at,qq=${task.ev.user_id}]\n`
          : ''
      }提交时间：${task.query_time}
处理时间：${time}
正向提示词：${task.prompt}
负向提示词：${task.negativePrompt}
种子：${json.info.seed}
[CQ:image,file=base64://${json.images[0]}]`
    );
  },

  /* Start listener */
  async onStart() {
    // Initialize config
    this.config = this.api.readYamlFile(
      path.join(this.currentPluginDir, './config.yaml')
    );
    const { error, value } = configSchema.validate(this.config);
    if (error !== undefined) {
      throw error;
    }
    this.config = value;
    this.logger.info(`插件管理员：${this.config.manager}`);

    // Initialize lora list
    const loraData = readLoraList.apply(this);
    this.loraNSFWListImage = await renderLoraList.apply(
      this,
      loraData.loraNSFWList,
      true
    );
    this.loraSFWListImage = await renderLoraList.apply(
      this,
      loraData.loraSFWList,
      false
    );

    // Check images folder
    const imagesDir = path.join(this.currentPluginDir, './images');
    if (!fs.existsSync(imagesDir)) {
      this.logger.warn(`Images 文件夹不存在，正在创建：${imagesDir}`);
      fs.mkdirSync(imagesDir);
    }

    // Initialize database
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

      // Check saved_images table
      ret = await trx.schema.hasTable('saved_images');
      if (!ret) {
        this.logger.warn('数据库中未找到 saved_images 表，正在新建');
        await trx.schema.createTable('saved_images', (tb) => {
          tb.string('file_name').primary();
          tb.text('params');
          tb.bigInteger('user_id');
          tb.bigInteger('group_id');
        });
      }
    });

    // Initialize generate queue
    this.queue = async.queue(this.generateWorker.bind(this), 1);
    this.queue.error((err, task) => {
      this.logger.error('生成出错', err, task);

      // If is call task
      if (task.resolve !== undefined) {
        task.reject(err);
        return;
      }

      // If is message task
      this.api.reply(
        task.ev,
        (task.ev.message_type === 'private'
          ? ''
          : `[CQ:at,qq=${task.ev.user_id}] `) + '生成失败\n请联系管理员检查错误'
      );
    });

    // Render images
    await this.renderHelp();
  },
  onPrivateMessage(ev) {
    // Check command
    if (!ev.raw_message.startsWith('#sd')) {
      return;
    }

    // Setup command parser
    const cmd = ev.raw_message.slice(3);
    const argv = parse(cmd);
    const program = this.api.createCommandProgram();

    program.action(() => {
      this.api.reply(
        ev,
        `【StableDiffusion 插件】
Ver ${this.meta.version}
欢迎使用 AI 绘图！
你可以在私聊中以及授权的群里使用 AI 绘图功能。
请使用命令 [#sd help] 查看帮助。`
      );
    });

    program.command('help').action(() => {
      this.api.reply(ev, this.helpImage);
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
          this.api.reply(
            ev,
            `等待队列已满，你的请求提交失败\n队列还有 ${this.config.queue_size} 个正在等待`
          );
          return;
        }

        // Validate
        if (!/^(2[0-9]|3[0-9]|40)$/.test(opt.iterationSteps)) {
          this.api.reply(ev, `迭代步数 (-i) 参数不合法`);
          return;
        }
        opt.iterationSteps = parseInt(opt.iterationSteps);

        if (opt.seed !== undefined) {
          if (!/^(0|[1-9]\d*)$/.test(opt.seed)) {
            this.api.reply(ev, `种子 (-s) 参数不合法`);
            return;
          }
          opt.seed = parseInt(opt.seed);
        }

        if (!/^[1-9]\d*:[1-9]\d*$/.test(opt.ratio)) {
          this.api.reply(ev, `宽高比 (-r) 参数不合法`);
          return;
        }

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.scale)) {
          this.api.reply(ev, `放大倍数 (-S) 参数不合法`);
          return;
        }
        opt.scale = parseFloat(opt.scale);
        if (opt.scale < 1 || opt.scale > 3) {
          this.api.reply(ev, `放大倍数 (-S) 参数不合法`);
          return;
        }

        if (!/^(0|1?\d|20)$/.test(opt.iterSteps)) {
          this.api.reply(ev, `迭代步数 (-I) 参数不合法`);
          return;
        }
        opt.iterSteps = parseInt(opt.iterSteps);

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.denoising)) {
          this.api.reply(ev, `重绘幅度 (-d) 参数不合法`);
          return;
        }
        opt.denoising = parseFloat(opt.denoising);
        if (opt.denoising > 1) {
          this.api.reply(ev, `重绘幅度 (-d) 参数不合法`);
          return;
        }

        // Push task
        opt.query_time = moment().format('YYYY-MM-DD HH:mm:ss');
        opt.ev = ev;

        await this.api.reply(
          ev,
          `生成请求已提交\n你是等待队列的第 ${this.queue.length() + 1} 个`
        );
        this.queue.push(opt);
      });

    program.command('lora-list').action(() => {
      this.api.reply(ev, `[CQ:image,file=base64://${this.loraNSFWListImage}]`);
    });

    program
      .command('lora')
      .argument('<ord>')
      .action((ord) => {
        ord = parseInt(ord);
        if (isNaN(ord) || !Number.isInteger(ord) || ord < 1) {
          this.api.reply(ev, `序号不合法`);
          return;
        }
        this.api.reply(ev, this.getLoraInfo(ord - 1));
      });

    program.command('groups').action(async () => {
      if (this.config.manager !== String(ev.user_id)) {
        return;
      }

      const res = await this.db('enabled_groups').select();
      const groups = res.map(
        (value) => `${value.group_id}${value.nsfw ? '🔞' : ''}`
      );
      if (groups.length === 0) {
        this.api.reply(ev, '插件没有在任何群中生效');
      } else {
        this.api.reply(ev, `插件在以下群中生效：\n${groups.join(', ')}`);
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
          this.api.reply(ev, `群号不合法`);
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

        this.api.reply(ev, `插件已在群 [${groupId}] 中启用`);
      });

    program
      .command('disable')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.api.reply(ev, `群号不合法`);
          return;
        }

        await this.db('enabled_groups').delete().where('group_id', groupId);

        this.api.reply(ev, `插件已在群 [${groupId}] 中禁用`);
      });

    program
      .command('sfw')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.api.reply(ev, `群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ nsfw: false })
          .where('group_id', groupId);

        this.api.reply(ev, `群 [${groupId}] 已开启健全模式`);
      });

    program
      .command('nsfw')
      .argument('<groupId>')
      .action(async (groupId) => {
        if (this.config.manager !== String(ev.user_id)) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.api.reply(ev, `群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ nsfw: true })
          .where('group_id', groupId);

        this.api.reply(ev, `群 [${groupId}] 已开启不健全模式`);
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
          this.api.reply(ev, `群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ prepend_prompt: prompt })
          .where('group_id', groupId);

        this.api.reply(ev, `群 [${groupId}] 的附加正向提示词已更新`);
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
          this.api.reply(ev, `群号不合法`);
          return;
        }

        await this.db('enabled_groups')
          .update({ prepend_negative_prompt: prompt })
          .where('group_id', groupId);

        this.api.reply(ev, `群 [${groupId}] 的附加负向提示词已更新`);
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  },
  async onGroupMessage(ev) {
    // Check command
    if (!ev.raw_message.startsWith('#sd')) {
      return;
    }

    // Check group
    const group = await this.getGroupRow(ev.group_id);
    if (group === null) {
      return;
    }

    // Initialize command parser
    const cmd = ev.raw_message.slice(3);
    const argv = parse(cmd);
    const program = this.api.createCommandProgram();

    program.action(() => {
      this.api.reply(
        ev,
        `【StableDiffusion 插件】
Ver ${this.meta.version}
欢迎使用 AI 绘图！
你可以在私聊中以及授权的群里使用 AI 绘图功能。
请使用命令 [#sd help] 查看帮助。`
      );
    });

    program.command('help').action(() => {
      this.api.reply(ev, `[CQ:image,file=base64://${this.helpImage}]`);
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
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 等待队列已满，你的请求提交失败\n队列还有 ${this.config.queue_size} 个正在等待`
          );
          return;
        }

        // Validate
        if (!/^(2[0-9]|3[0-9]|40)$/.test(opt.iterationSteps)) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 迭代步数 (-i) 参数不合法`
          );
          return;
        }
        opt.iterationSteps = parseInt(opt.iterationSteps);

        if (opt.seed !== undefined) {
          if (!/^(0|[1-9]\d*)$/.test(opt.seed)) {
            this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 种子 (-s) 参数不合法`);
            return;
          }
          opt.seed = parseInt(opt.seed);
        }

        if (!/^[1-9]\d*:[1-9]\d*$/.test(opt.ratio)) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 宽高比 (-r) 参数不合法`);
          return;
        }

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.scale)) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 放大倍数 (-S) 参数不合法`
          );
          return;
        }
        opt.scale = parseFloat(opt.scale);
        if (opt.scale < 1 || opt.scale > 3) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 放大倍数 (-S) 参数不合法`
          );
          return;
        }

        if (!/^(0|1?\d|20)$/.test(opt.iterSteps)) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 迭代步数 (-I) 参数不合法`
          );
          return;
        }
        opt.iterSteps = parseInt(opt.iterSteps);

        if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.denoising)) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 重绘幅度 (-d) 参数不合法`
          );
          return;
        }
        opt.denoising = parseFloat(opt.denoising);
        if (opt.denoising > 1) {
          this.api.reply(
            ev,
            `[CQ:at,qq=${ev.user_id}] 重绘幅度 (-d) 参数不合法`
          );
          return;
        }

        // Push task
        opt.query_time = moment().format('YYYY-MM-DD HH:mm:ss');
        opt.ev = ev;

        await this.api.reply(
          ev,
          `[CQ:at,qq=${ev.user_id}] 生成请求已提交\n你是等待队列的第 ${
            this.queue.length() + 1
          } 个`
        );
        this.queue.push(opt);
      });

    // Lora list
    program.command('lora-list').action(() => {
      this.api.reply(
        ev,
        `[CQ:image,file=base64://${
          group.nsfw ? this.loraListNSFW : this.loraListSFW
        }]`
      );
    });

    // Lora info
    program
      .command('lora')
      .argument('<order>')
      .action((order) => {
        // Check lora order
        if (!/^[1-9]\d*$/.test(order)) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 序号不合法`);
          return;
        }
        order = parseInt(order);

        order = this.getLoraInfo(order - 1, group.nsfw);
        this.api.reply(ev, order ?? `[CQ:at,qq=${ev.user_id}] 序号不合法`);
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  },

  /* Call listeners */
  onCall(ev) {
    switch (ev.method_name) {
      case 'generate': {
        // Generate params with default value
        const task = {
          prompt: '',
          negativePrompt: '',
          iterationSteps: 25,
          seed: -1,
          ratio: '1:1',
          hires: false,
          scale: 2,
          iterSteps: 10,
          denoising: 0.2,
          ...ev.params,
          resolve: ev.resolve,
          reject: ev.reject,
          ev
        };

        // Add task
        this.queue.push(task);
        break;
      }
      default:
        ev.reject(new Error(`不支持的方法: ${ev.method_name}`));
    }
  }
});
