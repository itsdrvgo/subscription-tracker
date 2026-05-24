import { MESSAGES } from "@/config/const";
import { auth } from "@/lib/jwt";
import { AppError, getClientIp } from "@/lib/utils";
import {
    checkRateLimit,
    RateLimitPreset,
    RATE_LIMITS,
} from "./rate-limit";

export { checkRateLimit, RATE_LIMITS };
export type { RateLimitPreset, RateLimitResult } from "./rate-limit";

interface GuardOptions {
    requireAuth?: boolean;
    rateLimit?: RateLimitPreset & { key?: string };
    enforceOrigin?: boolean;
}

interface GuardResult {
    userId: string | null;
}

/**
 * Verifies same-origin requests by comparing the Origin header to the
 * request Host. Browsers always set Origin for fetch/XHR; missing Origin
 * (e.g. same-origin GETs, server-to-server calls) is treated as allowed.
 */
function assertSameOrigin(req: Request) {
    const origin = req.headers.get("origin");
    if (!origin) return;
    const host = req.headers.get("host");
    if (!host) throw new AppError("Missing host header", "FORBIDDEN");
    let parsed: URL;
    try {
        parsed = new URL(origin);
    } catch {
        throw new AppError("Invalid Origin header", "FORBIDDEN");
    }
    if (parsed.host !== host)
        throw new AppError("Origin mismatch", "FORBIDDEN");
}

/**
 * Single entry point for route-level security: auth check, rate limit,
 * and optional CSRF (Origin) check. Throws AppError on failure so callers
 * can rely on the existing handleError() pipeline.
 */
export async function apiGuard(
    req: Request,
    opts: GuardOptions = {}
): Promise<GuardResult> {
    const { requireAuth = true, rateLimit, enforceOrigin = false } = opts;

    if (enforceOrigin && req.method !== "GET" && req.method !== "HEAD") {
        assertSameOrigin(req);
    }

    if (rateLimit) {
        const ip = getClientIp(req);
        const path = new URL(req.url).pathname;
        const key = rateLimit.key ?? `route:${path}:${ip}`;
        const result = checkRateLimit(
            key,
            rateLimit.limit,
            rateLimit.windowMs
        );
        if (!result.ok) {
            throw new AppError(
                `Too many requests. Try again in ${Math.ceil(result.retryAfterMs / 1000)}s`,
                "TOO_MANY_REQUESTS"
            );
        }
    }

    if (!requireAuth) return { userId: null };

    const session = await auth();
    if (!session?.user?.id)
        throw new AppError(MESSAGES.ERRORS.GENERAL.UNAUTHORIZED, "UNAUTHORIZED");

    return { userId: session.user.id };
}
