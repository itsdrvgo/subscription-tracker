"use client";
"use no memo";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES } from "@/config/const";
import { useBudget } from "@/lib/rq";
import { UpsertBudget, upsertBudgetSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

export function BudgetManager() {
    const { useGet, useUpsert, useDelete } = useBudget();
    const { data, isPending } = useGet();
    const { mutateAsync: upsert, isPending: isSaving } = useUpsert();
    const { mutateAsync: remove, isPending: isDeleting } = useDelete();

    const form = useForm<UpsertBudget>({
        resolver: zodResolver(
            upsertBudgetSchema
        ) as unknown as Resolver<UpsertBudget>,
        values: {
            monthlyLimit: data?.monthlyLimit ?? null,
            yearlyLimit: data?.yearlyLimit ?? null,
            warningThreshold: data?.warningThreshold ?? 80,
            criticalThreshold: data?.criticalThreshold ?? 95,
            currency: data?.currency ?? "USD",
        },
    });

    const handleSubmit = async (values: UpsertBudget) => {
        await upsert(values);
    };

    if (isPending) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Budget</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending budget</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit(handleSubmit)}
                    >
                        <div className="grid gap-4 sm:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="monthlyLimit"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-1">
                                        <FormLabel>Monthly limit</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                disabled={isSaving}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value || null
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="yearlyLimit"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-1">
                                        <FormLabel>Yearly limit</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                disabled={isSaving}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value || null
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isSaving}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CURRENCIES.map((c) => (
                                                    <SelectItem
                                                        key={c.code}
                                                        value={c.code}
                                                    >
                                                        {c.code} — {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="warningThreshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Warning threshold (%)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                disabled={isSaving}
                                                value={field.value ?? 80}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            We&apos;ll warn you at this % of
                                            your limit.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="criticalThreshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Critical threshold (%)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                disabled={isSaving}
                                                value={field.value ?? 95}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        Number(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Escalates the alert when you&apos;re
                                            close to over-budget.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            {data && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => remove(undefined)}
                                    disabled={isSaving || isDeleting}
                                >
                                    Remove budget
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSaving || !form.formState.isDirty}
                            >
                                {data ? "Update budget" : "Save budget"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
