import { cn, daysUntil } from "@/lib/utils";

export function RenewalCountdown({
    date,
    className,
    showLabel = true,
}: {
    date: Date | string;
    className?: string;
    showLabel?: boolean;
}) {
    const target = typeof date === "string" ? new Date(date) : date;
    const days = daysUntil(target);

    let label: string;
    let tone = "text-muted-foreground";
    if (days < 0) {
        label = `${Math.abs(days)}d overdue`;
        tone = "text-red-400";
    } else if (days === 0) {
        label = "Renews today";
        tone = "text-amber-300";
    } else if (days === 1) {
        label = "Renews tomorrow";
        tone = "text-amber-300";
    } else if (days <= 7) {
        label = `${days}d`;
        tone = "text-amber-200";
    } else if (days <= 30) {
        label = `${days}d`;
        tone = "text-foreground";
    } else {
        label = `${days}d`;
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                tone,
                className
            )}
            title={target.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })}
        >
            {showLabel ? label : `${days}d`}
        </span>
    );
}
