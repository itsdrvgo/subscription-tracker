"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

interface DatePickerProps {
    value: Date | string | null | undefined;
    onChange: (date: Date | undefined) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    fromYear?: number;
    toYear?: number;
}

function coerce(value: Date | string | null | undefined): Date | undefined {
    if (!value) return undefined;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DatePicker({
    value,
    onChange,
    disabled,
    placeholder = "Pick a date",
    className,
    fromYear = 2000,
    toYear = new Date().getFullYear() + 20,
}: DatePickerProps) {
    const selected = coerce(value);
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {selected ? (
                        format(selected, "MMM d, yyyy")
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={selected}
                    defaultMonth={selected}
                    startMonth={new Date(fromYear, 0)}
                    endMonth={new Date(toYear, 11)}
                    onSelect={(d) => {
                        onChange(d);
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
