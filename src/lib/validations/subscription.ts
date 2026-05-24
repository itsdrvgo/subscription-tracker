import {
    ACTIVITY_ACTIONS,
    BILLING_CYCLES,
    PAYMENT_SOURCE_TYPES,
    REMINDER_TYPES,
    SUBSCRIPTION_PRIORITIES,
    SUBSCRIPTION_STATUSES,
} from "@/lib/db/schemas";
import z from "zod";
import { generateDateSchema, generateIdSchema } from "./general";

const numericString = z.union([z.string(), z.number()]).transform((v) => {
    if (typeof v === "number") return v.toString();
    return v;
});

const optionalNumericString = z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => {
        if (v === null || v === undefined || v === "") return null;
        if (typeof v === "number") return v.toString();
        return v;
    });

const tagsSchema = z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((v) => {
        if (Array.isArray(v)) return v.map((t) => t.trim()).filter(Boolean);
        if (typeof v === "string" && v.length > 0)
            return v
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
        return [];
    });

// ---------------------------------------------------------------------------
// Subscription Category
// ---------------------------------------------------------------------------

export const subscriptionCategorySchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    name: z.string("Name is required").min(1, "Name cannot be empty"),
    slug: z
        .string("Slug is required")
        .min(1, "Slug cannot be empty")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug can only contain lowercase letters, numbers, and hyphens"
        ),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
    updatedAt: generateDateSchema({ error: "Updated at must be a valid date" }),
});

export const createSubscriptionCategorySchema = subscriptionCategorySchema.omit(
    {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
    }
);

export const updateSubscriptionCategorySchema =
    createSubscriptionCategorySchema.partial();

export type SubscriptionCategory = z.infer<typeof subscriptionCategorySchema>;
export type CreateSubscriptionCategory = z.infer<
    typeof createSubscriptionCategorySchema
>;
export type UpdateSubscriptionCategory = z.infer<
    typeof updateSubscriptionCategorySchema
>;

// ---------------------------------------------------------------------------
// Payment Source
// ---------------------------------------------------------------------------

export const paymentSourceSchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    name: z.string("Name is required").min(1, "Name cannot be empty"),
    type: z.enum(PAYMENT_SOURCE_TYPES, "Invalid payment source type"),
    identifier: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
    updatedAt: generateDateSchema({ error: "Updated at must be a valid date" }),
});

export const createPaymentSourceSchema = paymentSourceSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
});

export const updatePaymentSourceSchema = createPaymentSourceSchema.partial();

export type PaymentSource = z.infer<typeof paymentSourceSchema>;
export type CreatePaymentSource = z.infer<typeof createPaymentSourceSchema>;
export type UpdatePaymentSource = z.infer<typeof updatePaymentSourceSchema>;

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export const budgetSchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    monthlyLimit: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((v) => {
            if (v === null || v === undefined || v === "") return null;
            return typeof v === "number" ? v.toString() : v;
        }),
    yearlyLimit: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((v) => {
            if (v === null || v === undefined || v === "") return null;
            return typeof v === "number" ? v.toString() : v;
        }),
    warningThreshold: z.coerce
        .number()
        .int()
        .min(1, "Warning threshold must be at least 1")
        .max(100, "Warning threshold cannot exceed 100")
        .default(80),
    criticalThreshold: z.coerce
        .number()
        .int()
        .min(1, "Critical threshold must be at least 1")
        .max(100, "Critical threshold cannot exceed 100")
        .default(95),
    currency: z.string().min(1).default("USD"),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
    updatedAt: generateDateSchema({ error: "Updated at must be a valid date" }),
});

export const upsertBudgetSchema = budgetSchema
    .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    .refine((data) => data.criticalThreshold > data.warningThreshold, {
        path: ["criticalThreshold"],
        message: "Critical threshold must be greater than warning threshold",
    });

export type Budget = z.infer<typeof budgetSchema>;
export type UpsertBudget = z.infer<typeof upsertBudgetSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const subscriptionSchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    categoryId: generateIdSchema({ isUUID: true }).nullable().optional(),
    paymentSourceId: generateIdSchema({ isUUID: true }).nullable().optional(),
    name: z.string("Name is required").min(1, "Name cannot be empty"),
    description: z.string().nullable().optional(),
    websiteUrl: z
        .union([z.url("Website URL must be a valid URL"), z.literal("")])
        .nullable()
        .optional()
        .transform((v) => (v === "" ? null : v)),
    logoUrl: z
        .union([z.url("Logo URL must be a valid URL"), z.literal("")])
        .nullable()
        .optional()
        .transform((v) => (v === "" ? null : v)),
    tags: z.array(z.string()).default([]),
    billingCycle: z.enum(BILLING_CYCLES, "Invalid billing cycle"),
    customIntervalDays: z.coerce
        .number()
        .int()
        .positive("Interval must be positive")
        .nullable()
        .optional(),
    price: numericString,
    trialPrice: optionalNumericString,
    yearlyPrice: optionalNumericString,
    currency: z.string().min(1).default("USD"),
    taxAmount: numericString.default("0"),
    discountAmount: numericString.default("0"),
    startDate: generateDateSchema({ error: "Start date is required" }),
    nextRenewalDate: generateDateSchema({
        error: "Next renewal date is required",
    }),
    autoRenew: z.boolean().default(true),
    isTrial: z.boolean().default(false),
    trialEndDate: z
        .union([z.string(), z.date(), z.null()])
        .optional()
        .transform((v) => {
            if (v === null || v === undefined || v === "") return null;
            return new Date(v as string | Date);
        }),
    status: z.enum(SUBSCRIPTION_STATUSES).default("active"),
    priority: z.enum(SUBSCRIPTION_PRIORITIES).default("medium"),
    reminderEnabled: z.boolean().default(true),
    reminderDaysBefore: z.coerce
        .number()
        .int()
        .min(0, "Reminder days cannot be negative")
        .max(60, "Reminder days cannot exceed 60")
        .default(1),
    notes: z.string().nullable().optional(),
    lastReminderSentAt: z
        .union([z.string(), z.date(), z.null()])
        .optional()
        .transform((v) => {
            if (v === null || v === undefined || v === "") return null;
            return new Date(v as string | Date);
        }),
    cancelledAt: z
        .union([z.string(), z.date(), z.null()])
        .optional()
        .transform((v) => {
            if (v === null || v === undefined || v === "") return null;
            return new Date(v as string | Date);
        }),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
    updatedAt: generateDateSchema({ error: "Updated at must be a valid date" }),
});

export const createSubscriptionSchema = subscriptionSchema
    .omit({
        id: true,
        userId: true,
        lastReminderSentAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        tags: tagsSchema,
    })
    .refine(
        (data) => {
            if (data.billingCycle === "custom")
                return (
                    data.customIntervalDays !== null &&
                    data.customIntervalDays !== undefined &&
                    data.customIntervalDays > 0
                );
            return true;
        },
        {
            path: ["customIntervalDays"],
            message:
                "Custom interval days is required when billing cycle is 'custom'",
        }
    )
    .refine(
        (data) => {
            if (data.isTrial) return !!data.trialEndDate;
            return true;
        },
        {
            path: ["trialEndDate"],
            message: "Trial end date is required when subscription is a trial",
        }
    );

export const updateSubscriptionSchema = subscriptionSchema
    .omit({
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
    })
    .partial();

export const bulkUpdateSubscriptionSchema = subscriptionSchema
    .pick({
        status: true,
        priority: true,
        categoryId: true,
        paymentSourceId: true,
        autoRenew: true,
        reminderEnabled: true,
    })
    .partial();

export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateSubscription = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscription = z.infer<typeof updateSubscriptionSchema>;
export type BulkUpdateSubscription = z.infer<
    typeof bulkUpdateSubscriptionSchema
>;

export const fullSubscriptionSchema = subscriptionSchema.extend({
    category: subscriptionCategorySchema.nullable().optional(),
    paymentSource: paymentSourceSchema.nullable().optional(),
});

export type FullSubscription = z.infer<typeof fullSubscriptionSchema>;

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export const subscriptionActivityLogSchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    subscriptionId: generateIdSchema({ isUUID: true }).nullable().optional(),
    subscriptionName: z.string(),
    action: z.enum(ACTIVITY_ACTIONS),
    metadata: z.record(z.string(), z.unknown()).default({}),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
});

export type SubscriptionActivityLog = z.infer<
    typeof subscriptionActivityLogSchema
>;

// ---------------------------------------------------------------------------
// Reminder Send Log
// ---------------------------------------------------------------------------

export const subscriptionReminderSendSchema = z.object({
    id: generateIdSchema({ isUUID: true }),
    subscriptionId: generateIdSchema({ isUUID: true }),
    userId: generateIdSchema({ isUUID: true }),
    reminderType: z.enum(REMINDER_TYPES),
    forDate: generateDateSchema({ error: "For date is required" }),
    sentAt: generateDateSchema({ error: "Sent at is required" }),
    emailSentTo: z.string(),
    createdAt: generateDateSchema({ error: "Created at must be a valid date" }),
});

export type SubscriptionReminderSend = z.infer<
    typeof subscriptionReminderSendSchema
>;

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const subscriptionStatsSchema = z.object({
    totalActive: z.number(),
    totalInactive: z.number(),
    totalTrial: z.number(),
    totalCancelled: z.number(),
    monthlySpend: z.number(),
    yearlySpend: z.number(),
    yearlyProjection: z.number(),
    upcomingRenewals7Days: z.number(),
    upcomingRenewals30Days: z.number(),
    trialsEndingSoon: z.number(),
    averageSubscriptionCost: z.number(),
    highestCostSubscription: z
        .object({
            id: z.string(),
            name: z.string(),
            monthlyCost: z.number(),
        })
        .nullable(),
    spendByCategory: z.array(
        z.object({
            categoryId: z.string().nullable(),
            categoryName: z.string(),
            monthlyCost: z.number(),
            count: z.number(),
        })
    ),
    spendByPaymentSource: z.array(
        z.object({
            paymentSourceId: z.string().nullable(),
            paymentSourceName: z.string(),
            monthlyCost: z.number(),
            count: z.number(),
        })
    ),
    monthlyTrend: z.array(
        z.object({
            month: z.string(),
            spend: z.number(),
        })
    ),
    budget: z
        .object({
            monthlyLimit: z.number().nullable(),
            yearlyLimit: z.number().nullable(),
            monthlyUsage: z.number(),
            yearlyUsage: z.number(),
            monthlyPercent: z.number(),
            yearlyPercent: z.number(),
            warningThreshold: z.number(),
            criticalThreshold: z.number(),
            currency: z.string(),
            status: z.enum(["safe", "warning", "critical", "exceeded"]),
        })
        .nullable(),
});

export type SubscriptionStats = z.infer<typeof subscriptionStatsSchema>;
