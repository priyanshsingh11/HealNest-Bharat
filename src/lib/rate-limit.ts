// Simple fixed-window, in-memory rate limiter for API routes.
// Per-process only: swap for a shared store (e.g. Redis / Upstash) when running multiple instances.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) pruneExpired(now);
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
