import { parseNumeric } from "@/lib/subscription";
import { SubscriptionStats } from "@/lib/validations";
import { addDays, subMonths } from "date-fns";
import { queries } from "./index";
import {
    computeMonthlyCostForSubscription,
    computeYearlyCostForSubscription,
} from "./subscription";

function format(date: Date): string {
    return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function startOfMonth(d: Date) {
    const x = new Date(d);
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfMonth(d: Date) {
    const x = startOfMonth(d);
    x.setMonth(x.getMonth() + 1);
    x.setMilliseconds(-1);
    return x;
}

class AnalyticsQuery {
    async getStats({ userId }: { userId: string }): Promise<SubscriptionStats> {
        const [subs, budget] = await Promise.all([
            queries.subscription.forAnalytics({ userId }),
            queries.budget.get({ userId }),
        ]);

        const now = new Date();
        const in7 = addDays(now, 7);
        const in30 = addDays(now, 30);

        const active = subs.filter(
            (s) => s.status === "active" || s.status === "trial"
        );

        const totalActive = subs.filter((s) => s.status === "active").length;
        const totalInactive = subs.filter(
            (s) => s.status === "inactive"
        ).length;
        const totalTrial = subs.filter((s) => s.status === "trial").length;
        const totalCancelled = subs.filter(
            (s) => s.status === "cancelled"
        ).length;

        const monthlySpend = active.reduce(
            (sum, s) => sum + computeMonthlyCostForSubscription(s),
            0
        );
        const yearlySpend = active.reduce(
            (sum, s) => sum + computeYearlyCostForSubscription(s),
            0
        );

        const upcomingRenewals7Days = active.filter(
            (s) => s.nextRenewalDate >= now && s.nextRenewalDate <= in7
        ).length;
        const upcomingRenewals30Days = active.filter(
            (s) => s.nextRenewalDate >= now && s.nextRenewalDate <= in30
        ).length;

        const trialsEndingSoon = subs.filter(
            (s) =>
                s.status === "trial" &&
                s.trialEndDate !== null &&
                s.trialEndDate !== undefined &&
                s.trialEndDate >= now &&
                s.trialEndDate <= in7
        ).length;

        const averageSubscriptionCost = active.length
            ? monthlySpend / active.length
            : 0;

        const highestCostSubscription = active.length
            ? (active
                  .map((s) => ({
                      id: s.id,
                      name: s.name,
                      monthlyCost: computeMonthlyCostForSubscription(s),
                  }))
                  .sort((a, b) => b.monthlyCost - a.monthlyCost)[0] ?? null)
            : null;

        // Spend by category
        const byCategoryMap = new Map<
            string | "none",
            { categoryName: string; monthlyCost: number; count: number }
        >();
        active.forEach((s) => {
            const key = s.categoryId ?? "none";
            const name = s.category?.name ?? "Uncategorized";
            const cost = computeMonthlyCostForSubscription(s);
            const existing = byCategoryMap.get(key);
            if (existing) {
                existing.monthlyCost += cost;
                existing.count += 1;
            } else {
                byCategoryMap.set(key, {
                    categoryName: name,
                    monthlyCost: cost,
                    count: 1,
                });
            }
        });

        const spendByCategory = Array.from(byCategoryMap.entries())
            .map(([key, v]) => ({
                categoryId: key === "none" ? null : key,
                categoryName: v.categoryName,
                monthlyCost: v.monthlyCost,
                count: v.count,
            }))
            .sort((a, b) => b.monthlyCost - a.monthlyCost);

        // Spend by payment source
        const bySourceMap = new Map<
            string | "none",
            { paymentSourceName: string; monthlyCost: number; count: number }
        >();
        active.forEach((s) => {
            const key = s.paymentSourceId ?? "none";
            const name = s.paymentSource?.name ?? "Unspecified";
            const cost = computeMonthlyCostForSubscription(s);
            const existing = bySourceMap.get(key);
            if (existing) {
                existing.monthlyCost += cost;
                existing.count += 1;
            } else {
                bySourceMap.set(key, {
                    paymentSourceName: name,
                    monthlyCost: cost,
                    count: 1,
                });
            }
        });

        const spendByPaymentSource = Array.from(bySourceMap.entries())
            .map(([key, v]) => ({
                paymentSourceId: key === "none" ? null : key,
                paymentSourceName: v.paymentSourceName,
                monthlyCost: v.monthlyCost,
                count: v.count,
            }))
            .sort((a, b) => b.monthlyCost - a.monthlyCost);

        // Monthly trend: for each of last 6 months, sum monthly cost of subs
        // that were active during that month (startDate <= end of month AND
        // (cancelledAt is null OR cancelledAt >= start of month) AND status
        // not in expired/pending).
        const monthlyTrend: SubscriptionStats["monthlyTrend"] = [];
        for (let i = 5; i >= 0; i--) {
            const month = subMonths(now, i);
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            const eligible = subs.filter((s) => {
                const startedBeforeEnd = s.startDate <= end;
                const stillActiveInMonth =
                    !s.cancelledAt || s.cancelledAt >= start;
                const validStatus =
                    s.status !== "expired" &&
                    s.status !== "pending" &&
                    s.status !== "inactive";
                return startedBeforeEnd && stillActiveInMonth && validStatus;
            });
            const spend = eligible.reduce(
                (sum, s) => sum + computeMonthlyCostForSubscription(s),
                0
            );
            monthlyTrend.push({ month: format(month), spend });
        }

        // Budget rollup
        let budgetStatsOut: SubscriptionStats["budget"] = null;
        if (budget) {
            const monthlyLimit = budget.monthlyLimit
                ? parseNumeric(budget.monthlyLimit)
                : null;
            const yearlyLimit = budget.yearlyLimit
                ? parseNumeric(budget.yearlyLimit)
                : null;
            const monthlyPercent =
                monthlyLimit && monthlyLimit > 0
                    ? (monthlySpend / monthlyLimit) * 100
                    : 0;
            const yearlyPercent =
                yearlyLimit && yearlyLimit > 0
                    ? (yearlySpend / yearlyLimit) * 100
                    : 0;
            const maxPercent = Math.max(monthlyPercent, yearlyPercent);
            const status: SubscriptionStats["budget"] extends infer X
                ? X extends { status: infer S }
                    ? S
                    : never
                : never =
                maxPercent >= 100
                    ? "exceeded"
                    : maxPercent >= budget.criticalThreshold
                      ? "critical"
                      : maxPercent >= budget.warningThreshold
                        ? "warning"
                        : "safe";

            budgetStatsOut = {
                monthlyLimit,
                yearlyLimit,
                monthlyUsage: monthlySpend,
                yearlyUsage: yearlySpend,
                monthlyPercent,
                yearlyPercent,
                warningThreshold: budget.warningThreshold,
                criticalThreshold: budget.criticalThreshold,
                currency: budget.currency,
                status,
            };
        }

        return {
            totalActive,
            totalInactive,
            totalTrial,
            totalCancelled,
            monthlySpend,
            yearlySpend,
            yearlyProjection: yearlySpend,
            upcomingRenewals7Days,
            upcomingRenewals30Days,
            trialsEndingSoon,
            averageSubscriptionCost,
            highestCostSubscription,
            spendByCategory,
            spendByPaymentSource,
            monthlyTrend,
            budget: budgetStatsOut,
        };
    }

    /**
     * Compact dashboard payload: stats plus upcoming/recent lists.
     */
    async getDashboard({ userId }: { userId: string }) {
        const [stats, allSubs, activity] = await Promise.all([
            this.getStats({ userId }),
            queries.subscription.forAnalytics({ userId }),
            queries.activityLog.recent({ userId, limit: 10 }),
        ]);

        const now = new Date();
        const in30 = addDays(now, 30);

        const upcoming = allSubs
            .filter(
                (s) =>
                    (s.status === "active" || s.status === "trial") &&
                    s.nextRenewalDate >= now &&
                    s.nextRenewalDate <= in30
            )
            .sort(
                (a, b) =>
                    a.nextRenewalDate.getTime() - b.nextRenewalDate.getTime()
            )
            .slice(0, 8);

        const trialsEnding = allSubs
            .filter(
                (s) =>
                    s.status === "trial" &&
                    s.trialEndDate &&
                    s.trialEndDate >= now
            )
            .sort(
                (a, b) =>
                    (a.trialEndDate?.getTime() ?? 0) -
                    (b.trialEndDate?.getTime() ?? 0)
            )
            .slice(0, 5);

        const recentlyAdded = [...allSubs]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        return {
            stats,
            upcoming,
            trialsEnding,
            recentlyAdded,
            activity,
        };
    }
}

export const analyticsQueries = new AnalyticsQuery();
