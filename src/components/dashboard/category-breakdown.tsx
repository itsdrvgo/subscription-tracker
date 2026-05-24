"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/subscription";
import { SubscriptionStats } from "@/lib/validations";
import { Cell, Pie, PieChart } from "recharts";

interface PageProps {
    breakdown: SubscriptionStats["spendByCategory"] | undefined;
    isLoading: boolean;
    currency: string;
}

const PALETTE = [
    "var(--chart-1, oklch(0.72 0.18 155))",
    "var(--chart-2, oklch(0.7 0.18 230))",
    "var(--chart-3, oklch(0.72 0.18 290))",
    "var(--chart-4, oklch(0.78 0.16 80))",
    "var(--chart-5, oklch(0.72 0.18 25))",
    "var(--chart-6, oklch(0.74 0.16 200))",
    "var(--chart-7, oklch(0.75 0.18 340))",
    "var(--chart-8, oklch(0.78 0.18 120))",
];

const chartConfig = { monthlyCost: { label: "Monthly" } } satisfies ChartConfig;

export function CategoryBreakdown({
    breakdown,
    isLoading,
    currency,
}: PageProps) {
    const total = breakdown?.reduce((sum, b) => sum + b.monthlyCost, 0) ?? 0;
    const chartData =
        breakdown?.map((b, i) => ({
            name: b.categoryName,
            value: b.monthlyCost,
            count: b.count,
            fill: PALETTE[i % PALETTE.length],
        })) ?? [];

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
                    <div className="flex items-center justify-center">
                        <Skeleton className="h-44 w-44 rounded-full" />
                    </div>
                ) : !breakdown?.length || total <= 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No data yet.
                    </p>
                ) : (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-56 w-full"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            nameKey="name"
                                            formatter={(value, name) => (
                                                <div className="flex w-full items-center justify-between gap-3">
                                                    <span className="truncate text-muted-foreground">
                                                        {name}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        {formatCurrency(
                                                            Number(value),
                                                            currency,
                                                            {
                                                                keepDecimals: true,
                                                            }
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    strokeWidth={2}
                                >
                                    {chartData.map((entry, i) => (
                                        <Cell
                                            key={`cell-${i}`}
                                            fill={entry.fill}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>

                        <ul className="space-y-2">
                            {breakdown.map((b, i) => (
                                <li
                                    key={b.categoryId ?? "none"}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    PALETTE[i % PALETTE.length],
                                            }}
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
