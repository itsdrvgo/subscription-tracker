import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { PAYMENT_SOURCE_TYPES } from "@/lib/db/schemas";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import {
    createPaymentSourceSchema,
    deleteDataSchema,
    paginationQuerySchema,
} from "@/lib/validations";
import { NextRequest } from "next/server";
import z from "zod";

const paymentSourceQuerySchema = paginationQuerySchema.extend({
    isActive: z.preprocess((v) => {
        if (v === undefined || v === null || v === "") return undefined;
        return v === "true";
    }, z.boolean().optional()),
    type: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.enum(PAYMENT_SOURCE_TYPES).optional()
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
        const { page, limit, search, isPaginated, ids, isActive, type } =
            paymentSourceQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        if (!isPaginated) {
            const data = await queries.paymentSource.scan({
                userId: isAuth.user.id,
                ids,
                isActive,
                type,
                search,
            });
            return CResponse({ data });
        }

        const data = await queries.paymentSource.paginate({
            userId: isAuth.user.id,
            limit,
            page,
            search,
            isActive,
            type,
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
        const parsed = createPaymentSourceSchema.array().parse(body);

        const data = await queries.paymentSource.create({
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

        await queries.paymentSource.delete({ userId: isAuth.user.id, ids });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
