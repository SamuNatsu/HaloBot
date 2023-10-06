/// Worker module
import url from 'url';
import { loraAnalyzeAndReplace } from './lora.js';
import moment from 'moment';

export async function worker(plugin, task) {
  // Replace prompt
  const { newPrompt, found, notFound } = loraAnalyzeAndReplace(
    plugin,
    task.prompt
  );
  const handleTime = moment().format('YYYY-MM-DD HH:mm:ss');

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
              plugin.loraMap.get(value.realName ?? value.name).lora
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

  if (task.ev.halo_event_type !== 'call') {
    plugin.api.reply(task.ev, msg);
  }

  // Create final propmt
  let finalPrompt;
  if (
    task.ev.message_type === 'private' ||
    task.ev.halo_event_type === 'call'
  ) {
    finalPrompt = [plugin.config.prepend_prompt, newPrompt]
      .map((value) => value.trim())
      .filter((value) => value.length !== 0)
      .join(',');
  } else {
    finalPrompt = [
      plugin.config.prepend_prompt,
      task.group.prepend_prompt,
      newPrompt
    ]
      .map((value) => value.trim())
      .filter((value) => value.length !== 0)
      .join(',');
  }

  // Create final negative prompt
  let finalNegativePrompt;
  if (
    task.ev.message_type === 'private' ||
    task.ev.halo_event_type === 'call'
  ) {
    finalNegativePrompt = [
      plugin.config.prepend_negative_prompt,
      task.negativePrompt
    ]
      .map((value) => value.trim())
      .filter((value) => value.length !== 0)
      .join(',');
  } else if (task.group.nsfw) {
    finalNegativePrompt = [
      plugin.config.prepend_negative_prompt,
      task.group.prepend_negative_prompt,
      task.negativePrompt
    ]
      .map((value) => value.trim())
      .filter((value) => value.length !== 0)
      .join(',');
  } else {
    finalNegativePrompt = [
      plugin.config.prepend_negative_prompt,
      task.group.prepend_negative_prompt,
      plugin.config.sfw_prepend_negative_prompt,
      task.negativePrompt
    ]
      .map((value) => value.trim())
      .filter((value) => value.length !== 0)
      .join(',');
  }

  // Calculate final width and height
  const mratio = /^([1-9]\d*):([1-9]\d*)$/.exec(task.ratio);
  const ratio = parseInt(mratio[1]) / parseInt(mratio[2]);
  const h = Math.ceil(Math.sqrt(262144 / ratio));
  const w = Math.ceil(h * ratio);

  // Create params
  const params = {
    override_settings: {
      sd_model_checkpoint: plugin.config.model_name
    },
    prompt: finalPrompt,
    negative_prompt: finalNegativePrompt,
    sampler_name: plugin.config.sampler_name,
    steps: task.iterationSteps,
    restore_faces: false,
    tiling: false,
    width: w,
    height: h,
    enable_hr: task.hires,
    hr_scale: task.scale,
    hr_checkpoint_name: plugin.config.model_name,
    hr_sampler_name: plugin.config.sampler_name,
    hr_second_pass_steps: task.iterSteps,
    hr_prompt: finalPrompt,
    hr_negative_prompt: finalNegativePrompt,
    hr_upscaler: plugin.config.upscaler_name,
    denoising_strength: task.denoising,
    seed: task.seed ?? -1
  };
  plugin.logger.trace('绘图参数', params);

  // Send request
  const res = await fetch(url.resolve(plugin.config.api, '/sdapi/v1/txt2img'), {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(params)
  });
  const json = await res.json();
  json.info = JSON.parse(json.info);

  // If is call
  if (task.ev.halo_event_type === 'call') {
    task.ev.resolve(json.images[0]);
    return;
  }

  // Save image
  await saveImage(plugin, task.ev, params, json.images[0]);

  // Send msg
  plugin.api.reply(
    task.ev,
    `${
      task.ev.message_type === 'group' ? `[CQ:at,qq=${task.ev.user_id}]\n` : ''
    }提交时间：${task.queryTime}
处理时间：${handleTime}
正向提示词：${task.prompt}
负向提示词：${task.negativePrompt}
种子：${json.info.seed}
[CQ:image,file=base64://${json.images[0]}]`
  );
}
