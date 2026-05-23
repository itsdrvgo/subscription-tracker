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
import { ACTIVITY_ACTIONS } from "@/lib/db/schemas";
import { convertValueToLabel } from "@/lib/utils";
import { SubscriptionActivityLog } from "@/lib/validations";
import { formatDistanceToNow } from "date-fns";

type Action = (typeof ACTIVITY_ACTIONS)[number];

const ICON_MAP: Record<Action, keyof typeof Icons> = {
    created: "Plus",
    updated: "Edit",
    deleted: "Trash",
    renewed: "RefreshCw",
    cancelled: "XCircle",
    paused: "Pause",
    resumed: "Play",
    trial_ended: "Clock",
    reminder_sent: "Bell",
    status_changed: "ArrowRight",
    price_changed: "DollarSign",
};

interface PageProps {
    items: SubscriptionActivityLog[] | undefined;
    isLoading: boolean;
}

export function ActivityFeed({ items, isLoading }: PageProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>
                    Latest events across your subscriptions
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))
                ) : !items?.length ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No activity yet.
                    </p>
                ) : (
                    items.map((item) => {
                        const Icon = Icons[ICON_MAP[item.action]] ?? Icons.Bell;
                        return (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 rounded-md border p-3"
                            >
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <Icon className="size-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium">
                                            {item.subscriptionName}
                                        </span>{" "}
                                        <span className="text-muted-foreground">
                                            {convertValueToLabel(
                                                item.action
                                            ).toLowerCase()}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                            new Date(item.createdAt),
                                            { addSuffix: true }
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
