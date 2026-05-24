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

// In-memory fixed-window limiter. Per-process state — accept that trade-off
// for a Redis-free setup; consequence is each serverless instance gets its
// own bucket, so the global cap is `limit * instances`.
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
