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
import { formatCurrency } from "@/lib/utils";
import { SubscriptionStats } from "@/lib/validations";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const config = {
    spend: {
        label: "Spend",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

interface PageProps {
    trend: SubscriptionStats["monthlyTrend"] | undefined;
    isLoading: boolean;
    currency: string;
}

export function SpendingTrendChart({ trend, isLoading, currency }: PageProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle>Monthly spend trend</CardTitle>
                <CardDescription>
                    Effective recurring cost over the last six months
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading || !trend ? (
                    <Skeleton className="aspect-video w-full" />
                ) : trend.every((t) => t.spend === 0) ? (
                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                        No spend recorded yet.
                    </div>
                ) : (
                    <ChartContainer config={config} className="max-h-72 w-full">
                        <AreaChart
                            data={trend}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(v) =>
                                    formatCurrency(v, currency, {
                                        keepDecimals: false,
                                        compact: true,
                                    })
                                }
                                width={60}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        formatter={(value) =>
                                            formatCurrency(
                                                Number(value),
                                                currency,
                                                { keepDecimals: true }
                                            )
                                        }
                                    />
                                }
                            />
                            <defs>
                                <linearGradient
                                    id="spendFill"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-spend)"
                                        stopOpacity={0.4}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-spend)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="spend"
                                type="monotone"
                                fill="url(#spendFill)"
                                stroke="var(--color-spend)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
