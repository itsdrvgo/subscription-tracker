import { MESSAGES, RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const { id } = await params;
        const existing = await queries.subscription.get({
            userId: userId!,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscription.update({
            userId: userId!,
            id,
            values: { status: "active", cancelledAt: null },
        });

        if (data) {
            await queries.activityLog.add({
                userId: userId!,
                subscriptionId: id,
                subscriptionName: data.name,
                action: "resumed",
                metadata: { previousStatus: existing.status },
            });
        }

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
