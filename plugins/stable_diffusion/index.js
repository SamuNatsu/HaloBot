import { definePlugin } from '../../HaloBotPlugin.js';
import { parse } from 'shell-quote';
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import joi from 'joi';

const loraPageLine = 10;

const loraSchema = joi.object({
  category_name: joi.string().required(),
  list: joi
    .array()
    .items({
      name: joi.string().required(),
      lora: joi.string().required(),
      alias: joi.string(),
      tokens: joi.object().pattern(/^.+$/, joi.string())
    })
    .required()
});

function genRndStr(len) {
  const cset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let ret = '';
  for (let i = 0; i < len; i++) {
    const idx = Math.floor(Math.random() * cset.length);
    ret += cset[idx];
  }

  return ret;
}

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
    const loraDir = path.join(this.curdir, './loras');
    const loraCategory = {};
    const loraList = [];
    const loraNameSet = new Set();
    const loraAliasMap = new Map();

    fs.readdirSync(loraDir).forEach((value) => {
      const filePath = path.join(loraDir, value);
      try {
        const lora = this.bot.readYamlFile(filePath);
        const { error } = loraSchema.validate(lora);
        if (error !== undefined) {
          throw error;
        }

        lora.list.forEach((value) => {
          if (value.alias !== undefined && loraAliasMap.has(value.alias)) {
            throw new Error(
              `"${value.name}" 与 "${loraAliasMap.get(
                value.alias
              )}" 发生别名冲突`
            );
          }
        });

        loraCategory[lora.category_name] = [
          loraList.length,
          loraList.length + lora.list.length
        ];
        loraList.push(...lora.list);
        lora.list.forEach((value) => {
          loraNameSet.add(value.name);
          if (value.alias !== undefined) {
            loraAliasMap.set(value.alias, value.name);
          }
        });
      } catch (err) {
        this.logger.error('Lora 文件解析失败', err);
      }
    });

    this.loraCategory = loraCategory;
    this.loraList = loraList;
    this.loraNameSet = loraNameSet;
    this.loraAliasMap = loraAliasMap;
  },
  loraAnalyze(prompt) {
    const found = [];
    const notFound = [];
    [...prompt.matchAll(/<lora:([0-9a-zA-Z-_ ]+):((0|[1-9]\d*)(\.\d*[1-9])?)>/g)].forEach((value) => {
      const name = value[1];
      const weight = value[2];
    });
  },
  async isGroupEnabled(groupId) {
    const id = await this.db
      .select()
      .from('enabled_groups')
      .where('group_id', String(groupId));
    return id.length !== 0;
  },
  async getManager() {
    const manager = await this.db
      .select('value')
      .from('options')
      .where('key', 'manager');
    return manager.length === 0 ? null : BigInt(manager[0].value);
  },
  getLoraPage(page) {
    const sub = this.loras.slice(
      page * loraPageLine,
      (page + 1) * loraPageLine
    );
    let ret = `【Lora 列表 (${page + 1}/${Math.ceil(
      this.loras.length / loraPageLine
    )})】\n`;
    ret += sub
      .map(
        (value, index) => `[${page * loraPageLine + index + 1}] ${value.name}`
      )
      .join('\n');
    return ret;
  },
  getLoraInfo(idx) {
    const lora = this.loras[idx];
    let ret = `【Lora 信息】\n名字：${lora.name}\n全名：${lora.lora}`;
    if (lora.alias !== undefined) {
      ret += `\n别名：${lora.alias}`;
    }
    if (lora.tokens !== undefined) {
      ret +=
        `\n触发词列表：\n` +
        Object.entries(lora.tokens)
          .map((value) => `  "${value[0]}"：${value[1]}`)
          .join('\n');
    }
    return ret;
  },
  async onStart(bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this.curdir = bot.utils.getCurrentPluginDir(import.meta.url);
    this.db = bot.utils.openCurrentPluginDB(import.meta.url);

    await this.db.transaction(async (trx) => {
      let ret = await trx.schema.hasTable('options');
      if (!ret) {
        logger.warn('数据库中未找到 options 表，正在新建');
        await trx.schema.createTable('options', (tb) => {
          tb.string('key').primary();
          tb.text('value');
        });
        await trx
          .insert({
            key: 'id',
            value: genRndStr(16)
          })
          .into('options');
      }

      ret = await trx.schema.hasTable('enabled_groups');
      if (!ret) {
        logger.warn('数据库中未找到 enabled_groups 表，正在新建');
        await trx.schema.createTable('enabled_groups', (tb) => {
          tb.bigInteger('group_id').primary();
        });
      }
    });

    const id = await this.db.select('value').from('options').where('key', 'id');
    this.id = id[0].value;
    logger.info(`插件数据库 ID: ${this.id}`);

    this.tutorials = bot.utils.readYamlFile(
      path.join(this.curdir, './tutorials.yaml')
    );
    this.loras = bot.utils.readYamlFile(path.join(this.curdir, './loras.yaml'));
  },
  onPrivateMessage(ev) {
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
        `【StableDiffusion 插件】\nVer.${this.meta.version}\n欢迎使用 AI 绘图！\n你可以在私聊中以及管理员授权的群里使用 AI 绘图功能。\n请使用命令 [#sd help] 查看帮助。`
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
              `【插件帮助】\n[#sd help draw] 查看绘图帮助\n[#sd help lora] 查看 Lora 帮助\n[#sd help manage] 查看管理帮助`
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
            this.bot.sendPrivateMsg(
              ev.user_id,
              `【管理帮助】\n以下命令只能通过私聊触发，且只有插件管理员能得到响应。\n[#sd auth <ID>] 锁定管理员 QQ 号，ID 请查看控制台的“插件数据库 ID”\n[#sd groups] 查看所有启用插件的群号\n[#sd enable <群号>] 在某个群中启用插件\n[#sd disable <群号>] 在某个群中禁用插件`
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
      .command('loras')
      .argument('[page]', undefined, '1')
      .action((page) => {
        page = parseInt(page);
        if (isNaN(page) || !Number.isInteger(page) || page < 1) {
          this.bot.sendPrivateMsg(ev.user_id, `【Lora 列表】\n页码不合法`);
          return;
        }
        if (page > Math.ceil(this.loras.length / loraPageLine)) {
          this.bot.sendPrivateMsg(ev.user_id, `【Lora 列表】\n没有更多的页了`);
          return;
        }
        this.bot.sendPrivateMsg(ev.user_id, this.getLoraPage(page - 1));
      });

    program
      .command('lora')
      .argument('<id>')
      .action((id) => {
        id = parseInt(id);
        if (
          isNaN(id) ||
          !Number.isInteger(id) ||
          id < 1 ||
          id > this.loras.length
        ) {
          this.bot.sendPrivateMsg(ev.user_id, `【Lora 信息】\n序号不合法`);
          return;
        }
        this.bot.sendPrivateMsg(ev.user_id, this.getLoraInfo(id - 1));
      });

    program
      .command('auth')
      .argument('<id>')
      .action(async (id) => {
        const manager = await this.getManager();
        if (manager !== null) {
          return;
        }

        if (id !== this.id) {
          return;
        }

        await this.db
          .insert({
            key: 'manager',
            value: String(ev.user_id)
          })
          .into('options');
        this.bot.sendPrivateMsg(
          ev.user_id,
          '【StableDiffusion 插件】\n您已成为插件管理员'
        );
      });

    program.command('groups').action(async () => {
      const manager = await this.getManager();
      if (manager !== ev.user_id) {
        return;
      }

      const res = await this.db.select().from('enabled_groups');
      const groups = res.map((value) => BigInt(value.group_id));
      if (groups.length === 0) {
        this.bot.sendPrivateMsg(
          ev.user_id,
          '【StableDiffusion 插件】\n插件没有在任何群中生效'
        );
      } else {
        this.bot.sendPrivateMsg(
          ev.user_id,
          `【StableDiffusion 插件】\n插件在以下群中生效：\n${groups.join(',')}`
        );
      }
    });

    program
      .command('enable')
      .argument('<groupId>')
      .action(async (groupId) => {
        const manager = await this.getManager();
        if (manager !== ev.user_id) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(
            ev.user_id,
            `【StableDiffusion 插件】\n群号不合法`
          );
          return;
        }

        await this.db
          .insert({ group_id: groupId })
          .into('enabled_groups')
          .onConflict()
          .ignore();
        this.bot.sendPrivateMsg(
          ev.user_id,
          `【StableDiffusion 插件】\n插件已在群 [${groupId}] 中启用`
        );
      });

    program
      .command('disable')
      .argument('<groupId>')
      .action(async (groupId) => {
        const manager = await this.getManager();
        if (manager !== ev.user_id) {
          return;
        }

        if (!/^[1-9]\d*$/.test(groupId)) {
          this.bot.sendPrivateMsg(
            ev.user_id,
            `【StableDiffusion 插件】\n群号不合法`
          );
          return;
        }

        await this.db
          .delete()
          .from('enabled_groups')
          .where('group_id', groupId);
        this.bot.sendPrivateMsg(
          ev.user_id,
          `【StableDiffusion 插件】\n插件已在群 [${groupId}] 中禁用`
        );
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  },
  async onGroupMessage(ev) {
    if (!ev.raw_message.startsWith('#sd')) {
      return;
    }

    if (!(await this.isGroupEnabled(ev.group_id))) {
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
      this.bot.sendGroupMsg(
        ev.group_id,
        `【StableDiffusion 插件】\nVer.${this.meta.version}\n欢迎使用 AI 绘图！\n你可以在私聊中以及管理员授权的群里使用 AI 绘图功能。\n请使用命令 [#sd help] 查看帮助。`
      );
    });

    program
      .command('help')
      .argument('[sub]')
      .action((sub) => {
        switch (sub) {
          case undefined:
            this.bot.sendGroupMsg(
              ev.group_id,
              `【插件帮助】\n[#sd help draw] 查看绘图帮助\n[#sd help lora] 查看 Lora 帮助\n[#sd help manage] 查看管理帮助`
            );
            break;
          case 'draw':
            this.bot.sendGroupMsg(
              ev.group_id,
              `【绘图帮助】\n建议在私聊里查看教程以避免刷屏\n[#sd tutorial [页码]] 查看绘图教程的某一页\n[#sd draw [...]] 绘图命令，具体使用请查看绘图教程`
            );
            break;
          case 'lora':
            this.bot.sendGroupMsg(
              ev.group_id,
              `【Lora 帮助】\n建议在私聊里查看 Lora 信息以避免刷屏\n[#sd loras [页码]] 查看 Lora 列表的某一页\n[#sd lora <序号>] 查看某序号 Lora 的详细信息`
            );
            break;
          case 'manage':
            this.bot.sendGroupMsg(
              ev.group_id,
              `【管理帮助】\n以下命令只能通过私聊触发，且只有插件管理员能得到响应。\n[#sd auth <ID>] 锁定管理员 QQ 号，ID 请查看控制台的“插件数据库 ID”\n[#sd groups] 查看所有启用插件的群号\n[#sd enable <群号>] 在某个群中启用插件\n[#sd disable <群号>] 在某个群中禁用插件`
            );
            break;
          default:
            this.bot.sendGroupMsg(
              ev.group_id,
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
          this.bot.sendGroupMsg(ev.group_id, `【绘图教程】\n页码不合法`);
          return;
        }
        if (page > this.tutorials.length) {
          this.bot.sendGroupMsg(ev.group_id, `【绘图教程】\n没有更多的页了`);
          return;
        }

        this.bot.sendGroupMsg(
          ev.group_id,
          `【绘图教程 (${page}/${this.tutorials.length})】\n${this.tutorials[
            page - 1
          ].trim()}`
        );
      });

    try {
      program.parse(argv, { from: 'user' });
    } catch (err) {
      this.logger.error('命令解析错误', err);
    }
  }
});
