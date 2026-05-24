import { RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { CResponse, handleError } from "@/lib/utils";
import {
    createSubscriptionCategorySchema,
    deleteDataSchema,
    paginationQuerySchema,
} from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { searchParams } = new URL(req.url);
        const { page, limit, search, isPaginated, ids } =
            paginationQuerySchema.parse(
                Object.fromEntries(searchParams.entries())
            );

        if (!isPaginated) {
            const data = await queries.subscriptionCategory.scan({
                userId: userId!,
                ids,
                search,
            });
            return CResponse({ data });
        }

        const data = await queries.subscriptionCategory.paginate({
            userId: userId!,
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
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const body = await req.json();
        const parsed = createSubscriptionCategorySchema.array().parse(body);

        const data = await queries.subscriptionCategory.create({
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

        await queries.subscriptionCategory.delete({
            userId: userId!,
            ids,
        });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
