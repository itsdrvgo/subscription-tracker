"use client";

import {
    SUBSCRIPTION_ACTIVITY_QUERY_KEY,
    SUBSCRIPTION_ANALYTICS_QUERY_KEY,
    SUBSCRIPTION_QUERY_KEY,
} from "@/config/const";
import { cFetch, handleClientError } from "@/lib/utils";
import {
    BulkUpdateSubscription,
    CreateSubscription,
    FullSubscription,
    Subscription,
    SubscriptionActivityLog,
    SubscriptionStats,
    UpdateSubscription,
} from "@/lib/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubscriptionStatus = Subscription["status"];

export function useSubscription() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_ANALYTICS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_ACTIVITY_QUERY_KEY });
    };

    const usePaginate = ({
        page,
        limit,
        search,
        status,
        statusIn,
        categoryId,
        paymentSourceId,
        billingCycle,
        enabled,
    }: {
        page?: number;
        limit?: number;
        search?: string;
        status?: SubscriptionStatus;
        statusIn?: SubscriptionStatus[];
        categoryId?: string | null;
        paymentSourceId?: string | null;
        billingCycle?: string;
        enabled?: boolean;
    } = {}) => {
        return useQuery({
            queryKey: [
                ...SUBSCRIPTION_QUERY_KEY,
                "paginate",
                page,
                limit,
                search,
                status,
                statusIn,
                categoryId,
                paymentSourceId,
                billingCycle,
            ],
            queryFn: async () => {
                const searchParams = new URLSearchParams();
                if (page) searchParams.set("page", String(page));
                if (limit) searchParams.set("limit", String(limit));
                if (search) searchParams.set("search", search);
                if (status) searchParams.set("status", status);
                if (statusIn?.length)
                    searchParams.set("statusIn", statusIn.join(","));
                if (categoryId !== undefined && categoryId !== null)
                    searchParams.set("categoryId", categoryId);
                if (paymentSourceId !== undefined && paymentSourceId !== null)
                    searchParams.set("paymentSourceId", paymentSourceId);
                if (billingCycle)
                    searchParams.set("billingCycle", billingCycle);
                searchParams.set("isPaginated", "true");

                const res = await cFetch<PaginationResult<FullSubscription>>(
                    `/api/subscriptions?${searchParams.toString()}`
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            enabled,
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
        });
    };

    const useScan = ({
        ids,
        status,
        statusIn,
        categoryId,
        paymentSourceId,
        search,
        enabled,
    }: {
        ids?: string[];
        status?: SubscriptionStatus;
        statusIn?: SubscriptionStatus[];
        categoryId?: string | null;
        paymentSourceId?: string | null;
        search?: string;
        enabled?: boolean;
    } = {}) => {
        return useQuery({
            queryKey: [
                ...SUBSCRIPTION_QUERY_KEY,
                "scan",
                ids,
                status,
                statusIn,
                categoryId,
                paymentSourceId,
                search,
            ],
            queryFn: async () => {
                const searchParams = new URLSearchParams();
                if (ids?.length) searchParams.set("ids", ids.join(","));
                if (status) searchParams.set("status", status);
                if (statusIn?.length)
                    searchParams.set("statusIn", statusIn.join(","));
                if (categoryId !== undefined && categoryId !== null)
                    searchParams.set("categoryId", categoryId);
                if (paymentSourceId !== undefined && paymentSourceId !== null)
                    searchParams.set("paymentSourceId", paymentSourceId);
                if (search) searchParams.set("search", search);
                searchParams.set("isPaginated", "false");

                const res = await cFetch<FullSubscription[]>(
                    `/api/subscriptions?${searchParams.toString()}`
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            enabled,
        });
    };

    const useGet = ({ id, enabled }: { id: string; enabled?: boolean }) => {
        return useQuery({
            queryKey: [...SUBSCRIPTION_QUERY_KEY, "get", id],
            queryFn: async () => {
                const res = await cFetch<FullSubscription>(
                    `/api/subscriptions/${id}`
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            enabled: enabled !== false && !!id,
        });
    };

    const useCreate = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Creating subscription..."),
            }),
            mutationFn: async (values: CreateSubscription[]) => {
                const res = await cFetch<FullSubscription[]>(
                    "/api/subscriptions",
                    {
                        method: "POST",
                        body: JSON.stringify(values),
                    }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (data, __, { toastId }) => {
                invalidateAll();
                toast.success(`${data?.length ?? 0} subscription(s) created`, {
                    id: toastId,
                });
                router.refresh();
                router.push("/subscriptions");
            },
            onError: handleClientError,
        });
    };

    const useUpdate = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Updating subscription..."),
            }),
            mutationFn: async ({
                id,
                values,
            }: {
                id: string;
                values: UpdateSubscription;
            }) => {
                const res = await cFetch<FullSubscription>(
                    `/api/subscriptions/${id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(values),
                    }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidateAll();
                toast.success("Subscription updated", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useBulkUpdate = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Updating subscriptions..."),
            }),
            mutationFn: async ({
                ids,
                values,
            }: {
                ids: string[];
                values: BulkUpdateSubscription;
            }) => {
                const res = await cFetch<Subscription[]>("/api/subscriptions", {
                    method: "PATCH",
                    body: JSON.stringify({ ids, values }),
                });
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (data, __, { toastId }) => {
                invalidateAll();
                toast.success(`${data?.length ?? 0} subscription(s) updated`, {
                    id: toastId,
                });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useDelete = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Deleting subscription(s)..."),
            }),
            mutationFn: async ({ ids }: { ids: string[] }) => {
                const params = new URLSearchParams();
                params.set("ids", ids.join(","));
                const res = await cFetch(
                    `/api/subscriptions?${params.toString()}`,
                    { method: "DELETE" }
                );
                if (!res.ok) throw res.error;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidateAll();
                toast.success("Subscription(s) deleted", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useCancel = () => {
        return useMutation({
            onMutate: () => ({ toastId: toast.loading("Cancelling...") }),
            mutationFn: async ({ id }: { id: string }) => {
                const res = await cFetch<FullSubscription>(
                    `/api/subscriptions/${id}/cancel`,
                    { method: "POST" }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidateAll();
                toast.success("Subscription cancelled", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const usePause = () => {
        return useMutation({
            onMutate: () => ({ toastId: toast.loading("Pausing...") }),
            mutationFn: async ({ id }: { id: string }) => {
                const res = await cFetch<FullSubscription>(
                    `/api/subscriptions/${id}/pause`,
                    { method: "POST" }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidateAll();
                toast.success("Subscription paused", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useResume = () => {
        return useMutation({
            onMutate: () => ({ toastId: toast.loading("Resuming...") }),
            mutationFn: async ({ id }: { id: string }) => {
                const res = await cFetch<FullSubscription>(
                    `/api/subscriptions/${id}/resume`,
                    { method: "POST" }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidateAll();
                toast.success("Subscription resumed", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useAnalytics = () => {
        return useQuery({
            queryKey: SUBSCRIPTION_ANALYTICS_QUERY_KEY,
            queryFn: async () => {
                const res = await cFetch<{
                    stats: SubscriptionStats;
                    upcoming: FullSubscription[];
                    trialsEnding: FullSubscription[];
                    recentlyAdded: FullSubscription[];
                    activity: SubscriptionActivityLog[];
                }>("/api/subscriptions/analytics");
                if (!res.ok) throw res.error;
                return res.data;
            },
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
        });
    };

    const useActivity = ({
        page,
        limit,
        subscriptionId,
        action,
    }: {
        page?: number;
        limit?: number;
        subscriptionId?: string;
        action?: SubscriptionActivityLog["action"];
    } = {}) => {
        return useQuery({
            queryKey: [...SUBSCRIPTION_ACTIVITY_QUERY_KEY, page, limit, subscriptionId, action],
            queryFn: async () => {
                const params = new URLSearchParams();
                if (page) params.set("page", String(page));
                if (limit) params.set("limit", String(limit));
                if (subscriptionId)
                    params.set("subscriptionId", subscriptionId);
                if (action) params.set("action", action);

                const res = await cFetch<
                    PaginationResult<SubscriptionActivityLog>
                >(`/api/subscriptions/activity?${params.toString()}`);
                if (!res.ok) throw res.error;
                return res.data;
            },
        });
    };

    return {
        usePaginate,
        useScan,
        useGet,
        useCreate,
        useUpdate,
        useBulkUpdate,
        useDelete,
        useCancel,
        usePause,
        useResume,
        useAnalytics,
        useActivity,
    };
}
