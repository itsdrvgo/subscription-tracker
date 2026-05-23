import { defineRelations } from "drizzle-orm";
import * as schema from "./schemas";

export const relations = defineRelations(schema, (r) => ({
    users: {
        subscriptions: r.many.subscriptions(),
        categories: r.many.subscriptionCategories(),
        paymentSources: r.many.paymentSources(),
        budget: r.one.budgets(),
        activityLogs: r.many.subscriptionActivityLogs(),
    },
    subscriptionCategories: {
        user: r.one.users({
            from: r.subscriptionCategories.userId,
            to: r.users.id,
        }),
        subscriptions: r.many.subscriptions(),
    },
    paymentSources: {
        user: r.one.users({
            from: r.paymentSources.userId,
            to: r.users.id,
        }),
        subscriptions: r.many.subscriptions(),
    },
    budgets: {
        user: r.one.users({
            from: r.budgets.userId,
            to: r.users.id,
        }),
    },
    subscriptions: {
        user: r.one.users({
            from: r.subscriptions.userId,
            to: r.users.id,
        }),
        category: r.one.subscriptionCategories({
            from: r.subscriptions.categoryId,
            to: r.subscriptionCategories.id,
            optional: true,
        }),
        paymentSource: r.one.paymentSources({
            from: r.subscriptions.paymentSourceId,
            to: r.paymentSources.id,
            optional: true,
        }),
        activityLogs: r.many.subscriptionActivityLogs(),
        reminderSends: r.many.subscriptionReminderSends(),
    },
    subscriptionActivityLogs: {
        user: r.one.users({
            from: r.subscriptionActivityLogs.userId,
            to: r.users.id,
        }),
        subscription: r.one.subscriptions({
            from: r.subscriptionActivityLogs.subscriptionId,
            to: r.subscriptions.id,
            optional: true,
        }),
    },
    subscriptionReminderSends: {
        subscription: r.one.subscriptions({
            from: r.subscriptionReminderSends.subscriptionId,
            to: r.subscriptions.id,
        }),
        user: r.one.users({
            from: r.subscriptionReminderSends.userId,
            to: r.users.id,
        }),
    },
}));
