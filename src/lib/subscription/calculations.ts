import { BILLING_CYCLES } from "@/config/const";

type BillingCycle = (typeof BILLING_CYCLES)[number];

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
