/**
 * Shared in-memory cache for bot configuration.
 * Used by /api/bots/config to cache bot lookups,
 * and can be invalidated from /api/bots when bots are updated/deleted.
 */

const configCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function getCached(embedCode: string): Record<string, unknown> | null {
  const entry = configCache.get(embedCode);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    configCache.delete(embedCode);
    return null;
  }
  return entry.data;
}

export function setConfigCache(embedCode: string, data: Record<string, unknown>) {
  configCache.set(embedCode, { data, timestamp: Date.now() });
}

/**
 * Invalidate the config cache for a specific embedCode.
 * Pass no argument to clear all cache.
 */
export function invalidateConfigCache(embedCode?: string) {
  if (embedCode) {
    configCache.delete(embedCode);
  } else {
    configCache.clear();
  }
}
