"use client";

import { Icons } from "@/components/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SUBSCRIPTION_STATUSES } from "@/config/const";
import { STATUS_LABELS } from "@/config/subscription";

type Status = (typeof SUBSCRIPTION_STATUSES)[number];

export function StatusFilter({
    value,
    onChange,
}: {
    value: Status | null;
    onChange: (value: Status | undefined) => void;
}) {
    return (
        <Select
            value={value ?? "all"}
            onValueChange={(v) =>
                onChange(v === "all" ? undefined : (v as Status))
            }
        >
            <SelectTrigger className="w-37.5">
                <div className="flex items-center gap-2">
                    <Icons.Sparkles className="size-4" />
                    <SelectValue placeholder="Status">
                        {value ? STATUS_LABELS[value] : "Statuses"}
                    </SelectValue>
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Statuses</SelectItem>
                {SUBSCRIPTION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
