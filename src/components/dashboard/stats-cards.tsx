"use client";

import { Icons } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SubscriptionStats } from "@/lib/validations";

interface PageProps {
    stats: SubscriptionStats | undefined;
    isLoading: boolean;
    currency: string;
}

export function StatsCards({ stats, isLoading, currency }: PageProps) {
    const items = [
        {
            label: "Active subscriptions",
            value: stats ? stats.totalActive.toString() : null,
            sub:
                stats &&
                `${stats.totalTrial} on trial · ${stats.totalCancelled} cancelled`,
            icon: Icons.Sparkles,
            tone: "text-emerald-300",
        },
        {
            label: "Monthly spend",
            value: stats
                ? formatCurrency(stats.monthlySpend, currency, {
                      keepDecimals: false,
                  })
                : null,
            sub:
                stats &&
                `Avg ${formatCurrency(stats.averageSubscriptionCost, currency, { keepDecimals: true })}/sub`,
            icon: Icons.DollarSign,
            tone: "text-amber-300",
        },
        {
            label: "Yearly projection",
            value: stats
                ? formatCurrency(stats.yearlyProjection, currency, {
                      keepDecimals: false,
                  })
                : null,
            sub: "Based on current cycles",
            icon: Icons.TrendingUp,
            tone: "text-violet-300",
        },
        {
            label: "Upcoming renewals",
            value: stats ? stats.upcomingRenewals7Days.toString() : null,
            sub:
                stats && `Next 7 days · ${stats.upcomingRenewals30Days} in 30d`,
            icon: Icons.Calendar,
            tone: "text-blue-300",
        },
    ];

    // Only surface the savings card when it actually carries a value, so
    // users without PPF/RD-style entries don't see a noisy zero.
    if (stats && stats.monthlyCommittedSavings > 0) {
        items.push({
            label: "Committed savings",
            value: formatCurrency(stats.monthlyCommittedSavings, currency, {
                keepDecimals: false,
            }),
            sub: "Monthly debits returning at maturity",
            icon: Icons.PiggyBank,
            tone: "text-emerald-300",
        });
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Card key={item.label} className="overflow-hidden">
                        <CardContent className="space-y-3 p-5">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {item.label}
                                </p>
                                <Icon className={cn("size-4", item.tone)} />
                            </div>
                            {isLoading || !item.value ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                <p className="text-3xl font-bold tracking-tight">
                                    {item.value}
                                </p>
                            )}
                            {isLoading ? (
                                <Skeleton className="h-3 w-40" />
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    {item.sub}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
