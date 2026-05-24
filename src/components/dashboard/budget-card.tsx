"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SubscriptionStats } from "@/lib/validations";
import Link from "next/link";

interface PageProps {
    budget: SubscriptionStats["budget"];
    isLoading: boolean;
}

const STATUS_TONE: Record<
    "safe" | "warning" | "critical" | "exceeded",
    { ring: string; bar: string; label: string; icon: string }
> = {
    safe: {
        ring: "ring-emerald-500/40",
        bar: "bg-emerald-500",
        label: "On track",
        icon: "text-emerald-300",
    },
    warning: {
        ring: "ring-amber-500/40",
        bar: "bg-amber-500",
        label: "Watch budget",
        icon: "text-amber-300",
    },
    critical: {
        ring: "ring-orange-500/40",
        bar: "bg-orange-500",
        label: "Critical",
        icon: "text-orange-300",
    },
    exceeded: {
        ring: "ring-red-500/40",
        bar: "bg-red-500",
        label: "Over budget",
        icon: "text-red-300",
    },
};

export function BudgetCard({ budget, isLoading }: PageProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!budget) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Icons.PiggyBank className="size-4" />
                        Budget
                    </CardTitle>
                    <CardDescription>
                        Set a monthly limit to track spending against goals
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/billing/budget">
                            <Icons.Plus className="size-4" />
                            Configure budget
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const tone = STATUS_TONE[budget.status];

    return (
        <Card className={cn("ring-1", tone.ring)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icons.PiggyBank className={cn("size-4", tone.icon)} />
                    Budget
                </CardTitle>
                <CardDescription>{tone.label}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {budget.monthlyLimit !== null && (
                    <BudgetRow
                        label="Monthly"
                        usage={budget.monthlyUsage}
                        limit={budget.monthlyLimit}
                        percent={budget.monthlyPercent}
                        currency={budget.currency}
                        toneBar={tone.bar}
                    />
                )}
                {budget.yearlyLimit !== null && (
                    <BudgetRow
                        label="Yearly"
                        usage={budget.yearlyUsage}
                        limit={budget.yearlyLimit}
                        percent={budget.yearlyPercent}
                        currency={budget.currency}
                        toneBar={tone.bar}
                    />
                )}

                <div className="flex items-center justify-end">
                    <Button asChild size="sm" variant="ghost">
                        <Link href="/billing/budget">
                            Edit budget
                            <Icons.ArrowRight className="size-3" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function BudgetRow({
    label,
    usage,
    limit,
    percent,
    currency,
    toneBar,
}: {
    label: string;
    usage: number;
    limit: number;
    percent: number;
    currency: string;
    toneBar: string;
}) {
    const capped = Math.min(percent, 100);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">
                    {formatCurrency(usage, currency, { keepDecimals: false })} /{" "}
                    {formatCurrency(limit, currency, { keepDecimals: false })}
                </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        toneBar
                    )}
                    style={{ width: `${capped}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {percent.toFixed(0)}% used
            </p>
        </div>
    );
}
