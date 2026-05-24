"use client";
"use no memo";

import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { FormFooterBar } from "@/components/ui/form-footer-bar";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    BILLING_CYCLES,
    CURRENCIES,
    PAYMENT_SOURCE_TYPES,
    SUBSCRIPTION_KINDS,
    SUBSCRIPTION_PRIORITIES,
    SUBSCRIPTION_STATUSES,
} from "@/config/const";
import {
    BILLING_CYCLE_LABELS,
    KIND_DESCRIPTIONS,
    KIND_LABELS,
    PAYMENT_SOURCE_TYPE_LABELS,
    PRIORITY_LABELS,
    STATUS_LABELS,
} from "@/config/subscription";
import {
    usePaymentSource,
    useSubscription,
    useSubscriptionCategory,
} from "@/lib/rq";
import { getNextRenewalDate } from "@/lib/subscription";
import {
    CreateSubscription,
    createSubscriptionSchema,
    FullSubscription,
    UpdateSubscription,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    useForm,
    useWatch,
    type Resolver,
    type UseFormReturn,
} from "react-hook-form";

interface PageProps {
    data?: FullSubscription;
}

export function SubscriptionFormFetch({ type }: { type: "create" | "edit" }) {
    const { id } = useParams<{ id?: string }>();
    const { useGet } = useSubscription();
    const { data, isPending } = useGet({
        id: type === "edit" && typeof id === "string" ? id : "",
        enabled: type === "edit" && typeof id === "string",
    });

    if (type === "create") return <SubscriptionForm />;
    if (!id || typeof id !== "string") redirect("/subscriptions");

    if (isPending) {
        return (
            <div className="space-y-4">
                <div className="h-32 animate-pulse rounded-md bg-muted" />
                <div className="h-64 animate-pulse rounded-md bg-muted" />
            </div>
        );
    }
    if (!data) redirect("/subscriptions");
    return <SubscriptionForm data={data} />;
}

export function SubscriptionForm({ data }: PageProps) {
    const router = useRouter();
    const isEdit = !!data;

    const { useScan: useCategoryScan } = useSubscriptionCategory();
    const { data: categories = [] } = useCategoryScan({});

    const { useScan: usePaymentScan } = usePaymentSource();
    const { data: paymentSources = [] } = usePaymentScan({});

    const { useCreate, useUpdate } = useSubscription();
    const { mutateAsync: createMutate, isPending: isCreating } = useCreate();
    const { mutateAsync: updateMutate, isPending: isUpdating } = useUpdate();
    const isSubmitting = isCreating || isUpdating;

    const defaultStart = data?.startDate ?? new Date();
    const defaultNext =
        data?.nextRenewalDate ??
        getNextRenewalDate({
            from: defaultStart,
            billingCycle: "monthly",
        });

    const form = useForm<CreateSubscription>({
        resolver: zodResolver(
            createSubscriptionSchema
        ) as unknown as Resolver<CreateSubscription>,
        defaultValues: {
            name: data?.name ?? "",
            description: data?.description ?? "",
            websiteUrl: data?.websiteUrl ?? "",
            logoUrl: data?.logoUrl ?? "",
            categoryId: data?.categoryId ?? null,
            paymentSourceId: data?.paymentSourceId ?? null,
            tags: data?.tags ?? [],
            kind: data?.kind ?? "subscription",
            billingCycle: data?.billingCycle ?? "monthly",
            customIntervalDays: data?.customIntervalDays ?? null,
            price: data?.price ?? "0",
            trialPrice: data?.trialPrice ?? null,
            yearlyPrice: data?.yearlyPrice ?? null,
            currency: data?.currency ?? "USD",
            taxAmount: data?.taxAmount ?? "0",
            discountAmount: data?.discountAmount ?? "0",
            startDate: defaultStart,
            nextRenewalDate: defaultNext,
            endDate: data?.endDate ?? null,
            autoRenew: data?.autoRenew ?? true,
            isTrial: data?.isTrial ?? false,
            trialEndDate: data?.trialEndDate ?? null,
            status: data?.status ?? "active",
            priority: data?.priority ?? "medium",
            reminderEnabled: data?.reminderEnabled ?? true,
            reminderDaysBefore: data?.reminderDaysBefore ?? 1,
            notes: data?.notes ?? "",
        },
    });

    const billingCycle = useWatch({
        control: form.control,
        name: "billingCycle",
    });
    const isTrial = useWatch({ control: form.control, name: "isTrial" });
    const reminderEnabled = useWatch({
        control: form.control,
        name: "reminderEnabled",
    });
    const startDateRaw = useWatch({ control: form.control, name: "startDate" });
    const customIntervalDays = useWatch({
        control: form.control,
        name: "customIntervalDays",
    });

    // Auto-compute the next renewal date when start date or cycle changes,
    // but only on create — on edit the user already knows when it renews and
    // we shouldn't clobber that.
    useEffect(() => {
        if (isEdit) return;
        if (!startDateRaw) return;
        if (form.getFieldState("nextRenewalDate").isDirty) return;
        const start =
            startDateRaw instanceof Date
                ? startDateRaw
                : new Date(startDateRaw);
        if (Number.isNaN(start.getTime())) return;
        const next = getNextRenewalDate({
            from: start,
            billingCycle,
            customIntervalDays: customIntervalDays ?? null,
        });
        form.setValue("nextRenewalDate", next, { shouldDirty: false });
    }, [isEdit, startDateRaw, billingCycle, customIntervalDays, form]);

    const handleSubmit = async (values: CreateSubscription) => {
        if (isEdit && data) {
            await updateMutate({
                id: data.id,
                values: values as UpdateSubscription,
            });
        } else {
            await createMutate([values]);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                <div className="grid items-start gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <BasicInfoCard
                            form={form}
                            isSubmitting={isSubmitting}
                        />
                        <BillingCard
                            form={form}
                            isSubmitting={isSubmitting}
                            billingCycle={billingCycle}
                        />
                        <RenewalCard
                            form={form}
                            isSubmitting={isSubmitting}
                            isTrial={isTrial}
                        />
                    </div>

                    <div className="space-y-6">
                        <SettingsCard
                            form={form}
                            isSubmitting={isSubmitting}
                            categories={categories}
                            paymentSources={paymentSources}
                        />

                        <NotificationsCard
                            form={form}
                            isSubmitting={isSubmitting}
                            reminderEnabled={reminderEnabled}
                        />

                        <NotesCard form={form} isSubmitting={isSubmitting} />
                    </div>
                </div>

                <FormFooterBar
                    visible={!isEdit || form.formState.isDirty}
                    isSubmitting={isSubmitting}
                    saveLabel={
                        isEdit ? "Update subscription" : "Create subscription"
                    }
                    savingLabel={isEdit ? "Updating..." : "Creating..."}
                    message={
                        isEdit
                            ? "You have unsaved changes"
                            : "Fill in the details to start tracking"
                    }
                    onCancel={() => router.push("/subscriptions")}
                />
            </form>
        </Form>
    );
}

function BasicInfoCard({
    form,
    isSubmitting,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Service name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Netflix, Spotify, AWS"
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="https://example.com"
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Logo URL (optional)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="https://logo.clearbit.com/example.com"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="What does this subscription cover?"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                                <Input
                                    value={
                                        Array.isArray(field.value)
                                            ? field.value.join(", ")
                                            : ""
                                    }
                                    onChange={(e) =>
                                        field.onChange(
                                            e.target.value
                                                .split(",")
                                                .map((t) => t.trim())
                                                .filter(Boolean)
                                        )
                                    }
                                    placeholder="work, productivity, ai (comma separated)"
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormDescription>
                                Comma-separated values for quick filtering.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

function BillingCard({
    form,
    isSubmitting,
    billingCycle,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
    billingCycle: CreateSubscription["billingCycle"];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="kind"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kind</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value ?? "subscription"}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {SUBSCRIPTION_KINDS.map((k) => (
                                        <SelectItem key={k} value={k}>
                                            {KIND_LABELS[k]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                {KIND_DESCRIPTIONS[
                                    (field.value ??
                                        "subscription") as keyof typeof KIND_DESCRIPTIONS
                                ]}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid items-start gap-4 sm:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>Regular price</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Price you&apos;re charged once any trial
                                    ends.
                                </FormDescription>
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
                                    disabled={isSubmitting}
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

                <div className="grid items-start gap-4 sm:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="billingCycle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Billing cycle</FormLabel>
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
                                        {BILLING_CYCLES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {BILLING_CYCLE_LABELS[c]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {billingCycle === "custom" && (
                        <FormField
                            control={form.control}
                            name="customIntervalDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Interval (days)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="30"
                                            disabled={isSubmitting}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : null
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="yearlyPrice"
                        render={({ field }) => (
                            <FormItem
                                className={
                                    billingCycle === "custom"
                                        ? ""
                                        : "sm:col-span-2"
                                }
                            >
                                <FormLabel>Yearly price (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="If different from cycle"
                                        disabled={isSubmitting}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value
                                                    ? e.target.value
                                                    : null
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="taxAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tax (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="discountAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Discount (optional)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        disabled={isSubmitting}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function RenewalCard({
    form,
    isSubmitting,
    isTrial,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
    isTrial: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Renewal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start date</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        disabled={isSubmitting}
                                        value={field.value}
                                        onChange={(d) =>
                                            field.onChange(d ?? null)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nextRenewalDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Next renewal</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        disabled={isSubmitting}
                                        value={field.value}
                                        onChange={(d) =>
                                            field.onChange(d ?? null)
                                        }
                                    />
                                </FormControl>
                                <FormDescription>
                                    Auto-computed from cycle on create.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>End date (optional)</FormLabel>
                            <FormControl>
                                <DatePicker
                                    disabled={isSubmitting}
                                    value={field.value}
                                    onChange={(d) => field.onChange(d ?? null)}
                                />
                            </FormControl>
                            <FormDescription>
                                Maturity / completion date for fixed-term
                                commitments like EMIs, RDs, or PPF. Leave blank
                                for open-ended subscriptions.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="autoRenew"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Auto-renew</FormLabel>
                                <FormDescription>
                                    Renews silently when the cycle ends.
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

                <FormField
                    control={form.control}
                    name="isTrial"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Currently on trial</FormLabel>
                                <FormDescription>
                                    Mark this if you&apos;re in a free-trial
                                    period.
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

                {isTrial && (
                    <div className="grid items-start gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="trialEndDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Trial end date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            disabled={isSubmitting}
                                            value={field.value}
                                            onChange={(d) =>
                                                field.onChange(d ?? null)
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="trialPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trial price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00 (free)"
                                            disabled={isSubmitting}
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ""
                                                        ? null
                                                        : e.target.value
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Price during the trial (e.g. ₹15/mo for
                                        3 months). Leave blank for a free trial.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function SettingsCard({
    form,
    isSubmitting,
    categories,
    paymentSources,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
    categories: { id: string; name: string }[];
    paymentSources: {
        id: string;
        name: string;
        type: (typeof PAYMENT_SOURCE_TYPES)[number];
    }[];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
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
                                    {SUBSCRIPTION_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {STATUS_LABELS[s]}
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
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Priority</FormLabel>
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
                                    {SUBSCRIPTION_PRIORITIES.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {PRIORITY_LABELS[p]}
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
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                                onValueChange={(v) =>
                                    field.onChange(v === "none" ? null : v)
                                }
                                value={field.value ?? "none"}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Uncategorized
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
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
                    name="paymentSourceId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment source</FormLabel>
                            <Select
                                onValueChange={(v) =>
                                    field.onChange(v === "none" ? null : v)
                                }
                                value={field.value ?? "none"}
                                disabled={isSubmitting}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {paymentSources.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} ·{" "}
                                            {PAYMENT_SOURCE_TYPE_LABELS[p.type]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

function NotificationsCard({
    form,
    isSubmitting,
    reminderEnabled,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
    reminderEnabled: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icons.Bell className="size-4" />
                    Notifications
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="reminderEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Renewal reminders</FormLabel>
                                <FormDescription>
                                    Email before the next renewal.
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

                {reminderEnabled && (
                    <FormField
                        control={form.control}
                        name="reminderDaysBefore"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Days before renewal</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={60}
                                        disabled={isSubmitting}
                                        value={field.value ?? 1}
                                        onChange={(e) =>
                                            field.onChange(
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormDescription>
                                    Default is 1 day. We&apos;ll email you ahead
                                    of time.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function NotesCard({
    form,
    isSubmitting,
}: {
    form: UseFormReturn<CreateSubscription>;
    isSubmitting: boolean;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Any private notes you want to remember…"
                                    rows={4}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
