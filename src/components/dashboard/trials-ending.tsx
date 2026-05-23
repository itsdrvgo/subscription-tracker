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
import { daysUntil, formatCurrency } from "@/lib/subscription";
import { FullSubscription } from "@/lib/validations";
import Link from "next/link";

interface PageProps {
    items: FullSubscription[] | undefined;
    isLoading: boolean;
}

export function TrialsEnding({ items, isLoading }: PageProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icons.Clock className="size-4 text-blue-300" />
                    Trials ending soon
                </CardTitle>
                <CardDescription>
                    Decide before they convert to paid
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))
                ) : !items?.length ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No trials in progress.
                    </p>
                ) : (
                    items.map((s) => {
                        const days = s.trialEndDate
                            ? daysUntil(s.trialEndDate)
                            : null;
                        return (
                            <Link
                                key={s.id}
                                href={`/subscriptions/${s.id}/edit`}
                                className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {s.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {days === null
                                            ? "—"
                                            : days <= 0
                                              ? "Ends today"
                                              : days === 1
                                                ? "Ends tomorrow"
                                                : `Ends in ${days} days`}
                                    </p>
                                </div>
                                <span className="text-sm font-medium tabular-nums">
                                    {formatCurrency(s.price, s.currency, {
                                        keepDecimals: false,
                                    })}
                                    /mo after
                                </span>
                            </Link>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
