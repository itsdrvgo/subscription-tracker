import { DEFAULT_PAGINATION } from "@/config/const";
import {
    CreateSubscriptionCategory,
    SubscriptionCategory,
    subscriptionCategorySchema,
    UpdateSubscriptionCategory,
} from "@/lib/validations";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../client";
import { subscriptionCategories } from "../schemas";

class SubscriptionCategoryQuery {
    async scan({
        userId,
        ids,
        search,
    }: {
        userId: string;
        ids?: string[];
        search?: string;
    }): Promise<SubscriptionCategory[]> {
        const data = await db.query.subscriptionCategories.findMany({
            where: {
                AND: [
                    { userId },
                    ...(ids?.length ? [{ id: { in: ids } }] : []),
                    ...(search ? [{ name: { ilike: `%${search}%` } }] : []),
                ],
            },
            orderBy: { name: "asc" },
        });
        return subscriptionCategorySchema.array().parse(data);
    }

    async paginate({
        userId,
        limit = DEFAULT_PAGINATION.GENERAL.LIMIT,
        page = DEFAULT_PAGINATION.GENERAL.PAGE,
        search,
    }: {
        userId: string;
        limit?: number;
        page?: number;
        search?: string;
    }) {
        limit = limit < 0 ? DEFAULT_PAGINATION.GENERAL.LIMIT : limit;
        page = page < 0 ? DEFAULT_PAGINATION.GENERAL.PAGE : page;

        const data = await db.query.subscriptionCategories.findMany({
            where: {
                AND: [
                    { userId },
                    ...(search ? [{ name: { ilike: `%${search}%` } }] : []),
                ],
            },
            orderBy: { name: "asc" },
            limit,
            offset: (page - 1) * limit,
            extras: {
                count: db
                    .$count(
                        subscriptionCategories,
                        and(
                            eq(subscriptionCategories.userId, userId),
                            search?.length
                                ? ilike(
                                      subscriptionCategories.name,
                                      `%${search}%`
                                  )
                                : undefined
                        )
                    )
                    .as("subscription_category_count"),
            },
        });

        const count = +(data?.[0]?.count || 0);
        const pages = Math.ceil(count / limit);

        return {
            data: subscriptionCategorySchema.array().parse(data),
            count,
            pages,
        };
    }

    async get({
        userId,
        id,
        slug,
    }: {
        userId: string;
        id?: string;
        slug?: string;
    }): Promise<SubscriptionCategory | null> {
        if (!id && !slug)
            throw new Error("Either 'id' or 'slug' must be provided");

        const data = await db.query.subscriptionCategories.findFirst({
            where: {
                AND: [
                    { userId },
                    {
                        OR: [
                            ...(id ? [{ id }] : []),
                            ...(slug ? [{ slug }] : []),
                        ],
                    },
                ],
            },
        });
        if (!data) return null;
        return subscriptionCategorySchema.parse(data);
    }

    async create({
        userId,
        values,
    }: {
        userId: string;
        values: CreateSubscriptionCategory[];
    }): Promise<SubscriptionCategory[]> {
        const data = await db
            .insert(subscriptionCategories)
            .values(values.map((v) => ({ ...v, userId })))
            .returning();

        return subscriptionCategorySchema.array().parse(data);
    }

    async update({
        userId,
        id,
        values,
    }: {
        userId: string;
        id: string;
        values: UpdateSubscriptionCategory;
    }): Promise<SubscriptionCategory | undefined> {
        const data = await db
            .update(subscriptionCategories)
            .set({ ...values, updatedAt: new Date() })
            .where(
                and(
                    eq(subscriptionCategories.id, id),
                    eq(subscriptionCategories.userId, userId)
                )
            )
            .returning()
            .then((res) => res[0]);

        if (!data) return undefined;
        return subscriptionCategorySchema.parse(data);
    }

    async delete({ userId, ids }: { userId: string; ids: string[] }) {
        return db
            .delete(subscriptionCategories)
            .where(
                and(
                    inArray(subscriptionCategories.id, ids),
                    eq(subscriptionCategories.userId, userId)
                )
            )
            .returning();
    }
}

export const subscriptionCategoryQueries = new SubscriptionCategoryQuery();
