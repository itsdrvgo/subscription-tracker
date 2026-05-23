import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updateSubscriptionCategorySchema } from "@/lib/validations";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: Context) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        const data = await queries.subscriptionCategory.get({
            userId: isAuth.user.id,
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
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        const body = await req.json();
        const values = updateSubscriptionCategorySchema.parse(body);

        const existing = await queries.subscriptionCategory.get({
            userId: isAuth.user.id,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscriptionCategory.update({
            userId: isAuth.user.id,
            id,
            values,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(_: NextRequest, { params }: Context) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        await queries.subscriptionCategory.delete({
            userId: isAuth.user.id,
            ids: [id],
        });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
