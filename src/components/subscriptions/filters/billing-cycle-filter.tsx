"use client";

import { Icons } from "@/components/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BILLING_CYCLES } from "@/config/const";
import { BILLING_CYCLE_LABELS } from "@/config/subscription";

type Cycle = (typeof BILLING_CYCLES)[number];

export function BillingCycleFilter({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (value: Cycle | undefined) => void;
}) {
    return (
        <Select
            value={value ?? "all"}
            onValueChange={(v) =>
                onChange(v === "all" ? undefined : (v as Cycle))
            }
        >
            <SelectTrigger className="w-44">
                <div className="flex items-center gap-2">
                    <Icons.RefreshCw className="size-4" />
                    <SelectValue placeholder="Billing cycle" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Cycles</SelectItem>
                {BILLING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>
                        {BILLING_CYCLE_LABELS[c]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
