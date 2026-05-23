"use client";

import { Icons } from "@/components/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePaymentSource } from "@/lib/rq";

export function PaymentSourceFilter({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (value: string | undefined) => void;
}) {
    const { useScan } = usePaymentSource();
    const { data: sources } = useScan({});

    return (
        <Select
            value={value ?? "all"}
            onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        >
            <SelectTrigger className="w-44">
                <div className="flex items-center gap-2">
                    <Icons.CreditCard className="size-4" />
                    <SelectValue placeholder="Payment source" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Payment sources</SelectItem>
                {sources?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                        {s.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
