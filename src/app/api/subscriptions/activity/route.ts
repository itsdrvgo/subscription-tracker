import { ACTIVITY_ACTIONS, RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { CResponse, handleError } from "@/lib/utils";
import { paginationQuerySchema } from "@/lib/validations";
import { NextRequest } from "next/server";
import z from "zod";

const activityQuerySchema = paginationQuerySchema.extend({
    subscriptionId: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.string().optional()
        )
        .optional(),
    action: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.enum(ACTIVITY_ACTIONS).optional()
        )
        .optional(),
});

export async function GET(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { searchParams } = new URL(req.url);
        const { page, limit, subscriptionId, action } =
            activityQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        const data = await queries.activityLog.paginate({
            userId: userId!,
            page,
            limit,
            subscriptionId,
            action,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
