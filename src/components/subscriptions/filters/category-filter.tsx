"use client";

import { Icons } from "@/components/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSubscriptionCategory } from "@/lib/rq";

export function CategoryFilter({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (value: string | undefined) => void;
}) {
    const { useScan } = useSubscriptionCategory();
    const { data: categories } = useScan({});

    return (
        <Select
            value={value ?? "all"}
            onValueChange={(v) => onChange(v === "all" ? undefined : v)}
        >
            <SelectTrigger className="w-44">
                <div className="flex items-center gap-2">
                    <Icons.Folder className="size-4" />
                    <SelectValue placeholder="Category" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Categories</SelectItem>
                {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                        {c.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
