import { definePlugin } from '../../HaloBotPlugin.js';
import { parse } from 'shell-quote';
import path from 'path';
import fs from 'fs';
import joi from 'joi';
import async from 'async';
import moment from 'moment';
import { readLoraList } from './utils/lora.js';
import {
  newDisableCmd,
  newDrawCmd,
  newEnableCmd,
  newGroupsCmd,
  newHelpCmd,
  newInfoCmd,
  newLoraInfoCmd,
  newLoraListCmd,
  newNSFWCmd,
  newNegativePromptCmd,
  newPromptCmd,
  newSFWCmd
} from './utils/commands.js';
import { renderHelp, renderLoraList } from './utils/render.js';
import { worker } from './utils/worker.js';

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
  /* Meta info */
  meta: {
    namespace: 'rainiar.stable_diffusion',
    name: 'StableDiffusion',
    author: 'SNRainiar',
    description: '用于 HaloBot 的 StableDiffusion 插件',
    priority: 50,
    version: '2.1.0',
    botVersion: '1.0.0'
  },

  /* Get group database row */
  async getGroupRow(groupId) {
    const row = await this.db('enabled_groups')
      .select()
      .where('group_id', groupId);
    return row.length === 0 ? null : row[0];
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

    // Render help
    this.helpImage = await renderHelp(this, false);
    this.helpManagerImage = await renderHelp(this, true);

    // Initialize lora list
    const loraData = readLoraList(this);
    this.loraNSFWListImage = await renderLoraList(
      this,
      loraData.loraNSFWList,
      true
    );
    this.loraSFWListImage = await renderLoraList(
      this,
      loraData.loraSFWList,
      false
    );
    this.loraNameSet = loraData.loraNameSet;
    this.loraMap = loraData.loraMap;
    this.loraAliasMap = loraData.loraAliasMap;
    this.loraNSFWFlatList = loraData.loraNSFWList.flatMap(
      (value) => value.list
    );
    this.loraSFWFlatList = this.loraNSFWFlatList.filter((value) => !value.nsfw);

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
    this.queue = async.queue(worker.bind(null, this), 1);
    this.queue.error((err, task) => {
      this.logger.error('生成出错', err, task);

      // If is call task
      if (task.ev.halo_event_type === 'call') {
        task.ev.reject(err);
        return;
      }

      // If is message task
      const prefix =
        task.ev.message_type === 'private'
          ? ''
          : `[CQ:at,qq=${task.ev.user_id}] `;
      this.api.reply(
        task.ev,
        `${prefix}生成失败
请联系管理员检查错误`
      );
    });
  },

  /* Private message listener */
  onPrivateMessage(ev) {
    // Check command
    if (!ev.raw_message.startsWith('#sd')) {
      return;
    }

    // Setup command parser
    const cmd = ev.raw_message.slice(3);
    const argv = parse(cmd);
    const program = this.api.createCommandProgram();

    // Setup commands
    program
      .addCommand(newHelpCmd(this, ev))
      .addCommand(newLoraListCmd(this, ev, true))
      .addCommand(newLoraInfoCmd(this, ev, true))
      .addCommand(newDrawCmd(this, ev))
      .addCommand(newGroupsCmd(this, ev))
      .addCommand(newEnableCmd(this, ev))
      .addCommand(newDisableCmd(this, ev))
      .addCommand(newNSFWCmd(this, ev))
      .addCommand(newSFWCmd(this, ev))
      .addCommand(newPromptCmd(this, ev))
      .addCommand(newNegativePromptCmd(this, ev));

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  },

  /* Group message listener */
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

    // Setup commands
    program
      .addCommand(newHelpCmd(this, ev))
      .addCommand(newLoraListCmd(this, ev, group.nsfw))
      .addCommand(newLoraInfoCmd(this, ev, group.nsfw))
      .addCommand(newInfoCmd(this, ev, group))
      .addCommand(newDrawCmd(this, ev, group));

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
          queryTime: moment().format('YYYY-MM-DD HH:mm:ss'),
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
