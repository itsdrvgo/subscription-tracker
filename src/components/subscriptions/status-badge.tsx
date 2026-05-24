import { Badge } from "@/components/ui/badge";
import { SUBSCRIPTION_STATUSES } from "@/config/const";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/config/subscription";
import { cn } from "@/lib/utils";

type Status = (typeof SUBSCRIPTION_STATUSES)[number];

const STATUS_CLASS: Record<Status, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    inactive: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
    paused: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    trial: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    expired: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    pending: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

export function SubscriptionStatusBadge({
    status,
    className,
}: {
    status: Status;
    className?: string;
}) {
    return (
        <Badge
            variant={STATUS_VARIANTS[status]}
            className={cn(
                "border whitespace-nowrap",
                STATUS_CLASS[status],
                className
            )}
        >
            {STATUS_LABELS[status]}
        </Badge>
    );
}
