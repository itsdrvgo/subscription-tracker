import { DEFAULT_PAGINATION } from "@/config/const";
import {
    getMonthlyCost,
    getYearlyCost,
    parseNumeric,
} from "@/lib/subscription";
import {
    BulkUpdateSubscription,
    CreateSubscription,
    FullSubscription,
    fullSubscriptionSchema,
    Subscription,
    subscriptionSchema,
    UpdateSubscription,
} from "@/lib/validations";
import { and, eq, inArray, lt, lte } from "drizzle-orm";
import { db } from "../client";
import {
    SUBSCRIPTION_STATUSES,
    subscriptionReminderSends,
    subscriptions,
} from "../schemas";

type SubStatus = (typeof SUBSCRIPTION_STATUSES)[number];

type SubscriptionInsert = typeof subscriptions.$inferInsert;
type SubscriptionUpdate = Partial<SubscriptionInsert>;

// Drizzle's relational `where` filter type is structural but extremely complex;
// we build the filter object dynamically with optional conditions, which TS
// can't reconcile with that strict shape. Cast at the boundary — the runtime
// shape is correct.
type AnyFilter = Parameters<
    typeof db.query.subscriptions.findMany
>[0] extends infer P
    ? P extends { where?: infer W }
        ? W
        : never
    : never;

function normalizeWritable(
    values: Partial<CreateSubscription>
): SubscriptionUpdate {
    const out: Record<string, unknown> = { ...values };
    if (out.price !== undefined && typeof out.price === "number")
        out.price = String(out.price);
    if (out.yearlyPrice !== undefined && typeof out.yearlyPrice === "number")
        out.yearlyPrice = String(out.yearlyPrice);
    if (out.taxAmount !== undefined && typeof out.taxAmount === "number")
        out.taxAmount = String(out.taxAmount);
    if (
        out.discountAmount !== undefined &&
        typeof out.discountAmount === "number"
    )
        out.discountAmount = String(out.discountAmount);
    if (out.tags && !Array.isArray(out.tags)) out.tags = [];
    return out as SubscriptionUpdate;
}

function buildRelFilter({
    userId,
    ids,
    status,
    statusIn,
    categoryId,
    paymentSourceId,
    billingCycle,
    search,
}: {
    userId: string;
    ids?: string[];
    status?: SubStatus;
    statusIn?: SubStatus[];
    categoryId?: string | null;
    paymentSourceId?: string | null;
    billingCycle?: string;
    search?: string;
}): AnyFilter {
    const conditions: Record<string, unknown>[] = [{ userId }];
    if (ids?.length) conditions.push({ id: { in: ids } });
    if (status) conditions.push({ status });
    if (statusIn?.length) conditions.push({ status: { in: statusIn } });
    if (categoryId !== undefined) conditions.push({ categoryId });
    if (paymentSourceId !== undefined) conditions.push({ paymentSourceId });
    if (billingCycle) conditions.push({ billingCycle });
    if (search) conditions.push({ name: { ilike: `%${search}%` } });

    return { AND: conditions } as AnyFilter;
}

class SubscriptionQuery {
    async scan({
        userId,
        ids,
        status,
        statusIn,
        categoryId,
        paymentSourceId,
        search,
        include,
    }: {
        userId: string;
        ids?: string[];
        status?: SubStatus;
        statusIn?: SubStatus[];
        categoryId?: string | null;
        paymentSourceId?: string | null;
        search?: string;
        include?: "relations";
    }): Promise<FullSubscription[]> {
        const where = buildRelFilter({
            userId,
            ids,
            status,
            statusIn,
            categoryId,
            paymentSourceId,
            search,
        });

        const data = await db.query.subscriptions.findMany({
            where,
            orderBy: { nextRenewalDate: "asc" },
            ...(include === "relations" && {
                with: { category: true, paymentSource: true },
            }),
        });
        return fullSubscriptionSchema.array().parse(data);
    }

    async paginate({
        userId,
        limit = DEFAULT_PAGINATION.GENERAL.LIMIT,
        page = DEFAULT_PAGINATION.GENERAL.PAGE,
        search,
        status,
        statusIn,
        categoryId,
        paymentSourceId,
        billingCycle,
    }: {
        userId: string;
        limit?: number;
        page?: number;
        search?: string;
        status?: SubStatus;
        statusIn?: SubStatus[];
        categoryId?: string | null;
        paymentSourceId?: string | null;
        billingCycle?: string;
    }) {
        limit = limit < 0 ? DEFAULT_PAGINATION.GENERAL.LIMIT : limit;
        page = page < 0 ? DEFAULT_PAGINATION.GENERAL.PAGE : page;

        const where = buildRelFilter({
            userId,
            search,
            status,
            statusIn,
            categoryId,
            paymentSourceId,
            billingCycle,
        });

        const rows = await db.query.subscriptions.findMany({
            where,
            orderBy: { nextRenewalDate: "asc" },
            limit,
            offset: (page - 1) * limit,
            with: { category: true, paymentSource: true },
        });

        // Count separately so pagination math reflects the full filtered set.
        const allRows = await db.query.subscriptions.findMany({
            where,
            columns: { id: true },
        });
        const count = allRows.length;
        const pages = Math.ceil(count / limit);

        return {
            data: fullSubscriptionSchema.array().parse(rows),
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
    }): Promise<FullSubscription | null> {
        const data = await db.query.subscriptions.findFirst({
            where: { AND: [{ userId }, { id }] } as AnyFilter,
            with: { category: true, paymentSource: true },
        });
        if (!data) return null;
        return fullSubscriptionSchema.parse(data);
    }

    async create({
        userId,
        values,
    }: {
        userId: string;
        values: CreateSubscription[];
    }): Promise<FullSubscription[]> {
        const inserted = await db
            .insert(subscriptions)
            .values(
                values.map((v) => ({
                    ...normalizeWritable(v),
                    userId,
                })) as SubscriptionInsert[]
            )
            .returning();

        if (!inserted.length) return [];

        const full = await db.query.subscriptions.findMany({
            where: { id: { in: inserted.map((i) => i.id) } } as AnyFilter,
            with: { category: true, paymentSource: true },
        });

        return fullSubscriptionSchema.array().parse(full);
    }

    async update({
        userId,
        id,
        values,
    }: {
        userId: string;
        id: string;
        values: UpdateSubscription;
    }): Promise<FullSubscription | undefined> {
        const updateValues = normalizeWritable(values);
        const updated = await db
            .update(subscriptions)
            .set({
                ...(updateValues as SubscriptionUpdate),
                updatedAt: new Date(),
            })
            .where(
                and(eq(subscriptions.id, id), eq(subscriptions.userId, userId))
            )
            .returning()
            .then((res) => res[0]);

        if (!updated) return undefined;

        const full = await db.query.subscriptions.findFirst({
            where: { id: updated.id } as AnyFilter,
            with: { category: true, paymentSource: true },
        });
        if (!full) return undefined;
        return fullSubscriptionSchema.parse(full);
    }

    async bulkUpdate({
        userId,
        ids,
        values,
    }: {
        userId: string;
        ids: string[];
        values: BulkUpdateSubscription;
    }): Promise<Subscription[]> {
        const data = await db
            .update(subscriptions)
            .set({
                ...(values as SubscriptionUpdate),
                updatedAt: new Date(),
            })
            .where(
                and(
                    inArray(subscriptions.id, ids),
                    eq(subscriptions.userId, userId)
                )
            )
            .returning();

        return subscriptionSchema.array().parse(data);
    }

    async delete({ userId, ids }: { userId: string; ids: string[] }) {
        return db
            .delete(subscriptions)
            .where(
                and(
                    inArray(subscriptions.id, ids),
                    eq(subscriptions.userId, userId)
                )
            )
            .returning();
    }

    // ------------------------------------------------------------------
    // Cron / scheduled helpers
    // ------------------------------------------------------------------

    async findDueForRenewal({ now = new Date() }: { now?: Date } = {}) {
        const data = await db
            .select()
            .from(subscriptions)
            .where(
                and(
                    inArray(subscriptions.status, ["active", "trial"]),
                    eq(subscriptions.autoRenew, true),
                    lt(subscriptions.nextRenewalDate, now)
                )
            );
        return subscriptionSchema.array().parse(data);
    }

    async findRenewingBetween({
        from,
        to,
    }: {
        from: Date;
        to: Date;
    }): Promise<FullSubscription[]> {
        const data = await db.query.subscriptions.findMany({
            where: {
                AND: [
                    { status: { in: ["active", "trial"] } },
                    { reminderEnabled: true },
                ],
            } as AnyFilter,
            with: { category: true, paymentSource: true },
        });
        const parsed = fullSubscriptionSchema.array().parse(data);
        return parsed.filter(
            (s) => s.nextRenewalDate >= from && s.nextRenewalDate <= to
        );
    }

    async findTrialsEndingBy({
        now = new Date(),
    }: { now?: Date } = {}): Promise<Subscription[]> {
        const data = await db
            .select()
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.isTrial, true),
                    eq(subscriptions.status, "trial"),
                    lte(subscriptions.trialEndDate, now)
                )
            );
        return subscriptionSchema.array().parse(data);
    }

    async findTrialsEndingBetween({
        from,
        to,
    }: {
        from: Date;
        to: Date;
    }): Promise<FullSubscription[]> {
        const data = await db.query.subscriptions.findMany({
            where: {
                AND: [
                    { isTrial: true },
                    { status: "trial" },
                    { reminderEnabled: true },
                ],
            } as AnyFilter,
            with: { category: true, paymentSource: true },
        });
        const parsed = fullSubscriptionSchema.array().parse(data);
        return parsed.filter(
            (s) =>
                s.trialEndDate !== null &&
                s.trialEndDate !== undefined &&
                s.trialEndDate >= from &&
                s.trialEndDate <= to
        );
    }

    async rollRenewal({
        id,
        nextRenewalDate,
    }: {
        id: string;
        nextRenewalDate: Date;
    }) {
        return db
            .update(subscriptions)
            .set({ nextRenewalDate, updatedAt: new Date() })
            .where(eq(subscriptions.id, id))
            .returning()
            .then((res) => res[0]);
    }

    async markStatus({ id, status }: { id: string; status: SubStatus }) {
        return db
            .update(subscriptions)
            .set({ status, updatedAt: new Date() })
            .where(eq(subscriptions.id, id))
            .returning()
            .then((res) => res[0]);
    }

    async recordReminderSent({
        subscriptionId,
        userId,
        reminderType,
        forDate,
        emailSentTo,
    }: {
        subscriptionId: string;
        userId: string;
        reminderType:
            | "renewal"
            | "trial_ending"
            | "budget_warning"
            | "budget_critical"
            | "budget_exceeded"
            | "monthly_summary";
        forDate: Date;
        emailSentTo: string;
    }) {
        try {
            const data = await db
                .insert(subscriptionReminderSends)
                .values({
                    subscriptionId,
                    userId,
                    reminderType,
                    forDate,
                    emailSentTo,
                })
                .returning()
                .then((res) => res[0]);
            return data;
        } catch {
            return null;
        }
    }

    async hasReminderBeenSent({
        subscriptionId,
        reminderType,
        forDate,
    }: {
        subscriptionId: string;
        reminderType: string;
        forDate: Date;
    }): Promise<boolean> {
        const data = await db
            .select()
            .from(subscriptionReminderSends)
            .where(
                and(
                    eq(
                        subscriptionReminderSends.subscriptionId,
                        subscriptionId
                    ),
                    eq(
                        subscriptionReminderSends.reminderType,
                        reminderType as
                            | "renewal"
                            | "trial_ending"
                            | "budget_warning"
                            | "budget_critical"
                            | "budget_exceeded"
                            | "monthly_summary"
                    ),
                    eq(subscriptionReminderSends.forDate, forDate)
                )
            )
            .limit(1);
        return data.length > 0;
    }

    async stampReminderSent({ id, at }: { id: string; at: Date }) {
        return db
            .update(subscriptions)
            .set({ lastReminderSentAt: at })
            .where(eq(subscriptions.id, id))
            .returning()
            .then((res) => res[0]);
    }

    // ------------------------------------------------------------------
    // Analytics
    // ------------------------------------------------------------------

    async forAnalytics({
        userId,
    }: {
        userId: string;
    }): Promise<FullSubscription[]> {
        const data = await db.query.subscriptions.findMany({
            where: { userId } as AnyFilter,
            with: { category: true, paymentSource: true },
            orderBy: { createdAt: "desc" },
        });
        return fullSubscriptionSchema.array().parse(data);
    }
}

export const subscriptionQueries = new SubscriptionQuery();

type CostSub = Pick<
    Subscription,
    | "price"
    | "trialPrice"
    | "billingCycle"
    | "customIntervalDays"
    | "taxAmount"
    | "discountAmount"
    | "isTrial"
    | "trialEndDate"
    | "status"
>;

/**
 * Returns the price that applies right now. During an unexpired trial we use
 * trialPrice (falling back to 0 when null, i.e. free trial). Once the trial
 * window has passed — or there is no trial — we use the regular price.
 */
export function getEffectivePrice(
    s: Pick<
        Subscription,
        "price" | "trialPrice" | "isTrial" | "trialEndDate" | "status"
    >,
    now: Date = new Date()
): number {
    const inTrial =
        s.isTrial &&
        s.status !== "expired" &&
        (!s.trialEndDate || s.trialEndDate > now);
    if (inTrial) {
        return s.trialPrice !== null && s.trialPrice !== undefined
            ? parseNumeric(s.trialPrice)
            : 0;
    }
    return parseNumeric(s.price);
}

export function computeMonthlyCostForSubscription(
    s: CostSub,
    now: Date = new Date()
): number {
    return getMonthlyCost({
        price: getEffectivePrice(s, now),
        billingCycle: s.billingCycle,
        customIntervalDays: s.customIntervalDays ?? null,
        taxAmount: parseNumeric(s.taxAmount),
        discountAmount: parseNumeric(s.discountAmount),
    });
}

export function computeYearlyCostForSubscription(
    s: CostSub,
    now: Date = new Date()
): number {
    return getYearlyCost({
        price: getEffectivePrice(s, now),
        billingCycle: s.billingCycle,
        customIntervalDays: s.customIntervalDays ?? null,
        taxAmount: parseNumeric(s.taxAmount),
        discountAmount: parseNumeric(s.discountAmount),
    });
}
