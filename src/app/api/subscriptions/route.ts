import { MESSAGES, RATE_LIMITS, SUBSCRIPTION_STATUSES } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import {
    bulkIdsSchema,
    bulkUpdateSubscriptionSchema,
    createSubscriptionSchema,
    deleteDataSchema,
    paginationQuerySchema,
} from "@/lib/validations";
import { NextRequest } from "next/server";
import z from "zod";

const subscriptionPaginationQuerySchema = paginationQuerySchema.extend({
    status: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.enum(SUBSCRIPTION_STATUSES).optional()
        )
        .optional(),
    statusIn: z
        .preprocess(
            (v) => {
                if (typeof v !== "string" || !v.length) return undefined;
                return v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            },
            z.array(z.enum(SUBSCRIPTION_STATUSES)).optional()
        )
        .optional(),
    categoryId: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.string().optional()
        )
        .optional(),
    paymentSourceId: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.string().optional()
        )
        .optional(),
    billingCycle: z
        .preprocess(
            (v) => (v === undefined || v === null || v === "" ? undefined : v),
            z.string().optional()
        )
        .optional(),
});

export async function GET(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { searchParams } = new URL(req.url);

        const {
            page,
            limit,
            search,
            isPaginated,
            ids,
            status,
            statusIn,
            categoryId,
            paymentSourceId,
            billingCycle,
        } = subscriptionPaginationQuerySchema.parse(
            Object.fromEntries(searchParams.entries())
        );

        if (!isPaginated) {
            const data = await queries.subscription.scan({
                userId: userId!,
                ids,
                status,
                statusIn,
                categoryId,
                paymentSourceId,
                search,
                include: "relations",
            });
            return CResponse({ data });
        }

        const data = await queries.subscription.paginate({
            userId: userId!,
            limit,
            page,
            search,
            status,
            statusIn,
            categoryId,
            paymentSourceId,
            billingCycle,
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
        const parsed = createSubscriptionSchema.array().parse(body);

        const data = await queries.subscription.create({
            userId: userId!,
            values: parsed,
        });

        await queries.activityLog.addMany(
            data.map((s) => ({
                userId: userId!,
                subscriptionId: s.id,
                subscriptionName: s.name,
                action: "created" as const,
                metadata: {
                    price: s.price,
                    currency: s.currency,
                    billingCycle: s.billingCycle,
                },
            }))
        );

        return CResponse({ message: "CREATED", data });
    } catch (err) {
        return handleError(err);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.MUTATING_BULK,
            enforceOrigin: true,
        });

        const body = await req.json();
        const { ids, values } = z
            .object({
                ids: bulkIdsSchema,
                values: bulkUpdateSubscriptionSchema,
            })
            .parse(body);

        const existing = await queries.subscription.scan({
            userId: userId!,
            ids,
        });
        const invalidIds = ids.filter(
            (id) => !existing.find((item) => item.id === id)
        );
        if (invalidIds.length)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.INVALID_IDS(invalidIds),
                "BAD_REQUEST"
            );

        const data = await queries.subscription.bulkUpdate({
            userId: userId!,
            ids,
            values,
        });

        await queries.activityLog.addMany(
            data.map((s) => ({
                userId: userId!,
                subscriptionId: s.id,
                subscriptionName: s.name,
                action: "updated" as const,
                metadata: { bulk: true, changes: values },
            }))
        );

        return CResponse({ data });
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

        const existing = await queries.subscription.scan({
            userId: userId!,
            ids,
        });
        const invalidIds = ids.filter(
            (id) => !existing.find((item) => item.id === id)
        );
        if (invalidIds.length)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.INVALID_IDS(invalidIds),
                "BAD_REQUEST"
            );

        await queries.subscription.delete({
            userId: userId!,
            ids,
        });

        await queries.activityLog.addMany(
            existing.map((s) => ({
                userId: userId!,
                subscriptionId: null,
                subscriptionName: s.name,
                action: "deleted" as const,
                metadata: { id: s.id },
            }))
        );

        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
