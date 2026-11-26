export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

export function getMemoryRateLimitStore(): Map<string, RateLimitEntry> {
  return memoryStore;
}

export function consumeRateLimit(params: {
  store?: Map<string, RateLimitEntry>;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const store = params.store ?? memoryStore;
  const now = params.now ?? Date.now();

  if (store.size > 500) {
    for (const [k, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  const current = store.get(params.key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + params.windowMs;
    store.set(params.key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, params.limit - 1), resetAt };
  }

  if (current.count >= params.limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, params.limit - current.count),
    resetAt: current.resetAt,
  };
}
