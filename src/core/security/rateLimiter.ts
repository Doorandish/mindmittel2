export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface FixedWindowRateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
  /** Upper bound on tracked keys to keep memory bounded on a 512 MB dyno. */
  maxKeys?: number;
}

/**
 * In-memory fixed-window rate limiter. Sufficient for a single-dyno deployment;
 * move to a shared store (e.g. Redis) when scaling horizontally.
 */
export function createFixedWindowRateLimiter(options: FixedWindowRateLimiterOptions) {
  const now = options.now ?? (() => Date.now());
  const maxKeys = options.maxKeys ?? 10_000;
  const windows = new Map<string, { start: number; count: number }>();

  function hit(key: string): RateLimitResult {
    const t = now();
    let entry = windows.get(key);
    if (!entry || t - entry.start >= options.windowMs) {
      if (!entry && windows.size >= maxKeys) {
        const oldest = windows.keys().next().value;
        if (oldest !== undefined) windows.delete(oldest);
      }
      entry = { start: t, count: 0 };
      windows.set(key, entry);
    }
    entry.count += 1;
    const allowed = entry.count <= options.limit;
    return {
      allowed,
      remaining: Math.max(0, options.limit - entry.count),
      retryAfterMs: allowed ? 0 : options.windowMs - (t - entry.start),
    };
  }

  return {
    hit,
    reset: (key: string) => {
      windows.delete(key);
    },
  };
}
