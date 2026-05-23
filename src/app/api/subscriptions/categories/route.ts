import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import {
    createSubscriptionCategorySchema,
    deleteDataSchema,
    paginationQuerySchema,
} from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { searchParams } = new URL(req.url);
        const { page, limit, search, isPaginated, ids } =
            paginationQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        if (!isPaginated) {
            const data = await queries.subscriptionCategory.scan({
                userId: isAuth.user.id,
                ids,
                search,
            });
            return CResponse({ data });
        }

        const data = await queries.subscriptionCategory.paginate({
            userId: isAuth.user.id,
            limit,
            page,
            search,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const body = await req.json();
        const parsed = createSubscriptionCategorySchema.array().parse(body);

        const data = await queries.subscriptionCategory.create({
            userId: isAuth.user.id,
            values: parsed,
        });
        return CResponse({ message: "CREATED", data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { searchParams } = new URL(req.url);
        const { ids } = deleteDataSchema.parse(
            Object.fromEntries(searchParams.entries())
        );

        await queries.subscriptionCategory.delete({
            userId: isAuth.user.id,
            ids,
        });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
