"use client";

import { Icons } from "@/components/icons";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionStats } from "@/lib/validations";

interface PageProps {
    sources: SubscriptionStats["spendByPaymentSource"] | undefined;
    isLoading: boolean;
    currency: string;
}

export function SpendByPaymentSource({
    sources,
    isLoading,
    currency,
}: PageProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icons.CreditCard className="size-4" />
                    Spend by payment source
                </CardTitle>
                <CardDescription>
                    How costs distribute across your cards & accounts
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))
                ) : !sources?.length ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No payment sources used yet.
                    </p>
                ) : (
                    sources.map((src) => (
                        <div
                            key={src.paymentSourceId ?? "none"}
                            className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {src.paymentSourceName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {src.count} subscription
                                    {src.count === 1 ? "" : "s"}
                                </p>
                            </div>
                            <span className="font-medium tabular-nums">
                                {formatCurrency(src.monthlyCost, currency, {
                                    keepDecimals: true,
                                })}
                                /mo
                            </span>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
