import { definePlugin } from '../../HaloBotPlugin.js';
import { renderAIRadarChart } from './utils/renderSvg.js';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import { uniqueNamesGenerator, names } from 'unique-names-generator';

export default definePlugin({
  meta: {
    namespace: 'rainiar.cosmic_odyssey',
    name: '宇宙奥德赛',
    author: 'SNRainiar',
    description: '一款宇宙游戏',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  async renderTemplate(templatePath, outputName, data, noPic = true) {
    const outputDir = path.dirname(templatePath);
    const htmlPath = path.join(outputDir, outputName + '.html');
    const imagePath = path.join(outputDir, outputName + '.png');
    const outputHTML = await ejs.renderFile(templatePath, data);

    fs.writeFileSync(htmlPath, outputHTML);
    const b64 = await this.api.callPluginMethod(
      'rainiar.html_renderer',
      'render',
      {
        type: 'file',
        viewport: { width: 842, height: 595 },
        target: 'file://' + htmlPath,
        path: noPic ? undefined : imagePath
      }
    );
    fs.rmSync(htmlPath);

    return b64;
  },
  async onCall(ev) {
    switch (ev.method_name) {
      case 'render': {
        const pth = path.join(this.currentPluginDir, './templates/ai_info.ejs');

        const tier = Math.floor(Math.random() * 10);
        const data = [];
        for (let i = 0; i < 6; ++i) {
          data.push(Math.floor(Math.random() * 1000));
        }
        const level = Math.floor(Math.random() * 100);

        let prompt = '';
        const base =
          '(masterpiece,best,quality,extreme detailed,ultra-high details,4k),simple background,1girl,solo,look straight ahead';
        const hair = [
          'straight hair',
          'curly hair',
          'wavy hair',
          'short hair',
          'long hair',
          'shoulder-length hair',
          'center parting hairstyle',
          'side parting hairstyle',
          'lace front hairstyle',
          'straight bangs',
          'side-swept bangs',
          'short hair with bangs',
          'high ponytail',
          'low ponytail',
          'bun',
          'braid',
          'voluminous hairstyle',
          'hair dyeing',
          'hair perm',
          'half-up hairstyle'
        ];
        const face = [
          'smile',
          'cry',
          'angry',
          'surprised',
          'shy',
          'tired',
          'anxious',
          'mad',
          'happy',
          'sad',
          'wide-eyed',
          'terrified',
          'relieved',
          'confused',
          'indifferent',
          'mischievous',
          'satisfied',
          'amazed',
          'serious',
          'nervous'
        ];
        const color = [
          'black hair',
          'red hair',
          'orange hair',
          'golden hair',
          'green hair',
          'blue hair',
          'purple hair',
          'pink hair',
          'brown hair',
          'sliver hair'
        ];
        const eye = [
          'black eyes',
          'red eyes',
          'orange eyes',
          'golden eyes',
          'green eyes',
          'blue eyes',
          'purple eyes',
          'pink eyes',
          'brown eyes',
          'gray eyes'
        ];
        const ear = [
          'cat ears',
          'fox ears',
          'dog ears',
          'rabbit ears',
          'elf ears'
        ];
        const decro = [
          'hair clip',
          'headband',
          'hairband',
          'hair tie',
          'hairpin',
          'hair accessory',
          'bobby pin',
          'high bun maker',
          'hair elastic',
          'wire headband',
          'flower crown',
          'barrette',
          'necklace',
          'pendant necklace',
          'choker',
          'earrings',
          'stud earrings',
          'dangle earrings',
          'clip-on earrings',
          'face mask',
          'sunglasses',
          'blush',
          'bowtie',
          'scarf'
        ];

        prompt += base;
        prompt += ',' + hair[Math.floor(Math.random() * hair.length)];
        prompt += ',' + color[Math.floor(Math.random() * color.length)];
        prompt += ',' + face[Math.floor(Math.random() * face.length)];
        prompt += ',' + eye[Math.floor(Math.random() * eye.length)];
        if (Math.random() < 0.5) {
          prompt += ',' + ear[Math.floor(Math.random() * ear.length)];
        }
        if (Math.random() < 0.5) {
          prompt += ',' + decro[Math.floor(Math.random() * decro.length)];
        }
        prompt += ',<lora:add_detail:0.6>';

        const b64png = await this.api.callPluginMethod(
          'rainiar.stable_diffusion',
          'generate',
          { prompt }
        );

        const b64 = await this.renderTemplate(pth, 'test', {
          name: uniqueNamesGenerator({ dictionaries: [names] }),
          avatar: 'data:image/png;base64,' + b64png,
          tier,
          level,
          curExp: Math.floor(Math.log(level + 1) * 1000 * Math.random()),
          health: Math.random(),
          training: Math.random(),
          stability: Math.random(),
          properties: data,
          radarChart: renderAIRadarChart(
            data.map((value) => value / 1000),
            ['计算', '成长', '控制', '导航', '搜索', '战斗']
          )
        });

        ev.resolve(b64);
        break;
      }
      default:
        ev.reject(new Error(`不支持的调用: ${ev.method_name}`));
    }
  }
});
