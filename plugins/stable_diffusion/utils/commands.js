/// Command module
import { Command } from 'commander';
import moment from 'moment';
import { renderGroups, renderLoraInfo } from './render.js';

export function newDefaultCmd(plugin, ev) {
  return new Command().action(() => {
    plugin.api.reply(
      ev,
      `【StableDiffusion 插件】
Ver ${plugin.meta.version}
欢迎使用 AI 绘图！
你可以在私聊中以及授权的群里使用 AI 绘图功能。
请使用命令 [#sd help] 查看帮助。`
    );
  });
}

export function newHelpCmd(plugin, ev) {
  return new Command('help').action(() => {
    // Check manager message
    if (
      ev.message_type === 'private' &&
      plugin.config.manager === String(ev.user_id)
    ) {
      plugin.api.reply(
        ev,
        `[CQ:image,file=base64://${plugin.helpManagerImage}]`
      );
      return;
    }

    plugin.api.reply(ev, `[CQ:image,file=base64://${plugin.helpImage}]`);
  });
}

export function newLoraListCmd(plugin, ev, nsfw) {
  return new Command('lora-list').action(() => {
    const listImage = nsfw ? plugin.loraNSFWListImage : plugin.loraSFWListImage;
    plugin.api.reply(ev, `[CQ:image,file=base64://${listImage}]`);
  });
}

export function newLoraInfoCmd(plugin, ev, nsfw) {
  return new Command('lora').argument('<order>').action(async (order) => {
    const prefix =
      ev.message_type === 'group' ? `[CQ:at,qq=${ev.user_id}] ` : '';
    const loraList = nsfw ? plugin.loraNSFWFlatList : plugin.loraSFWFlatList;

    // Check lora order
    if (!/^[1-9]\d*$/.test(order)) {
      plugin.api.reply(ev, `${prefix}序号不合法`);
      return;
    }
    order = parseInt(order);
    if (order > loraList.length) {
      plugin.api.reply(ev, `${prefix}序号超出范围`);
      return;
    }

    // Render image
    const b64 = await renderLoraInfo(plugin, loraList[order - 1]);

    // Send
    plugin.api.reply(ev, `[CQ:image,file=base64://${b64}]`);
  });
}

export function newInfoCmd(plugin, ev, group) {
  /** TODO */
  return new Command('info');
}

export function newDrawCmd(plugin, ev, group) {
  return new Command('draw')
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
      const prefix =
        ev.message_type === 'group' ? `[CQ:at,qq=${ev.user_id}] ` : '';

      // Check queue
      if (plugin.queue.length() >= plugin.config.queue_size) {
        plugin.api.reply(
          ev,
          `${prefix}等待队列已满，你的请求提交失败
队列还有 ${plugin.config.queue_size} 个正在等待`
        );
        return;
      }

      // Validate
      if (!/^(2[0-9]|3[0-9]|40)$/.test(opt.iterationSteps)) {
        plugin.api.reply(ev, `${prefix}迭代步数 (-i) 参数不合法`);
        return;
      }
      opt.iterationSteps = parseInt(opt.iterationSteps);

      if (opt.seed !== undefined) {
        if (!/^(0|[1-9]\d*)$/.test(opt.seed)) {
          plugin.api.reply(ev, `${prefix}种子 (-s) 参数不合法`);
          return;
        }
        opt.seed = parseInt(opt.seed);
      }

      if (!/^[1-9]\d*:[1-9]\d*$/.test(opt.ratio)) {
        plugin.api.reply(ev, `${prefix}宽高比 (-r) 参数不合法`);
        return;
      }

      if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.scale)) {
        plugin.api.reply(ev, `${prefix}放大倍数 (-S) 参数不合法`);
        return;
      }
      opt.scale = parseFloat(opt.scale);
      if (opt.scale < 1 || opt.scale > 3) {
        plugin.api.reply(ev, `${prefix}放大倍数 (-S) 参数不合法`);
        return;
      }

      if (!/^(0|1?\d|20)$/.test(opt.iterSteps)) {
        plugin.api.reply(ev, `${prefix}迭代步数 (-I) 参数不合法`);
        return;
      }
      opt.iterSteps = parseInt(opt.iterSteps);

      if (!/^(0|[1-9]\d*)(\.\d*[1-9])?$/.test(opt.denoising)) {
        plugin.api.reply(ev, `${prefix}重绘幅度 (-d) 参数不合法`);
        return;
      }
      opt.denoising = parseFloat(opt.denoising);
      if (opt.denoising > 1) {
        plugin.api.reply(ev, `${prefix}重绘幅度 (-d) 参数不合法`);
        return;
      }

      // Push task
      opt.queryTime = moment().format('YYYY-MM-DD HH:mm:ss');
      opt.ev = ev;
      opt.group = group;

      await plugin.api.reply(
        ev,
        `${prefix}生成请求已提交
你是等待队列的第 ${plugin.queue.length() + 1} 个`
      );
      plugin.queue.push(opt);
    });
}

export function newGroupsCmd(plugin, ev) {
  return new Command('groups').action(async () => {
    // Check manager
    if (plugin.config.manager !== String(ev.user_id)) {
      return;
    }

    // Fetch database
    const groups = await plugin.db('enabled_groups').select();

    // Render image
    const b64 = await renderGroups(plugin, groups);

    // Send
    plugin.api.reply(ev, `[CQ:image,file=base64://${b64}]`);
  });
}

export function newEnableCmd(plugin, ev) {
  return new Command('enable').argument('<groupId>').action(async (groupId) => {
    // Check manager
    if (plugin.config.manager !== String(ev.user_id)) {
      return;
    }

    // Check group ID
    if (!/^[1-9]\d*$/.test(groupId)) {
      plugin.api.reply(ev, `群号不合法`);
      return;
    }

    // Update database
    await plugin
      .db('enabled_groups')
      .insert({
        group_id: groupId,
        nsfw: false,
        prepend_prompt: '',
        prepend_negative_prompt: ''
      })
      .onConflict()
      .ignore();

    plugin.api.reply(ev, `插件已在群 [${groupId}] 中启用`);
  });
}

export function newDisableCmd(plugin, ev) {
  return new Command('disable')
    .argument('<groupId>')
    .action(async (groupId) => {
      // Check manager
      if (plugin.config.manager !== String(ev.user_id)) {
        return;
      }

      // Check group ID
      if (!/^[1-9]\d*$/.test(groupId)) {
        plugin.api.reply(ev, `群号不合法`);
        return;
      }

      // Update database
      await plugin.db('enabled_groups').delete().where('group_id', groupId);

      plugin.api.reply(ev, `插件已在群 [${groupId}] 中禁用`);
    });
}

export function newNSFWCmd(plugin, ev) {
  return new Command('nsfw').argument('<groupId>').action(async (groupId) => {
    // Check manager
    if (plugin.config.manager !== String(ev.user_id)) {
      return;
    }

    // Check group ID
    if (!/^[1-9]\d*$/.test(groupId)) {
      plugin.api.reply(ev, `群号不合法`);
      return;
    }

    // Update database
    await plugin
      .db('enabled_groups')
      .update({ nsfw: true })
      .where('group_id', groupId);

    plugin.api.reply(ev, `群 [${groupId}] 已开启 NSFW 模式`);
  });
}

export function newSFWCmd(plugin, ev) {
  return new Command('sfw').argument('<groupId>').action(async (groupId) => {
    // Check manager
    if (plugin.config.manager !== String(ev.user_id)) {
      return;
    }

    // Check group ID
    if (!/^[1-9]\d*$/.test(groupId)) {
      plugin.api.reply(ev, `群号不合法`);
      return;
    }

    // Update database
    await plugin
      .db('enabled_groups')
      .update({ nsfw: false })
      .where('group_id', groupId);

    plugin.api.reply(ev, `群 [${groupId}] 已开启 SFW 模式`);
  });
}

export function newPromptCmd(plugin, ev) {
  return new Command('prompt')
    .argument('<groupId>')
    .argument('<prompt>')
    .action(async (groupId, prompt) => {
      // Check manager
      if (plugin.config.manager !== String(ev.user_id)) {
        return;
      }

      // Check group ID
      if (!/^[1-9]\d*$/.test(groupId)) {
        plugin.api.reply(ev, `群号不合法`);
        return;
      }

      // Update database
      await plugin
        .db('enabled_groups')
        .update({ prepend_prompt: prompt })
        .where('group_id', groupId);

      plugin.api.reply(ev, `群 [${groupId}] 的附加正向提示词已更新`);
    });
}

export function newNegativePromptCmd(plugin, ev) {
  return new Command('negative-prompt')
    .argument('<groupId>')
    .argument('<prompt>')
    .action(async (groupId, prompt) => {
      // Check manager
      if (plugin.config.manager !== String(ev.user_id)) {
        return;
      }

      // Check group ID
      if (!/^[1-9]\d*$/.test(groupId)) {
        plugin.api.reply(ev, `群号不合法`);
        return;
      }

      // Update database
      await plugin
        .db('enabled_groups')
        .update({ prepend_negative_prompt: prompt })
        .where('group_id', groupId);

      plugin.api.reply(ev, `群 [${groupId}] 的附加负向提示词已更新`);
    });
}
