"use client";
"use no memo";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { PAYMENT_SOURCE_TYPE_LABELS } from "@/config/subscription";
import { PAYMENT_SOURCE_TYPES } from "@/lib/db/schemas";
import { usePaymentSource } from "@/lib/rq";
import {
    CreatePaymentSource,
    createPaymentSourceSchema,
    PaymentSource,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

export function PaymentSourceManager() {
    const [editing, setEditing] = useState<PaymentSource | null>(null);
    const { useScan } = usePaymentSource();
    const { data, isPending } = useScan({});

    return (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {editing ? "Edit payment source" : "Add payment source"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PaymentSourceForm
                        key={editing?.id ?? "new"}
                        editing={editing}
                        onFinish={() => setEditing(null)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your payment sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isPending ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))
                    ) : !data?.length ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No payment sources yet. Add one to attribute
                            recurring charges accurately.
                        </p>
                    ) : (
                        data.map((source) => (
                            <PaymentSourceRow
                                key={source.id}
                                source={source}
                                onEdit={() => setEditing(source)}
                            />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function PaymentSourceForm({
    editing,
    onFinish,
}: {
    editing: PaymentSource | null;
    onFinish: () => void;
}) {
    const isEdit = !!editing;

    const form = useForm<CreatePaymentSource>({
        resolver: zodResolver(
            createPaymentSourceSchema
        ) as unknown as Resolver<CreatePaymentSource>,
        defaultValues: {
            name: editing?.name ?? "",
            type: editing?.type ?? "credit_card",
            identifier: editing?.identifier ?? null,
            isActive: editing?.isActive ?? true,
        },
    });

    const { useCreate, useUpdate } = usePaymentSource();
    const { mutateAsync: createOne, isPending: isCreating } = useCreate();
    const { mutateAsync: updateOne, isPending: isUpdating } = useUpdate();
    const isSubmitting = isCreating || isUpdating;

    const handleSubmit = async (values: CreatePaymentSource) => {
        if (isEdit && editing) {
            await updateOne({ id: editing.id, values });
        } else {
            await createOne([values]);
        }
        form.reset({
            name: "",
            type: "credit_card",
            identifier: null,
            isActive: true,
        });
        onFinish();
    };

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit(handleSubmit)}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Chase Sapphire"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {PAYMENT_SOURCE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {PAYMENT_SOURCE_TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Identifier (optional)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Last 4, account label, etc."
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormDescription>
                                A hint to disambiguate this source (never stored
                                as full card number).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Active</FormLabel>
                                <FormDescription>
                                    Inactive sources are hidden from forms.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value ?? false}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    {isEdit && (
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isSubmitting}
                            onClick={() => {
                                form.reset({
                                    name: "",
                                    type: "credit_card",
                                    identifier: null,
                                    isActive: true,
                                });
                                onFinish();
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !form.formState.isDirty}
                    >
                        {isEdit ? "Update" : "Add"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function PaymentSourceRow({
    source,
    onEdit,
}: {
    source: PaymentSource;
    onEdit: () => void;
}) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const { useDelete } = usePaymentSource();
    const { mutateAsync, isPending } = useDelete();

    const handleDelete = async () => {
        await mutateAsync({ ids: [source.id] });
        setIsDeleteOpen(false);
    };

    return (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-background p-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icons.CreditCard className="size-4" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                            {source.name}
                        </p>
                        {!source.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                        )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                        {PAYMENT_SOURCE_TYPE_LABELS[source.type]}
                        {source.identifier ? ` · ${source.identifier}` : ""}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={onEdit}
                >
                    <Icons.Edit className="size-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setIsDeleteOpen(true)}
                >
                    <Icons.Trash className="size-4" />
                </Button>
            </div>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete &ldquo;{source.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Subscriptions attached to this source will be
                            unlinked but kept.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
