import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { ACTIVITY_ACTIONS } from "@/lib/db/schemas";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
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
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { searchParams } = new URL(req.url);
        const { page, limit, subscriptionId, action } =
            activityQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        const data = await queries.activityLog.paginate({
            userId: isAuth.user.id,
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
