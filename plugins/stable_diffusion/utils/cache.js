/// Cache module

const cacheMap = new Map();

/* Get/Set cache */
export async function getCache(plugin, key, timeout, callback) {
  // Get cache
  const value = cacheMap.get(key);
  if (value !== undefined) {
    clearTimeout(value.handle);
    value.handle = setTimeout(() => {
      plugin.logger.warn(`缓存已过期: ${key}`);
      cacheMap.delete(key);
    }, timeout);
    return value.data;
  }

  // Set cache
  const data = await callback();
  plugin.logger.info(`正在生成新的缓存: ${key}`);
  cacheMap.set(key, {
    data,
    handle: setTimeout(() => {
      plugin.logger.warn(`缓存已过期: ${key}`);
      cacheMap.delete(key);
    }, timeout)
  });
  return data;
}
