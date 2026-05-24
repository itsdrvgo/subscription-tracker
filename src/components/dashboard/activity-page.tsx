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
import { ACTIVITY_ACTIONS } from "@/config/const";
import { useSubscription } from "@/lib/rq";
import { convertValueToLabel } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";

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

export function ActivityPage() {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const limit = 20;

    const { useActivity } = useSubscription();
    const { data, isPending } = useActivity({ page, limit });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                    Every action taken on your subscriptions
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {isPending ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))
                ) : !data?.data?.length ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                        No activity yet.
                    </p>
                ) : (
                    <>
                        {data.data.map((item) => {
                            const Icon =
                                Icons[ICON_MAP[item.action]] ?? Icons.Bell;
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 rounded-md border p-3"
                                >
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                        <Icon className="size-4" />
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
                                            {format(
                                                new Date(item.createdAt),
                                                "MMM d, yyyy 'at' h:mm a"
                                            )}{" "}
                                            ·{" "}
                                            {formatDistanceToNow(
                                                new Date(item.createdAt),
                                                { addSuffix: true }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {data.pages > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-xs text-muted-foreground">
                                    Page {page} of {data.pages} · {data.count}{" "}
                                    events
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={page >= data.pages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
