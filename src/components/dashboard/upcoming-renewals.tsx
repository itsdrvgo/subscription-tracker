"use client";

import { RenewalCountdown } from "@/components/subscriptions/renewal-countdown";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/subscription";
import { FullSubscription } from "@/lib/validations";
import Link from "next/link";

interface PageProps {
    items: FullSubscription[] | undefined;
    isLoading: boolean;
}

export function UpcomingRenewals({ items, isLoading }: PageProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming renewals</CardTitle>
                <CardDescription>Next 30 days</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))
                ) : !items?.length ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        Nothing renewing soon.
                    </p>
                ) : (
                    items.map((s) => (
                        <Link
                            key={s.id}
                            href={`/subscriptions/${s.id}/edit`}
                            className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate font-medium">
                                        {s.name}
                                    </p>
                                    {s.category && (
                                        <span className="text-xs text-muted-foreground">
                                            {s.category.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(
                                        s.nextRenewalDate
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <span className="text-sm font-medium tabular-nums">
                                    {formatCurrency(s.price, s.currency, {
                                        keepDecimals: true,
                                    })}
                                </span>
                                <RenewalCountdown date={s.nextRenewalDate} />
                            </div>
                        </Link>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
