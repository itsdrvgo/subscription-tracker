"use client";

import { useSubscription } from "@/lib/rq";
import { ActivityFeed } from "./activity-feed";
import { BudgetCard } from "./budget-card";
import { CategoryBreakdown } from "./category-breakdown";
import { SpendByPaymentSource } from "./highest-cost";
import { SpendingTrendChart } from "./spending-trend-chart";
import { StatsCards } from "./stats-cards";
import { TrialsEnding } from "./trials-ending";
import { UpcomingRenewals } from "./upcoming-renewals";

export function DashboardView() {
    const { useAnalytics } = useSubscription();
    const { data, isPending } = useAnalytics();

    const currency = data?.stats.budget?.currency ?? "USD";

    return (
        <div className="space-y-6">
            <StatsCards
                stats={data?.stats}
                isLoading={isPending}
                currency={currency}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <SpendingTrendChart
                        trend={data?.stats.monthlyTrend}
                        isLoading={isPending}
                        currency={currency}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <UpcomingRenewals
                            items={data?.upcoming}
                            isLoading={isPending}
                        />
                        <TrialsEnding
                            items={data?.trialsEnding}
                            isLoading={isPending}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <BudgetCard
                        budget={data?.stats.budget ?? null}
                        isLoading={isPending}
                    />
                    <CategoryBreakdown
                        breakdown={data?.stats.spendByCategory}
                        isLoading={isPending}
                        currency={currency}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SpendByPaymentSource
                    sources={data?.stats.spendByPaymentSource}
                    isLoading={isPending}
                    currency={currency}
                />
                <ActivityFeed items={data?.activity} isLoading={isPending} />
            </div>
        </div>
    );
}
