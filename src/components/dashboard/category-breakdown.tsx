"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/subscription";
import { SubscriptionStats } from "@/lib/validations";

interface PageProps {
    breakdown: SubscriptionStats["spendByCategory"] | undefined;
    isLoading: boolean;
    currency: string;
}

const PALETTE = [
    "bg-emerald-400",
    "bg-blue-400",
    "bg-violet-400",
    "bg-amber-400",
    "bg-rose-400",
    "bg-cyan-400",
    "bg-pink-400",
    "bg-lime-400",
];

export function CategoryBreakdown({
    breakdown,
    isLoading,
    currency,
}: PageProps) {
    const total = breakdown?.reduce((sum, b) => sum + b.monthlyCost, 0) ?? 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Spend by category</CardTitle>
                <CardDescription>
                    Where your monthly subscription budget goes
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-3 w-full rounded-full" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-6 w-full" />
                        ))}
                    </>
                ) : !breakdown?.length ? (
                    <p className="text-sm text-muted-foreground">
                        No data yet.
                    </p>
                ) : (
                    <>
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                            {breakdown.map((b, i) => (
                                <div
                                    key={b.categoryId ?? "none"}
                                    className={PALETTE[i % PALETTE.length]}
                                    style={{
                                        width:
                                            total > 0
                                                ? `${(b.monthlyCost / total) * 100}%`
                                                : "0%",
                                    }}
                                    title={`${b.categoryName}: ${formatCurrency(b.monthlyCost, currency, { keepDecimals: true })}`}
                                />
                            ))}
                        </div>

                        <ul className="space-y-2">
                            {breakdown.map((b, i) => (
                                <li
                                    key={b.categoryId ?? "none"}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className={`${PALETTE[i % PALETTE.length]} size-2.5 shrink-0 rounded-full`}
                                        />
                                        <span className="truncate">
                                            {b.categoryName}
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            · {b.count}
                                        </span>
                                    </div>

                                    <span className="font-medium tabular-nums">
                                        {formatCurrency(
                                            b.monthlyCost,
                                            currency,
                                            { keepDecimals: true }
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
