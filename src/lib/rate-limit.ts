import "server-only";

/**
 * Minimal fixed-window, in-memory rate limiter.
 *
 * NOTE: state lives in a single server process. On serverless or multi-instance
 * deployments each instance counts separately — swap this for a shared store
 * (e.g. Upstash Redis) before relying on it for strict limits. See SECURITY.md.
 */
interface Entry {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as unknown as { __ingonRateLimit?: Map<string, Entry> };
const store = (globalStore.__ingonRateLimit ??= new Map<string, Entry>());

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }

  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;
  return {
    ok: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
