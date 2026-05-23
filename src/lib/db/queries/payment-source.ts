import { DEFAULT_PAGINATION } from "@/config/const";
import {
    CreatePaymentSource,
    PaymentSource,
    paymentSourceSchema,
    UpdatePaymentSource,
} from "@/lib/validations";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../client";
import { paymentSources } from "../schemas";

class PaymentSourceQuery {
    async scan({
        userId,
        ids,
        isActive,
        type,
        search,
    }: {
        userId: string;
        ids?: string[];
        isActive?: boolean;
        type?: PaymentSource["type"];
        search?: string;
    }): Promise<PaymentSource[]> {
        const data = await db.query.paymentSources.findMany({
            where: {
                AND: [
                    { userId },
                    ...(ids?.length ? [{ id: { in: ids } }] : []),
                    ...(isActive !== undefined ? [{ isActive }] : []),
                    ...(type ? [{ type }] : []),
                    ...(search ? [{ name: { ilike: `%${search}%` } }] : []),
                ],
            },
            orderBy: { createdAt: "desc" },
        });
        return paymentSourceSchema.array().parse(data);
    }

    async paginate({
        userId,
        limit = DEFAULT_PAGINATION.GENERAL.LIMIT,
        page = DEFAULT_PAGINATION.GENERAL.PAGE,
        search,
        isActive,
        type,
    }: {
        userId: string;
        limit?: number;
        page?: number;
        search?: string;
        isActive?: boolean;
        type?: PaymentSource["type"];
    }) {
        limit = limit < 0 ? DEFAULT_PAGINATION.GENERAL.LIMIT : limit;
        page = page < 0 ? DEFAULT_PAGINATION.GENERAL.PAGE : page;

        const data = await db.query.paymentSources.findMany({
            where: {
                AND: [
                    { userId },
                    ...(search ? [{ name: { ilike: `%${search}%` } }] : []),
                    ...(isActive !== undefined ? [{ isActive }] : []),
                    ...(type ? [{ type }] : []),
                ],
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset: (page - 1) * limit,
            extras: {
                count: db
                    .$count(
                        paymentSources,
                        and(
                            eq(paymentSources.userId, userId),
                            search?.length
                                ? ilike(paymentSources.name, `%${search}%`)
                                : undefined,
                            isActive !== undefined
                                ? eq(paymentSources.isActive, isActive)
                                : undefined,
                            type ? eq(paymentSources.type, type) : undefined
                        )
                    )
                    .as("payment_source_count"),
            },
        });

        const count = +(data?.[0]?.count || 0);
        const pages = Math.ceil(count / limit);

        return {
            data: paymentSourceSchema.array().parse(data),
            count,
            pages,
        };
    }

    async get({
        userId,
        id,
    }: {
        userId: string;
        id: string;
    }): Promise<PaymentSource | null> {
        const data = await db.query.paymentSources.findFirst({
            where: { AND: [{ userId }, { id }] },
        });
        if (!data) return null;
        return paymentSourceSchema.parse(data);
    }

    async create({
        userId,
        values,
    }: {
        userId: string;
        values: CreatePaymentSource[];
    }): Promise<PaymentSource[]> {
        const data = await db
            .insert(paymentSources)
            .values(values.map((v) => ({ ...v, userId })))
            .returning();

        return paymentSourceSchema.array().parse(data);
    }

    async update({
        userId,
        id,
        values,
    }: {
        userId: string;
        id: string;
        values: UpdatePaymentSource;
    }): Promise<PaymentSource | undefined> {
        const data = await db
            .update(paymentSources)
            .set({ ...values, updatedAt: new Date() })
            .where(
                and(
                    eq(paymentSources.id, id),
                    eq(paymentSources.userId, userId)
                )
            )
            .returning()
            .then((res) => res[0]);

        if (!data) return undefined;
        return paymentSourceSchema.parse(data);
    }

    async delete({ userId, ids }: { userId: string; ids: string[] }) {
        return db
            .delete(paymentSources)
            .where(
                and(
                    inArray(paymentSources.id, ids),
                    eq(paymentSources.userId, userId)
                )
            )
            .returning();
    }
}

export const paymentSourceQueries = new PaymentSourceQuery();
