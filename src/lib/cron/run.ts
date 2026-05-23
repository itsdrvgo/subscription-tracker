import { db } from "@/lib/db/client";
import { queries } from "@/lib/db/queries";
import {
    computeMonthlyCostForSubscription,
    computeYearlyCostForSubscription,
} from "@/lib/db/queries/subscription";
import { subscriptions } from "@/lib/db/schemas";
import {
    budgetAlertEmail,
    renewalReminderEmail,
    sendEmail,
    trialEndingEmail,
} from "@/lib/email";
import {
    daysUntil,
    parseNumeric,
    rollRenewalForward,
    startOfDay,
} from "@/lib/subscription";
import { getAbsoluteURL } from "@/lib/utils";
import { FullSubscription, SafeUser } from "@/lib/validations";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";

export type CronReport = {
    renewalsAdvanced: number;
    trialsExpired: number;
    renewalRemindersSent: number;
    renewalRemindersSkipped: number;
    trialRemindersSent: number;
    budgetAlertsSent: number;
    errors: string[];
};

const TRIAL_REMINDER_LEAD_DAYS = 3;

function dashboardUrl(): string {
    return getAbsoluteURL("/dashboard");
}

async function loadUsersByIds(ids: string[]): Promise<Map<string, SafeUser>> {
    if (!ids.length) return new Map();
    const unique = Array.from(new Set(ids));
    const users = await queries.user.scanByIds({ ids: unique });
    return new Map(users.map((u) => [u.id, u]));
}

async function advanceDueRenewals(report: CronReport, now: Date) {
    const due = await queries.subscription.findDueForRenewal({ now });
    if (!due.length) return;

    const userMap = await loadUsersByIds(due.map((s) => s.userId));

    for (const s of due) {
        try {
            const newDate = rollRenewalForward({
                from: s.nextRenewalDate,
                billingCycle: s.billingCycle,
                customIntervalDays: s.customIntervalDays ?? null,
                now,
            });
            await queries.subscription.rollRenewal({
                id: s.id,
                nextRenewalDate: newDate,
            });
            await queries.activityLog.add({
                userId: s.userId,
                subscriptionId: s.id,
                subscriptionName: s.name,
                action: "renewed",
                metadata: {
                    previous: s.nextRenewalDate.toISOString(),
                    next: newDate.toISOString(),
                },
            });
            report.renewalsAdvanced++;
            // userMap is loaded but unused here; renewals don't email — this
            // is a no-op silent advance. Reminders are handled separately.
            void userMap;
        } catch (err) {
            report.errors.push(
                `advance renewal ${s.id}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

async function expireFinishedTrials(report: CronReport, now: Date) {
    const trials = await queries.subscription.findTrialsEndingBy({ now });
    if (!trials.length) return;

    for (const t of trials) {
        try {
            await db
                .update(subscriptions)
                .set({
                    status: "expired",
                    isTrial: false,
                    updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, t.id));
            await queries.activityLog.add({
                userId: t.userId,
                subscriptionId: t.id,
                subscriptionName: t.name,
                action: "trial_ended",
                metadata: { trialEndDate: t.trialEndDate?.toISOString() },
            });
            report.trialsExpired++;
        } catch (err) {
            report.errors.push(
                `expire trial ${t.id}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

async function sendRenewalReminders(report: CronReport, now: Date) {
    // Look 60 days ahead to cover the maximum reminder window
    const horizon = addDays(now, 60);
    const candidates = await queries.subscription.findRenewingBetween({
        from: now,
        to: horizon,
    });

    if (!candidates.length) return;

    const userMap = await loadUsersByIds(candidates.map((s) => s.userId));

    for (const s of candidates) {
        try {
            const user = userMap.get(s.userId);
            if (!user) continue;
            if (!s.reminderEnabled) continue;

            const days = daysUntil(s.nextRenewalDate, now);
            // Send when we're inside the configured lead window. Allows
            // catching up on misses if the cron didn't run on the exact day.
            if (days < 0 || days > s.reminderDaysBefore) continue;

            const forDateKey = startOfDay(s.nextRenewalDate);
            const already = await queries.subscription.hasReminderBeenSent({
                subscriptionId: s.id,
                reminderType: "renewal",
                forDate: forDateKey,
            });
            if (already) {
                report.renewalRemindersSkipped++;
                continue;
            }

            const { subject, html, text } = await renewalReminderEmail({
                userName: user.firstName,
                subscription: s,
                daysUntilRenewal: days,
                dashboardUrl: dashboardUrl(),
            });

            const result = await sendEmail({
                to: user.email,
                subject,
                html,
                text,
            });

            if (result.ok) {
                await queries.subscription.recordReminderSent({
                    subscriptionId: s.id,
                    userId: s.userId,
                    reminderType: "renewal",
                    forDate: forDateKey,
                    emailSentTo: user.email,
                });
                await queries.subscription.stampReminderSent({
                    id: s.id,
                    at: now,
                });
                await queries.activityLog.add({
                    userId: s.userId,
                    subscriptionId: s.id,
                    subscriptionName: s.name,
                    action: "reminder_sent",
                    metadata: { type: "renewal", daysUntil: days },
                });
                report.renewalRemindersSent++;
            } else {
                report.errors.push(
                    `renewal reminder ${s.id}: ${result.error ?? "unknown"}`
                );
            }
        } catch (err) {
            report.errors.push(
                `renewal reminder ${s.id}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

async function sendTrialEndingReminders(report: CronReport, now: Date) {
    const horizon = addDays(now, TRIAL_REMINDER_LEAD_DAYS);
    const candidates = await queries.subscription.findTrialsEndingBetween({
        from: now,
        to: horizon,
    });

    if (!candidates.length) return;
    const userMap = await loadUsersByIds(candidates.map((s) => s.userId));

    for (const s of candidates) {
        try {
            const user = userMap.get(s.userId);
            if (!user || !s.trialEndDate) continue;

            const days = daysUntil(s.trialEndDate, now);
            if (days < 0 || days > TRIAL_REMINDER_LEAD_DAYS) continue;

            const forDateKey = startOfDay(s.trialEndDate);
            const already = await queries.subscription.hasReminderBeenSent({
                subscriptionId: s.id,
                reminderType: "trial_ending",
                forDate: forDateKey,
            });
            if (already) continue;

            const { subject, html, text } = await trialEndingEmail({
                userName: user.firstName,
                subscription: s,
                daysUntilEnd: days,
                dashboardUrl: dashboardUrl(),
            });

            const result = await sendEmail({
                to: user.email,
                subject,
                html,
                text,
            });

            if (result.ok) {
                await queries.subscription.recordReminderSent({
                    subscriptionId: s.id,
                    userId: s.userId,
                    reminderType: "trial_ending",
                    forDate: forDateKey,
                    emailSentTo: user.email,
                });
                await queries.activityLog.add({
                    userId: s.userId,
                    subscriptionId: s.id,
                    subscriptionName: s.name,
                    action: "reminder_sent",
                    metadata: { type: "trial_ending", daysUntil: days },
                });
                report.trialRemindersSent++;
            } else {
                report.errors.push(
                    `trial reminder ${s.id}: ${result.error ?? "unknown"}`
                );
            }
        } catch (err) {
            report.errors.push(
                `trial reminder ${s.id}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

async function sendBudgetAlerts(report: CronReport, now: Date) {
    // Iterate budgets and compute usage per user
    const allBudgets = await db.query.budgets.findMany({});
    if (!allBudgets.length) return;

    const userMap = await loadUsersByIds(allBudgets.map((b) => b.userId));

    for (const b of allBudgets) {
        try {
            const user = userMap.get(b.userId);
            if (!user) continue;

            const subs = (await queries.subscription.forAnalytics({
                userId: b.userId,
            })) as FullSubscription[];

            const active = subs.filter(
                (s) => s.status === "active" || s.status === "trial"
            );

            const monthly = active.reduce(
                (sum, s) => sum + computeMonthlyCostForSubscription(s),
                0
            );
            const yearly = active.reduce(
                (sum, s) => sum + computeYearlyCostForSubscription(s),
                0
            );

            const monthlyLimit = parseNumeric(b.monthlyLimit);
            const yearlyLimit = parseNumeric(b.yearlyLimit);

            const checks: {
                period: "monthly" | "yearly";
                limit: number;
                usage: number;
                percent: number;
            }[] = [];

            if (monthlyLimit > 0)
                checks.push({
                    period: "monthly",
                    limit: monthlyLimit,
                    usage: monthly,
                    percent: (monthly / monthlyLimit) * 100,
                });
            if (yearlyLimit > 0)
                checks.push({
                    period: "yearly",
                    limit: yearlyLimit,
                    usage: yearly,
                    percent: (yearly / yearlyLimit) * 100,
                });

            for (const check of checks) {
                const severity: "warning" | "critical" | "exceeded" | null =
                    check.percent >= 100
                        ? "exceeded"
                        : check.percent >= b.criticalThreshold
                          ? "critical"
                          : check.percent >= b.warningThreshold
                            ? "warning"
                            : null;

                if (!severity) continue;

                const reminderType =
                    severity === "exceeded"
                        ? "budget_exceeded"
                        : severity === "critical"
                          ? "budget_critical"
                          : "budget_warning";

                // Budget alerts are keyed by the start of the period so we
                // don't spam the same alert every cron run.
                const forDateKey =
                    check.period === "monthly"
                        ? new Date(now.getFullYear(), now.getMonth(), 1)
                        : new Date(now.getFullYear(), 0, 1);

                // We piggy-back on the reminder_sends table; since it has a
                // unique index on (subscription_id, reminder_type, for_date)
                // and budget alerts have no subscription, we use a sentinel
                // subscription id derived from the budget. Skip if no subs.
                const sentinelSubscriptionId = active[0]?.id;
                if (!sentinelSubscriptionId) continue;

                const already = await queries.subscription.hasReminderBeenSent({
                    subscriptionId: sentinelSubscriptionId,
                    reminderType,
                    forDate: forDateKey,
                });
                if (already) continue;

                const { subject, html, text } = await budgetAlertEmail({
                    userName: user.firstName,
                    severity,
                    period: check.period,
                    limit: check.limit,
                    usage: check.usage,
                    percent: check.percent,
                    currency: b.currency,
                    dashboardUrl: dashboardUrl(),
                });

                const result = await sendEmail({
                    to: user.email,
                    subject,
                    html,
                    text,
                });

                if (result.ok) {
                    await queries.subscription.recordReminderSent({
                        subscriptionId: sentinelSubscriptionId,
                        userId: b.userId,
                        reminderType,
                        forDate: forDateKey,
                        emailSentTo: user.email,
                    });
                    report.budgetAlertsSent++;
                } else {
                    report.errors.push(
                        `budget alert ${b.userId} ${check.period}: ${result.error ?? "unknown"}`
                    );
                }
            }
        } catch (err) {
            report.errors.push(
                `budget alert ${b.userId}: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    }
}

export async function runRenewalCron({
    now = new Date(),
}: { now?: Date } = {}): Promise<CronReport> {
    const report: CronReport = {
        renewalsAdvanced: 0,
        trialsExpired: 0,
        renewalRemindersSent: 0,
        renewalRemindersSkipped: 0,
        trialRemindersSent: 0,
        budgetAlertsSent: 0,
        errors: [],
    };

    // Order matters: send reminders before rolling renewals so the user
    // gets notified about the upcoming charge even on the day-of run.
    await sendRenewalReminders(report, now);
    await sendTrialEndingReminders(report, now);
    await sendBudgetAlerts(report, now);
    await advanceDueRenewals(report, now);
    await expireFinishedTrials(report, now);

    return report;
}
