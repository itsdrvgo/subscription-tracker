import { DEFAULT_PAGINATION } from "@/config/const";
import {
    SubscriptionActivityLog,
    subscriptionActivityLogSchema,
} from "@/lib/validations";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { subscriptionActivityLogs } from "../schemas";

type Action = SubscriptionActivityLog["action"];

class SubscriptionActivityLogQuery {
    async add({
        userId,
        subscriptionId,
        subscriptionName,
        action,
        metadata,
    }: {
        userId: string;
        subscriptionId?: string | null;
        subscriptionName: string;
        action: Action;
        metadata?: Record<string, unknown>;
    }) {
        return db
            .insert(subscriptionActivityLogs)
            .values({
                userId,
                subscriptionId: subscriptionId ?? null,
                subscriptionName,
                action,
                metadata: metadata ?? {},
            })
            .returning()
            .then((res) => res[0]);
    }

    async addMany(
        entries: {
            userId: string;
            subscriptionId?: string | null;
            subscriptionName: string;
            action: Action;
            metadata?: Record<string, unknown>;
        }[]
    ) {
        if (!entries.length) return [];
        return db
            .insert(subscriptionActivityLogs)
            .values(
                entries.map((e) => ({
                    userId: e.userId,
                    subscriptionId: e.subscriptionId ?? null,
                    subscriptionName: e.subscriptionName,
                    action: e.action,
                    metadata: e.metadata ?? {},
                }))
            )
            .returning();
    }

    async paginate({
        userId,
        limit = DEFAULT_PAGINATION.GENERAL.LIMIT,
        page = DEFAULT_PAGINATION.GENERAL.PAGE,
        subscriptionId,
        action,
    }: {
        userId: string;
        limit?: number;
        page?: number;
        subscriptionId?: string;
        action?: Action;
    }) {
        limit = limit < 0 ? DEFAULT_PAGINATION.GENERAL.LIMIT : limit;
        page = page < 0 ? DEFAULT_PAGINATION.GENERAL.PAGE : page;

        const data = await db.query.subscriptionActivityLogs.findMany({
            where: {
                AND: [
                    { userId },
                    ...(subscriptionId ? [{ subscriptionId }] : []),
                    ...(action ? [{ action }] : []),
                ],
            },
            orderBy: { createdAt: "desc" },
            limit,
            offset: (page - 1) * limit,
        });

        const count = await db.$count(
            subscriptionActivityLogs,
            and(
                eq(subscriptionActivityLogs.userId, userId),
                subscriptionId
                    ? eq(
                          subscriptionActivityLogs.subscriptionId,
                          subscriptionId
                      )
                    : undefined,
                action ? eq(subscriptionActivityLogs.action, action) : undefined
            )
        );

        const pages = Math.ceil(count / limit);

        return {
            data: subscriptionActivityLogSchema.array().parse(data),
            count,
            pages,
        };
    }

    async recent({
        userId,
        limit = 10,
    }: {
        userId: string;
        limit?: number;
    }): Promise<SubscriptionActivityLog[]> {
        const data = await db
            .select()
            .from(subscriptionActivityLogs)
            .where(eq(subscriptionActivityLogs.userId, userId))
            .orderBy(desc(subscriptionActivityLogs.createdAt))
            .limit(limit);

        return subscriptionActivityLogSchema.array().parse(data);
    }

    async deleteBySubscriptionIds({ ids }: { ids: string[] }) {
        if (!ids.length) return [];
        return db
            .delete(subscriptionActivityLogs)
            .where(inArray(subscriptionActivityLogs.subscriptionId, ids))
            .returning();
    }
}

export const subscriptionActivityLogQueries =
    new SubscriptionActivityLogQuery();
