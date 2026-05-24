import { apiGuard, RATE_LIMITS } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { PAYMENT_SOURCE_TYPES } from "@/lib/db/schemas";
import { CResponse, handleError } from "@/lib/utils";
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
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { searchParams } = new URL(req.url);
        const { page, limit, search, isPaginated, ids, isActive, type } =
            paymentSourceQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        if (!isPaginated) {
            const data = await queries.paymentSource.scan({
                userId: userId!,
                ids,
                isActive,
                type,
                search,
            });
            return CResponse({ data });
        }

        const data = await queries.paymentSource.paginate({
            userId: userId!,
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
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const body = await req.json();
        const parsed = createPaymentSourceSchema.array().parse(body);

        const data = await queries.paymentSource.create({
            userId: userId!,
            values: parsed,
        });
        return CResponse({ message: "CREATED", data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.MUTATING_BULK,
            enforceOrigin: true,
        });

        const { searchParams } = new URL(req.url);
        const { ids } = deleteDataSchema.parse(
            Object.fromEntries(searchParams.entries())
        );

        await queries.paymentSource.delete({ userId: userId!, ids });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
