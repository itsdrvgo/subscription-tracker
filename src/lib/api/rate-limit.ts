interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let lastSweepAt = 0;

function sweep(now: number) {
    if (now - lastSweepAt < 30_000 && buckets.size <= MAX_BUCKETS) return;
    lastSweepAt = now;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
    if (buckets.size > MAX_BUCKETS) {
        const sorted = [...buckets.entries()].sort(
            (a, b) => a[1].resetAt - b[1].resetAt
        );
        for (let i = 0; i < sorted.length - MAX_BUCKETS; i++) {
            buckets.delete(sorted[i][0]);
        }
    }
}

export type RateLimitResult =
    | { ok: true; remaining: number; resetAt: number }
    | { ok: false; remaining: 0; resetAt: number; retryAfterMs: number };

/**
 * Fixed-window in-memory rate limiter. Per process, not shared across
 * serverless instances — accept that trade-off for a Redis-free setup.
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + windowMs;
        buckets.set(key, { count: 1, resetAt });
        return { ok: true, remaining: limit - 1, resetAt };
    }
    if (bucket.count >= limit) {
        return {
            ok: false,
            remaining: 0,
            resetAt: bucket.resetAt,
            retryAfterMs: bucket.resetAt - now,
        };
    }
    bucket.count++;
    return {
        ok: true,
        remaining: limit - bucket.count,
        resetAt: bucket.resetAt,
    };
}

export const RATE_LIMITS = {
    AUTH_STRICT: { limit: 5, windowMs: 60_000 },
    AUTH_GENERAL: { limit: 30, windowMs: 60_000 },
    READ: { limit: 120, windowMs: 60_000 },
    WRITE: { limit: 30, windowMs: 60_000 },
    MUTATING_BULK: { limit: 10, windowMs: 60_000 },
    CRON: { limit: 12, windowMs: 60_000 },
    EDGE_GLOBAL: { limit: 300, windowMs: 60_000 },
} as const;

export type RateLimitPreset = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];
