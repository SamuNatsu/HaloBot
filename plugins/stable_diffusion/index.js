import { definePlugin } from '../../HaloBotPlugin.js';
import { parse } from 'shell-quote';
import path from 'path';
import fs from 'fs';
import joi from 'joi';
import async from 'async';
import moment from 'moment';
import url from 'url';

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
  upscaler_name: joi.string().required(),
  history_count: joi.number().integer().default(0)
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
    namespace: 'rainiar.stable_diffusion',
    name: 'StableDiffusion',
    author: 'SNRainiar',
    description: '用于 HaloBot 的 StableDiffusion 插件',
    priority: 50,
    version: '2.0.0',
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
        let lora = this.api.readYamlFile(filePath);
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

        // Update task
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
        this.logger.info(`Lora 分类 "${lora.category_name}" 已加载`);
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
  getLoraPage(page, nsfw = true) {
    const ct = Object.entries(this.loraCategory)
      .map((value) => [
        value[0],
        this.loraList
          .slice(value[1][0], value[1][1])
          .filter((value) => !value.nsfw || nsfw)
      ])
      .filter((value) => value[1].length !== 0)
      .map((value) => {
        const pg = Math.ceil(value[1].length / this.config.lora_page_size);
        const ret = [];
        for (let i = 0; i < pg; i++) {
          const sub = value[1].slice(
            i * this.config.lora_page_size,
            (i + 1) * this.config.lora_page_size
          );
          ret.push(
            sub.map((value) => `${value.lora}${value.nsfw ? '🔞' : ''}`)
          );
        }
        return { category: value[0], list: ret };
      });
    let pgs = [`【Lora 分类目录】\n`];
    let acc = 1;
    let bcc = 2;
    ct.forEach((v1) => {
      pgs[0] += `${v1.category}：${bcc} 到 ${bcc + v1.list.length - 1} 页\n`;
      v1.list.forEach((v2) => {
        pgs.push(
          `【Lora 列表】\n${v2
            .map((value, idx) => `[${acc + idx}] ${value}`)
            .join('\n')}`
        );
        acc += v2.length;
      });
      bcc += v1.list.length;
    });
    pgs[0] = pgs[0].trim();
    return pgs[page];
  },
  getLoraInfo(ord, nsfw = true) {
    const ls = this.loraList.filter((value) => !value.nsfw || nsfw);
    if (ord >= ls.length) {
      return null;
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
  async saveImage(ev, params, b64) {
    // Check enabled save images
    if (this.config.history_count === 0) {
      return;
    }

    // Save file
    const name = moment().format('YYYYMMDD_HHmmss') + '.png';
    const filePath = path.join(this.currentPluginDir, './images', name);
    const dec64 = Buffer.from(b64, 'base64');
    fs.writeFileSync(filePath, dec64);
    this.logger.info(`图片已保存至: ${filePath}`);

    // Write database
    await this.db.transaction(async (trx) => {
      // Insert row
      await trx('saved_images').insert({
        file_name: name,
        params: JSON.stringify(params),
        user_id: ev.user_id,
        group_id: ev.group_id
      });

      // Check infinite
      if (this.config.history_count < 0) {
        return;
      }

      // Get count
      const rows = await trx('saved_images').count('* as count');
      if (rows[0].count <= this.config.history_count) {
        return;
      }

      // Delete oldest
      const img = await trx('saved_images').limit(1).orderBy('file_name');
      fs.rmSync(path.join(this.currentPluginDir, './images', img[0].file_name));
      await trx('saved_images').delete().where({ file_name: img[0].file_name });
      this.logger.warn(`图片已删除: ${img[0].file_name}`);
    });
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
    this.saveImage(task.ev, params, json.images[0]);

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

    // Check images folder
    const imagesDir = path.join(this.currentPluginDir, './images');
    if (!fs.existsSync(imagesDir)) {
      this.logger.warn(`Images 文件夹不存在，正在创建：${imagesDir}`);
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Initialzie lora list
    this.readLoraList();

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

    // Initialize tutorial
    this.tutorials = this.api.readYamlFile(
      path.join(this.currentPluginDir, './tutorials.yaml')
    );

    // Initialize generate queue
    this.queue = async.queue(this.generateWorker.bind(this), 1);
    this.queue.error((err, task) => {
      this.logger.error('生成出错', err, task);

      if (task.resolve !== undefined) {
        task.reject(err);
        return;
      }

      if (task.ev.message_type === 'private') {
        this.api.reply(task.ev, '生成失败\n请联系管理员检查错误');
      } else {
        this.api.reply(
          task.ev,
          `[CQ:at,qq=${task.ev.user_id}] 生成失败\n请联系管理员检查错误`
        );
      }
    });
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

    program
      .command('help')
      .argument('[sub]')
      .action((sub) => {
        switch (sub) {
          case undefined:
            this.api.reply(
              ev,
              `【插件帮助】
[#sd help draw] 查看绘图帮助
[#sd help lora] 查看 Lora 帮助` +
                (this.config.manager === String(ev.user_id)
                  ? '\n[#sd help manage] 查看管理帮助'
                  : '')
            );
            break;
          case 'draw':
            this.api.reply(
              ev,
              `【绘图帮助】
  建议在私聊里查看教程以避免刷屏
  [#sd tutorial [页码]] 查看绘图教程的某一页
  [#sd draw [...]] 绘图命令，具体使用请查看绘图教程`
            );
            break;
          case 'lora':
            this.api.reply(
              ev,
              `【Lora 帮助】
建议在私聊里查看 Lora 信息以避免刷屏
[#sd loras [页码]] 查看 Lora 列表的某一页，其中第 1 页为目录
[#sd lora <序号>] 查看某序号 Lora 的详细信息`
            );
            break;
          case 'manage':
            if (this.config.manager !== String(ev.user_id)) {
              this.api.reply(ev, `找不到名为 "${sub}" 的帮助子项`);
              break;
            }
            this.api.reply(
              ev,
              `【管理帮助】
以下命令只能通过私聊触发，且只有插件管理员能得到响应。
[#sd groups] 查看所有启用插件的群号
[#sd enable <群号>] 在某个群中启用插件
[#sd disable <群号>] 在某个群中禁用插件
[#sd sfw <群号>] 设置某个群为健全群
[#sd nsfw <群号>] 设置某个群为不健全群
[#sd prompt <群号> <正向提示词>] 设置某个群额外的正向提示词
[#sd negative_prompt <群号> <负向提示词>] 设置某个群的额外负向提示词`
            );
            break;
          default:
            this.api.reply(ev, `找不到名为 "${sub}" 的帮助子项`);
        }
      });

    program
      .command('tutorial')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.api.reply(ev, `页码不合法`);
          return;
        }
        if (page > this.tutorials.length) {
          this.api.reply(ev, `没有更多的页了`);
          return;
        }

        this.api.reply(
          ev,
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

    program
      .command('loras')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.api.reply(ev, `页码不合法`);
          return;
        }
        if (page > this.loraTotalPage) {
          this.api.reply(ev, `没有更多的页了`);
          return;
        }
        this.api.reply(ev, this.getLoraPage(page - 1));
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

    program
      .command('help')
      .argument('[sub]')
      .action((sub) => {
        switch (sub) {
          case undefined:
            this.api.reply(
              ev,
              `【插件帮助】
[#sd help draw] 查看绘图帮助
[#sd help lora] 查看 Lora 帮助`
            );
            break;
          case 'draw':
            this.api.reply(
              ev,
              `【绘图帮助】
建议在私聊里查看教程以避免刷屏
[#sd tutorial [页码]] 查看绘图教程的某一页
[#sd draw [...]] 绘图命令，具体使用请查看绘图教程`
            );
            break;
          case 'lora':
            this.api.reply(
              ev,
              `【Lora 帮助】
建议在私聊里查看 Lora 信息以避免刷屏
[#sd loras [页码]] 查看 Lora 列表的某一页，其中第 1 页为目录
[#sd lora <序号>] 查看某序号 Lora 的详细信息`
            );
            break;
          default:
            this.api.reply(
              ev,
              `[CQ:at,qq=${ev.user_id}] 找不到名为 "${sub}" 的帮助子项`
            );
        }
      });

    program
      .command('tutorial')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 页码不合法`);
          return;
        }
        if (page > this.tutorials.length) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 没有更多的页了`);
          return;
        }

        this.api.reply(
          ev,
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

    program
      .command('loras')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 页码不合法`);
          return;
        }
        page = this.getLoraPage(page - 1, group.nsfw);
        this.api.reply(ev, page ?? `[CQ:at,qq=${ev.user_id}] 没有更多的页了`);
      });

    program
      .command('lora')
      .argument('<ord>')
      .action((ord) => {
        ord = parseInt(ord);
        if (isNaN(ord) || !Number.isInteger(ord) || ord < 1) {
          this.api.reply(ev, `[CQ:at,qq=${ev.user_id}] 序号不合法`);
          return;
        }
        ord = this.getLoraInfo(ord - 1, group.nsfw);
        this.api.reply(ev, ord ?? `[CQ:at,qq=${ev.user_id}] 序号不合法`);
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  },
  onCall(ev) {
    switch (ev.method_name) {
      case 'generate': {
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
          ...ev.params
        };
        task.resolve = ev.resolve;
        task.reject = ev.reject;
        task.ev = ev;
        this.queue.push(task);
        break;
      }
      default:
        ev.reject(new Error(`不支持的方法: ${ev.method_name}`));
    }
  }
});
