import { env } from "@/env";
import { runRenewalCron } from "@/lib/cron/run";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: NextRequest) {
    const secret = env.CRON_SECRET;
    if (!secret) return; // open in dev when no secret configured

    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    // Allow Vercel cron's automatic header too
    const vercelHeader = req.headers.get("x-vercel-cron");

    if (authHeader !== expected && !vercelHeader)
        throw new AppError("Invalid cron secret", "UNAUTHORIZED");
}

export async function GET(req: NextRequest) {
    try {
        authorize(req);
        const report = await runRenewalCron();
        return CResponse({ data: report });
    } catch (err) {
        return handleError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        authorize(req);
        const report = await runRenewalCron();
        return CResponse({ data: report });
    } catch (err) {
        return handleError(err);
    }
}
