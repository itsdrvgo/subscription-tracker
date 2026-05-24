import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { timestamps } from "../helper";
import { users } from "./user";

export const BILLING_CYCLES = [
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
    "custom",
] as const;

export const SUBSCRIPTION_STATUSES = [
    "active",
    "inactive",
    "cancelled",
    "paused",
    "trial",
    "expired",
    "pending",
] as const;

export const SUBSCRIPTION_PRIORITIES = ["low", "medium", "high"] as const;

export const PAYMENT_SOURCE_TYPES = [
    "play_store",
    "app_store",
    "credit_card",
    "upi_credit_card",
    "debit_card",
    "paypal",
    "upi",
    "bank",
    "manual",
    "custom",
] as const;

export const ACTIVITY_ACTIONS = [
    "created",
    "updated",
    "deleted",
    "renewed",
    "cancelled",
    "paused",
    "resumed",
    "trial_ended",
    "reminder_sent",
    "status_changed",
    "price_changed",
] as const;

export const REMINDER_TYPES = [
    "renewal",
    "trial_ending",
    "budget_warning",
    "budget_critical",
    "budget_exceeded",
    "monthly_summary",
] as const;

export const subscriptionCategories = pgTable(
    "subscription_categories",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: t.text("name").notNull(),
        slug: t.text("slug").notNull(),
        color: t.text("color"),
        icon: t.text("icon"),
        ...timestamps(t),
    }),
    (t) => [
        uniqueIndex("subscription_categories_user_slug_uidx").on(
            t.userId,
            t.slug
        ),
        index("subscription_categories_user_idx").on(t.userId),
    ]
);

export const paymentSources = pgTable(
    "payment_sources",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: t.text("name").notNull(),
        type: t.text("type", { enum: PAYMENT_SOURCE_TYPES }).notNull(),
        identifier: t.text("identifier"),
        isActive: t.boolean("is_active").notNull().default(true),
        ...timestamps(t),
    }),
    (t) => [
        index("payment_sources_user_idx").on(t.userId),
        index("payment_sources_type_idx").on(t.type),
    ]
);

export const budgets = pgTable(
    "budgets",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        monthlyLimit: t.numeric("monthly_limit", {
            precision: 12,
            scale: 2,
        }),
        yearlyLimit: t.numeric("yearly_limit", {
            precision: 12,
            scale: 2,
        }),
        warningThreshold: t.integer("warning_threshold").notNull().default(80),
        criticalThreshold: t
            .integer("critical_threshold")
            .notNull()
            .default(95),
        currency: t.text("currency").notNull().default("USD"),
        ...timestamps(t),
    }),
    (t) => [uniqueIndex("budgets_user_uidx").on(t.userId)]
);

export const subscriptions = pgTable(
    "subscriptions",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        categoryId: t
            .uuid("category_id")
            .references(() => subscriptionCategories.id, {
                onDelete: "set null",
            }),
        paymentSourceId: t
            .uuid("payment_source_id")
            .references(() => paymentSources.id, { onDelete: "set null" }),
        name: t.text("name").notNull(),
        description: t.text("description"),
        websiteUrl: t.text("website_url"),
        logoUrl: t.text("logo_url"),
        tags: t.jsonb("tags").$type<string[]>().notNull().default([]),
        billingCycle: t
            .text("billing_cycle", { enum: BILLING_CYCLES })
            .notNull(),
        customIntervalDays: t.integer("custom_interval_days"),
        price: t.numeric("price", { precision: 12, scale: 2 }).notNull(),
        trialPrice: t.numeric("trial_price", { precision: 12, scale: 2 }),
        yearlyPrice: t.numeric("yearly_price", { precision: 12, scale: 2 }),
        currency: t.text("currency").notNull().default("USD"),
        taxAmount: t
            .numeric("tax_amount", { precision: 12, scale: 2 })
            .notNull()
            .default("0"),
        discountAmount: t
            .numeric("discount_amount", { precision: 12, scale: 2 })
            .notNull()
            .default("0"),
        startDate: t.timestamp("start_date").notNull(),
        nextRenewalDate: t.timestamp("next_renewal_date").notNull(),
        autoRenew: t.boolean("auto_renew").notNull().default(true),
        isTrial: t.boolean("is_trial").notNull().default(false),
        trialEndDate: t.timestamp("trial_end_date"),
        status: t
            .text("status", { enum: SUBSCRIPTION_STATUSES })
            .notNull()
            .default("active"),
        priority: t
            .text("priority", { enum: SUBSCRIPTION_PRIORITIES })
            .notNull()
            .default("medium"),
        reminderEnabled: t.boolean("reminder_enabled").notNull().default(true),
        reminderDaysBefore: t
            .integer("reminder_days_before")
            .notNull()
            .default(1),
        notes: t.text("notes"),
        lastReminderSentAt: t.timestamp("last_reminder_sent_at"),
        cancelledAt: t.timestamp("cancelled_at"),
        ...timestamps(t),
    }),
    (t) => [
        index("subscriptions_user_idx").on(t.userId),
        index("subscriptions_status_idx").on(t.status),
        index("subscriptions_next_renewal_idx").on(t.nextRenewalDate),
        index("subscriptions_category_idx").on(t.categoryId),
        index("subscriptions_payment_source_idx").on(t.paymentSourceId),
        index("subscriptions_user_status_idx").on(t.userId, t.status),
    ]
);

export const subscriptionActivityLogs = pgTable(
    "subscription_activity_logs",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        subscriptionId: t
            .uuid("subscription_id")
            .references(() => subscriptions.id, { onDelete: "set null" }),
        subscriptionName: t.text("subscription_name").notNull(),
        action: t.text("action", { enum: ACTIVITY_ACTIONS }).notNull(),
        metadata: t
            .jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        createdAt: t.timestamp("created_at").notNull().defaultNow(),
    }),
    (t) => [
        index("subscription_activity_logs_user_idx").on(t.userId),
        index("subscription_activity_logs_subscription_idx").on(
            t.subscriptionId
        ),
        index("subscription_activity_logs_created_idx").on(t.createdAt),
    ]
);

export const subscriptionReminderSends = pgTable(
    "subscription_reminder_sends",
    (t) => ({
        id: t.uuid("id").notNull().primaryKey().defaultRandom(),
        subscriptionId: t
            .uuid("subscription_id")
            .notNull()
            .references(() => subscriptions.id, { onDelete: "cascade" }),
        userId: t
            .uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        reminderType: t
            .text("reminder_type", { enum: REMINDER_TYPES })
            .notNull(),
        forDate: t.timestamp("for_date").notNull(),
        sentAt: t.timestamp("sent_at").notNull().defaultNow(),
        emailSentTo: t.text("email_sent_to").notNull(),
        createdAt: t.timestamp("created_at").notNull().defaultNow(),
    }),
    (t) => [
        uniqueIndex("subscription_reminder_sends_idempotent_uidx").on(
            t.subscriptionId,
            t.reminderType,
            t.forDate
        ),
        index("subscription_reminder_sends_user_idx").on(t.userId),
    ]
);
