"use client";

import { cFetch, handleClientError } from "@/lib/utils";
import {
    CreateSubscriptionCategory,
    SubscriptionCategory,
    UpdateSubscriptionCategory,
} from "@/lib/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const KEY = ["subscription-category"] as const;

export function useSubscriptionCategory() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: KEY });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
    };

    const useScan = ({
        ids,
        search,
        enabled,
    }: {
        ids?: string[];
        search?: string;
        enabled?: boolean;
    } = {}) => {
        return useQuery({
            queryKey: [...KEY, "scan", ids, search],
            queryFn: async () => {
                const params = new URLSearchParams();
                if (ids?.length) params.set("ids", ids.join(","));
                if (search) params.set("search", search);
                params.set("isPaginated", "false");

                const res = await cFetch<SubscriptionCategory[]>(
                    `/api/subscriptions/categories?${params.toString()}`
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            enabled,
        });
    };

    const useGet = ({ id, enabled }: { id: string; enabled?: boolean }) => {
        return useQuery({
            queryKey: [...KEY, "get", id],
            queryFn: async () => {
                const res = await cFetch<SubscriptionCategory>(
                    `/api/subscriptions/categories/${id}`
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
                toastId: toast.loading("Creating category..."),
            }),
            mutationFn: async (values: CreateSubscriptionCategory[]) => {
                const res = await cFetch<SubscriptionCategory[]>(
                    "/api/subscriptions/categories",
                    {
                        method: "POST",
                        body: JSON.stringify(values),
                    }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Category created", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useUpdate = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Updating category..."),
            }),
            mutationFn: async ({
                id,
                values,
            }: {
                id: string;
                values: UpdateSubscriptionCategory;
            }) => {
                const res = await cFetch<SubscriptionCategory>(
                    `/api/subscriptions/categories/${id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(values),
                    }
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Category updated", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useDelete = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Deleting category..."),
            }),
            mutationFn: async ({ ids }: { ids: string[] }) => {
                const params = new URLSearchParams();
                params.set("ids", ids.join(","));
                const res = await cFetch(
                    `/api/subscriptions/categories?${params.toString()}`,
                    { method: "DELETE" }
                );
                if (!res.ok) throw res.error;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Category deleted", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    return { useScan, useGet, useCreate, useUpdate, useDelete };
}
