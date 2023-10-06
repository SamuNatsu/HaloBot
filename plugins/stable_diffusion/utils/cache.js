/// Cache module

const cache = new Map();

export async function getCache(key, timeout, fallback) {
  // Check cache
  const value = cache.get(key);
  if (value !== undefined) {
    // Refresh timeout
    clearTimeout(value.handle);
    value.handle = setTimeout(() => {
      cache.delete(key);
    }, timeout);

    return value.data;
  }

  // Create new cache
  const data = await fallback();
  cache.set(key, {
    handle: setTimeout(() => {
      cache.delete(key);
    }, timeout),
    data
  });

  return data;
}
