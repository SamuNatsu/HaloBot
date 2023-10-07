/// Image module
import fs from 'fs';
import moment from 'moment';
import path from 'path';

export async function saveImage(plugin, ev, params, b64) {
  // Check enabled save images
  if (plugin.config.history_count === 0) {
    return;
  }

  // Save file
  const name = moment().format('YYYYMMDD_HHmmss.png');
  const filePath = path.join(plugin.currentPluginDir, './images', name);
  plugin.logger.info(`正在保存图片: ${filePath}`);
  fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

  // Write database
  await plugin.db.transaction(async (trx) => {
    // Insert row
    await trx('saved_images').insert({
      file_name: name,
      params: JSON.stringify(params),
      user_id: ev.user_id,
      group_id: ev.group_id
    });

    // Check infinite
    if (plugin.config.history_count < 0) {
      return;
    }

    // Get count
    const rows = await trx('saved_images').count('* as count');
    if (rows[0].count <= plugin.config.history_count) {
      return;
    }

    // Delete old image
    const img = await trx('saved_images').limit(1).orderBy('file_name');
    plugin.logger.warn(`正在删除旧图片: ${img[0].file_name}`);
    fs.rmSync(path.join(plugin.currentPluginDir, './images', img[0].file_name));
    await trx('saved_images').delete().where({ file_name: img[0].file_name });
  });
}
