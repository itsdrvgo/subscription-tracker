import { env } from "@/env";
import { apiGuard, RATE_LIMITS } from "@/lib/api/security";
import { runRenewalCron } from "@/lib/cron/run";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

function authorize(req: NextRequest) {
    const secret = env.CRON_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production")
            throw new AppError(
                "Cron secret not configured",
                "INTERNAL_SERVER_ERROR"
            );
        return;
    }

    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;

    if (!timingSafeEqual(authHeader, expected))
        throw new AppError("Invalid cron secret", "UNAUTHORIZED");
}

export async function GET(req: NextRequest) {
    try {
        await apiGuard(req, {
            requireAuth: false,
            rateLimit: RATE_LIMITS.CRON,
        });
        authorize(req);
        const report = await runRenewalCron();
        return CResponse({ data: report });
    } catch (err) {
        return handleError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await apiGuard(req, {
            requireAuth: false,
            rateLimit: RATE_LIMITS.CRON,
        });
        authorize(req);
        const report = await runRenewalCron();
        return CResponse({ data: report });
    } catch (err) {
        return handleError(err);
    }
}
