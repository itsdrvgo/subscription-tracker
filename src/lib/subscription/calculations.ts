import { BILLING_CYCLES } from "@/lib/db/schemas";

type BillingCycle = (typeof BILLING_CYCLES)[number];

/**
 * Returns the equivalent monthly cost for a given billing cycle, in the
 * subscription's native currency. Treats yearly/quarterly/weekly as their
 * spread monthly equivalent so analytics can compare across cycles.
 */
export function getMonthlyCost(params: {
    price: number;
    billingCycle: BillingCycle;
    customIntervalDays?: number | null;
    taxAmount?: number;
    discountAmount?: number;
}): number {
    const tax = params.taxAmount ?? 0;
    const discount = params.discountAmount ?? 0;
    const effective = Math.max(0, params.price + tax - discount);

    switch (params.billingCycle) {
        case "weekly":
            return (effective * 52) / 12;
        case "monthly":
            return effective;
        case "quarterly":
            return effective / 3;
        case "yearly":
            return effective / 12;
        case "custom": {
            const days = params.customIntervalDays ?? 30;
            if (days <= 0) return effective;
            return (effective * 30) / days;
        }
        default:
            return effective;
    }
}

export function getYearlyCost(params: {
    price: number;
    billingCycle: BillingCycle;
    customIntervalDays?: number | null;
    taxAmount?: number;
    discountAmount?: number;
}): number {
    return getMonthlyCost(params) * 12;
}

/**
 * Add a billing cycle to a date and return the next renewal date.
 */
export function getNextRenewalDate(params: {
    from: Date;
    billingCycle: BillingCycle;
    customIntervalDays?: number | null;
}): Date {
    const next = new Date(params.from);

    switch (params.billingCycle) {
        case "weekly":
            next.setDate(next.getDate() + 7);
            break;
        case "monthly":
            next.setMonth(next.getMonth() + 1);
            break;
        case "quarterly":
            next.setMonth(next.getMonth() + 3);
            break;
        case "yearly":
            next.setFullYear(next.getFullYear() + 1);
            break;
        case "custom":
            next.setDate(next.getDate() + (params.customIntervalDays ?? 30));
            break;
    }

    return next;
}

/**
 * Roll a renewal date forward until it is in the future, applying the billing
 * cycle repeatedly. Used by the cron job to bring stale renewals current
 * after one or more elapsed cycles.
 */
export function rollRenewalForward(params: {
    from: Date;
    billingCycle: BillingCycle;
    customIntervalDays?: number | null;
    now?: Date;
}): Date {
    const now = params.now ?? new Date();
    let next = params.from;
    let guard = 0;
    while (next <= now && guard < 60) {
        next = getNextRenewalDate({
            from: next,
            billingCycle: params.billingCycle,
            customIntervalDays: params.customIntervalDays,
        });
        guard++;
    }
    return next;
}

export function daysUntil(date: Date, from: Date = new Date()): number {
    const a = new Date(date);
    a.setHours(0, 0, 0, 0);
    const b = new Date(from);
    b.setHours(0, 0, 0, 0);
    const diff = a.getTime() - b.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function startOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
