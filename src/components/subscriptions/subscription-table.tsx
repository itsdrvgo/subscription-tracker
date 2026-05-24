"use client";
"use no memo";

import { DataTableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DataTable,
    DataTableBulkActions,
    DataTableToolbar,
    ExportDialog,
    FieldMapping,
} from "@/components/ui/data-table";
import { DEFAULT_PAGINATION } from "@/config/const";
import { BILLING_CYCLE_LABELS, KIND_LABELS } from "@/config/subscription";
import { SUBSCRIPTION_STATUSES } from "@/lib/db/schemas";
import { useSubscription } from "@/lib/rq";
import { formatCurrency } from "@/lib/subscription";
import { cn, truncateText } from "@/lib/utils";
import { FullSubscription, Subscription } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    getFilteredRowModel,
    getSortedRowModel,
    RowSelectionState,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
    useQueryState,
} from "nuqs";
import { useCallback, useMemo, useState } from "react";
import {
    BillingCycleFilter,
    CategoryFilter,
    PaymentSourceFilter,
    StatusFilter,
} from "./filters";
import { RenewalCountdown } from "./renewal-countdown";
import { SubscriptionStatusBadge } from "./status-badge";
import { SubscriptionAction } from "./subscription-action";

type Status = Subscription["status"];

const columns = (
    handleSingleDelete: (id: string) => void
): ColumnDef<FullSubscription>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Subscription",
        cell: ({ row }) => {
            const s = row.original;
            return (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        {s.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={s.logoUrl}
                                alt={s.name}
                                className="size-9 rounded-md object-cover"
                            />
                        ) : (
                            <Icons.Receipt className="size-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium">
                                {s.name}
                            </p>
                            {s.isTrial && (
                                <Badge
                                    variant="outline"
                                    className="border-blue-500/30 bg-blue-500/15 px-1.5 py-0 text-[10px] font-medium text-blue-300"
                                >
                                    Trial
                                </Badge>
                            )}
                            {s.kind !== "subscription" && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "border px-1.5 py-0 text-[10px] font-medium",
                                        s.kind === "emi"
                                            ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
                                            : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                                    )}
                                >
                                    {KIND_LABELS[s.kind]}
                                </Badge>
                            )}
                        </div>
                        {s.description && (
                            <p className="truncate text-xs text-muted-foreground">
                                {truncateText(s.description, 40)}
                            </p>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <SubscriptionStatusBadge status={row.original.status} />
        ),
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const s = row.original;
            return (
                <div className="text-sm">
                    <p className="font-medium tabular-nums">
                        {formatCurrency(parseFloat(s.price), s.currency, {
                            keepDecimals: true,
                        })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {BILLING_CYCLE_LABELS[s.billingCycle]}
                    </p>
                </div>
            );
        },
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) =>
            row.original.category ? (
                <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-foreground">
                    {row.original.category.name}
                </span>
            ) : (
                <span className="text-xs text-muted-foreground">—</span>
            ),
    },
    {
        accessorKey: "paymentSource",
        header: "Payment",
        cell: ({ row }) =>
            row.original.paymentSource ? (
                <span className="text-xs">
                    {row.original.paymentSource.name}
                </span>
            ) : (
                <span className="text-xs text-muted-foreground">—</span>
            ),
    },
    {
        accessorKey: "nextRenewalDate",
        header: "Next renewal",
        cell: ({ row }) => {
            const s = row.original;
            return (
                <div className="text-sm">
                    <p className="tabular-nums">
                        {format(new Date(s.nextRenewalDate), "MMM dd, yyyy")}
                    </p>
                    <RenewalCountdown date={s.nextRenewalDate} />
                    {s.endDate && (
                        <p className="text-xs text-muted-foreground">
                            Ends {format(new Date(s.endDate), "MMM yyyy")}
                        </p>
                    )}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <SubscriptionAction
                data={row.original}
                onDelete={handleSingleDelete}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
];

function formatCurrencyFn(price: number, currency: string) {
    return formatCurrency(price, currency, { keepDecimals: true });
}

const exportFields: FieldMapping<FullSubscription>[] = [
    { source: "id", target: "ID", include: true, order: 0 },
    { source: "name", target: "Name", include: true, order: 1 },
    { source: "status", target: "Status", include: true, order: 2 },
    {
        source: "price",
        target: "Price",
        include: true,
        order: 3,
        formatter: (s) => formatCurrencyFn(parseFloat(s.price), s.currency),
    },
    {
        source: "currency",
        target: "Currency",
        include: true,
        order: 4,
    },
    {
        source: "billingCycle",
        target: "Billing cycle",
        include: true,
        order: 5,
        formatter: (s) => BILLING_CYCLE_LABELS[s.billingCycle],
    },
    {
        source: "category",
        target: "Category",
        include: true,
        order: 6,
        formatter: (s) => s.category?.name ?? "",
    },
    {
        source: "paymentSource",
        target: "Payment source",
        include: true,
        order: 7,
        formatter: (s) => s.paymentSource?.name ?? "",
    },
    {
        source: "nextRenewalDate",
        target: "Next renewal",
        include: true,
        order: 8,
        formatter: (s) => format(new Date(s.nextRenewalDate), "yyyy-MM-dd"),
    },
    {
        source: "startDate",
        target: "Start date",
        include: true,
        order: 9,
        formatter: (s) => format(new Date(s.startDate), "yyyy-MM-dd"),
    },
];

export function SubscriptionTable() {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(DEFAULT_PAGINATION.GENERAL.PAGE)
    );
    const [limit, setLimit] = useQueryState(
        "limit",
        parseAsInteger.withDefault(DEFAULT_PAGINATION.GENERAL.LIMIT)
    );
    const [search, setSearch] = useQueryState("search", { defaultValue: "" });
    const [status, setStatus] = useQueryState(
        "status",
        parseAsStringEnum<Status>([...SUBSCRIPTION_STATUSES])
    );
    const [categoryId, setCategoryId] = useQueryState(
        "categoryId",
        parseAsString
    );
    const [paymentSourceId, setPaymentSourceId] = useQueryState(
        "paymentSourceId",
        parseAsString
    );
    const [billingCycle, setBillingCycle] = useQueryState(
        "billingCycle",
        parseAsString
    );

    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [dataToExport, setDataToExport] = useState<FullSubscription[]>([]);

    const { usePaginate, useDelete, useBulkUpdate } = useSubscription();
    const { data, isPending, refetch } = usePaginate({
        page,
        limit,
        search,
        status: status ?? undefined,
        categoryId: categoryId ?? undefined,
        paymentSourceId: paymentSourceId ?? undefined,
        billingCycle: billingCycle ?? undefined,
    });

    const { mutateAsync: deleteAsync, isPending: isDeleting } = useDelete();
    const { mutateAsync: bulkUpdateAsync, isPending: isBulkUpdating } =
        useBulkUpdate();

    const handleDelete = async (ids: string[]) => {
        await deleteAsync({ ids });
        refetch();
        setRowSelection({});
    };

    const handleBulkStatus = async (ids: string[], newStatus: Status) => {
        await bulkUpdateAsync({ ids, values: { status: newStatus } });
        refetch();
        setRowSelection({});
    };

    const handleSingleDelete = useCallback(
        (id: string) => {
            setRowSelection((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            refetch();
        },
        [refetch]
    );

    const handleExport = (
        _: string[],
        getSelected?: () => FullSubscription[]
    ) => {
        setDataToExport(getSelected ? getSelected() : []);
        setIsExportOpen(true);
    };

    const tableColumns = useMemo(
        () => columns(handleSingleDelete),
        [handleSingleDelete]
    );

    if (isPending) {
        return (
            <DataTableSkeleton
                columnCount={tableColumns.length}
                pageSize={limit}
                filterCount={4}
            />
        );
    }

    if (!data) return null;

    return (
        <>
            <DataTable.Root
                columns={tableColumns}
                data={data.data || []}
                pageCount={data.pages || 0}
                isLoading={isPending}
                pageSize={limit}
                manualPagination={true}
                enableRowSelection={true}
                state={{
                    pagination: { pageIndex: page, pageSize: limit },
                    rowSelection,
                    columnVisibility,
                    columnFilters,
                }}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id}
                tableOptions={{
                    onColumnVisibilityChange: setColumnVisibility,
                    onColumnFiltersChange: setColumnFilters,
                    getSortedRowModel: getSortedRowModel(),
                    getFilteredRowModel: getFilteredRowModel(),
                }}
            >
                <DataTableToolbar
                    searchPlaceholder="Search subscriptions..."
                    searchValue={search}
                    onSearchChange={(v) => {
                        setSearch(v);
                        setPage(1);
                    }}
                    bulkActions={
                        <DataTableBulkActions
                            actions={[
                                {
                                    label: "Pause",
                                    icon: Icons.Pause,
                                    onClick: (ids) =>
                                        handleBulkStatus(ids, "paused"),
                                    disabled: isBulkUpdating,
                                },
                                {
                                    label: "Resume",
                                    icon: Icons.Play,
                                    onClick: (ids) =>
                                        handleBulkStatus(ids, "active"),
                                    disabled: isBulkUpdating,
                                },
                                {
                                    label: "Cancel",
                                    icon: Icons.XCircle,
                                    onClick: (ids) =>
                                        handleBulkStatus(ids, "cancelled"),
                                    disabled: isBulkUpdating,
                                    alert: {
                                        title: "Cancel selected subscriptions?",
                                        description:
                                            "They will be marked cancelled and stop auto-renewing.",
                                        confirm: "Cancel subscriptions",
                                    },
                                },
                                {
                                    label: "Export selected",
                                    icon: Icons.Upload,
                                    onClick: handleExport,
                                },
                                {
                                    label: "Delete selected",
                                    icon: Icons.Trash,
                                    onClick: (ids) => handleDelete(ids),
                                    variant: "destructive",
                                    disabled: isDeleting,
                                    alert: {
                                        title: "Delete selected subscriptions?",
                                        description:
                                            "This permanently removes them and their history. This cannot be undone.",
                                        confirm: "Delete",
                                    },
                                },
                            ]}
                            getSelectedRows={(ids) =>
                                ids
                                    .map((id) =>
                                        data.data?.find((d) => d.id === id)
                                    )
                                    .filter(Boolean) as FullSubscription[]
                            }
                        />
                    }
                    filters={[
                        <StatusFilter
                            key="status"
                            value={status}
                            onChange={(v) => {
                                setStatus(v ?? null);
                                setPage(1);
                            }}
                        />,
                        <CategoryFilter
                            key="category"
                            value={categoryId}
                            onChange={(v) => {
                                setCategoryId(v ?? null);
                                setPage(1);
                            }}
                        />,
                        <PaymentSourceFilter
                            key="source"
                            value={paymentSourceId}
                            onChange={(v) => {
                                setPaymentSourceId(v ?? null);
                                setPage(1);
                            }}
                        />,
                        <BillingCycleFilter
                            key="cycle"
                            value={billingCycle}
                            onChange={(v) => {
                                setBillingCycle(v ?? null);
                                setPage(1);
                            }}
                        />,
                    ]}
                />

                <DataTable.Content
                    columns={tableColumns}
                    isLoading={isPending}
                    pageSize={limit}
                />

                <DataTable.Pagination
                    currentPage={page}
                    pageCount={data.pages || 0}
                    pageSize={limit}
                    totalItems={data.count}
                    isLoading={isPending}
                    onPageChange={setPage}
                    onRowsPerPageChange={(s) => {
                        setLimit(s);
                        setPage(1);
                    }}
                />
            </DataTable.Root>

            <ExportDialog<FullSubscription>
                isOpen={isExportOpen}
                onClose={() => setIsExportOpen(false)}
                data={dataToExport}
                filename={`subscriptions_${format(new Date(), "yyyy-MM-dd")}.csv`}
                fields={exportFields}
            />
        </>
    );
}
