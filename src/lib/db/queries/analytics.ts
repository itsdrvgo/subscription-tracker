import { buildCurrencyConverter } from "@/lib/currency/exchange";
import { parseNumeric } from "@/lib/utils";
import { FullSubscription, SubscriptionStats } from "@/lib/validations";
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

        const targetCurrency = budget?.currency ?? "USD";
        const convert = await buildCurrencyConverter(targetCurrency);

        const now = new Date();
        const in7 = addDays(now, 7);
        const in30 = addDays(now, 30);

        // A subscription stops counting once its endDate has passed (e.g. an
        // EMI fully paid off, an RD that matured). Trials and active count.
        const active = subs.filter(
            (s) =>
                (s.status === "active" || s.status === "trial") &&
                (!s.endDate || s.endDate >= now)
        );

        // Split active by kind: savings flow back to the user at maturity so
        // they don't belong in "monthly spend" — we report them separately.
        const spendable = active.filter((s) => s.kind !== "savings");
        const savings = active.filter((s) => s.kind === "savings");

        const totalActive = subs.filter((s) => s.status === "active").length;
        const totalInactive = subs.filter(
            (s) => s.status === "inactive"
        ).length;
        const totalTrial = subs.filter((s) => s.status === "trial").length;
        const totalCancelled = subs.filter(
            (s) => s.status === "cancelled"
        ).length;

        // Convert each subscription's native-currency monthly cost to the
        // budget/target currency so aggregates are comparable across currencies.
        const monthlyByActive = await Promise.all(
            spendable.map(async (s) => ({
                sub: s,
                monthly: await convert(
                    computeMonthlyCostForSubscription(s, now),
                    s.currency
                ),
                yearly: await convert(
                    computeYearlyCostForSubscription(s, now),
                    s.currency
                ),
            }))
        );

        const monthlySpend = monthlyByActive.reduce(
            (sum, x) => sum + x.monthly,
            0
        );
        const yearlySpend = monthlyByActive.reduce(
            (sum, x) => sum + x.yearly,
            0
        );

        const savingsMonthly = await Promise.all(
            savings.map((s) =>
                convert(
                    computeMonthlyCostForSubscription(s, now),
                    s.currency
                )
            )
        );
        const monthlyCommittedSavings = savingsMonthly.reduce(
            (sum, n) => sum + n,
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

        const averageSubscriptionCost = spendable.length
            ? monthlySpend / spendable.length
            : 0;

        const highestCostSubscription = monthlyByActive.length
            ? (monthlyByActive
                  .map((x) => ({
                      id: x.sub.id,
                      name: x.sub.name,
                      monthlyCost: x.monthly,
                  }))
                  .sort((a, b) => b.monthlyCost - a.monthlyCost)[0] ?? null)
            : null;

        // Spend by category — values are already in budget currency.
        const byCategoryMap = new Map<
            string | "none",
            { categoryName: string; monthlyCost: number; count: number }
        >();
        monthlyByActive.forEach(({ sub: s, monthly }) => {
            const key = s.categoryId ?? "none";
            const name = s.category?.name ?? "Uncategorized";
            const existing = byCategoryMap.get(key);
            if (existing) {
                existing.monthlyCost += monthly;
                existing.count += 1;
            } else {
                byCategoryMap.set(key, {
                    categoryName: name,
                    monthlyCost: monthly,
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

        // Spend by payment source — also in budget currency.
        const bySourceMap = new Map<
            string | "none",
            { paymentSourceName: string; monthlyCost: number; count: number }
        >();
        monthlyByActive.forEach(({ sub: s, monthly }) => {
            const key = s.paymentSourceId ?? "none";
            const name = s.paymentSource?.name ?? "Unspecified";
            const existing = bySourceMap.get(key);
            if (existing) {
                existing.monthlyCost += monthly;
                existing.count += 1;
            } else {
                bySourceMap.set(key, {
                    paymentSourceName: name,
                    monthlyCost: monthly,
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

        const monthlyTrend: SubscriptionStats["monthlyTrend"] = [];
        for (let i = 5; i >= 0; i--) {
            const month = subMonths(now, i);
            const start = startOfMonth(month);
            const end = endOfMonth(month);
            const eligible = subs.filter((s: FullSubscription) => {
                const startedBeforeEnd = s.startDate <= end;
                const stillActiveInMonth =
                    !s.cancelledAt || s.cancelledAt >= start;
                const notYetEnded = !s.endDate || s.endDate >= start;
                const validStatus =
                    s.status !== "expired" &&
                    s.status !== "pending" &&
                    s.status !== "inactive";
                const isSpendable = s.kind !== "savings";
                return (
                    startedBeforeEnd &&
                    stillActiveInMonth &&
                    notYetEnded &&
                    validStatus &&
                    isSpendable
                );
            });
            const converted = await Promise.all(
                eligible.map((s) =>
                    convert(
                        computeMonthlyCostForSubscription(s, end),
                        s.currency
                    )
                )
            );
            const spend = converted.reduce((sum, n) => sum + n, 0);
            monthlyTrend.push({ month: format(month), spend });
        }

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
            monthlyCommittedSavings,
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
                    s.nextRenewalDate <= in30 &&
                    (!s.endDate || s.endDate >= now)
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
