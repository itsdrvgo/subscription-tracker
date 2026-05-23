"use client";

import { cFetch, handleClientError } from "@/lib/utils";
import {
    CreatePaymentSource,
    PaymentSource,
    UpdatePaymentSource,
} from "@/lib/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const KEY = ["payment-source"] as const;

export function usePaymentSource() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: KEY });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
    };

    const useScan = ({
        ids,
        isActive,
        type,
        search,
        enabled,
    }: {
        ids?: string[];
        isActive?: boolean;
        type?: PaymentSource["type"];
        search?: string;
        enabled?: boolean;
    } = {}) => {
        return useQuery({
            queryKey: [...KEY, "scan", ids, isActive, type, search],
            queryFn: async () => {
                const params = new URLSearchParams();
                if (ids?.length) params.set("ids", ids.join(","));
                if (isActive !== undefined)
                    params.set("isActive", String(isActive));
                if (type) params.set("type", type);
                if (search) params.set("search", search);
                params.set("isPaginated", "false");

                const res = await cFetch<PaymentSource[]>(
                    `/api/subscriptions/payment-sources?${params.toString()}`
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
                const res = await cFetch<PaymentSource>(
                    `/api/subscriptions/payment-sources/${id}`
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
                toastId: toast.loading("Adding payment source..."),
            }),
            mutationFn: async (values: CreatePaymentSource[]) => {
                const res = await cFetch<PaymentSource[]>(
                    "/api/subscriptions/payment-sources",
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
                toast.success("Payment source added", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useUpdate = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Updating payment source..."),
            }),
            mutationFn: async ({
                id,
                values,
            }: {
                id: string;
                values: UpdatePaymentSource;
            }) => {
                const res = await cFetch<PaymentSource>(
                    `/api/subscriptions/payment-sources/${id}`,
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
                toast.success("Payment source updated", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useDelete = () => {
        return useMutation({
            onMutate: () => ({
                toastId: toast.loading("Deleting payment source..."),
            }),
            mutationFn: async ({ ids }: { ids: string[] }) => {
                const params = new URLSearchParams();
                params.set("ids", ids.join(","));
                const res = await cFetch(
                    `/api/subscriptions/payment-sources?${params.toString()}`,
                    { method: "DELETE" }
                );
                if (!res.ok) throw res.error;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Payment source deleted", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    return { useScan, useGet, useCreate, useUpdate, useDelete };
}
