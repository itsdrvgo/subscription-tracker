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

            {/*
              Two independent vertical stacks instead of a row-based grid.
              Each column lets its cards keep their natural height, so a
              short card next to a tall one doesn't leave a yawning gap.
            */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-1 flex-col gap-6 lg:basis-2/3">
                    <SpendingTrendChart
                        trend={data?.stats.monthlyTrend}
                        isLoading={isPending}
                        currency={currency}
                    />
                    <CategoryBreakdown
                        breakdown={data?.stats.spendByCategory}
                        isLoading={isPending}
                        currency={currency}
                    />
                    <SpendByPaymentSource
                        sources={data?.stats.spendByPaymentSource}
                        isLoading={isPending}
                        currency={currency}
                    />
                </div>

                <div className="flex flex-1 flex-col gap-6 lg:basis-1/3">
                    <BudgetCard
                        budget={data?.stats.budget ?? null}
                        isLoading={isPending}
                    />
                    <UpcomingRenewals
                        items={data?.upcoming}
                        isLoading={isPending}
                    />
                    <TrialsEnding
                        items={data?.trialsEnding}
                        isLoading={isPending}
                    />
                    <ActivityFeed items={data?.activity} isLoading={isPending} />
                </div>
            </div>
        </div>
    );
}
