import { MESSAGES, RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updateSubscriptionCategorySchema } from "@/lib/validations";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { id } = await params;
        const data = await queries.subscriptionCategory.get({
            userId: userId!,
            id,
        });
        if (!data)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function PATCH(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const { id } = await params;
        const body = await req.json();
        const values = updateSubscriptionCategorySchema.parse(body);

        const existing = await queries.subscriptionCategory.get({
            userId: userId!,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscriptionCategory.update({
            userId: userId!,
            id,
            values,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const { id } = await params;
        await queries.subscriptionCategory.delete({
            userId: userId!,
            ids: [id],
        });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
