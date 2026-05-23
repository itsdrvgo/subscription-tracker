"use client";

import { cFetch, handleClientError } from "@/lib/utils";
import { Budget, UpsertBudget } from "@/lib/validations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const KEY = ["budget"] as const;

export function useBudget() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: KEY });
        queryClient.invalidateQueries({
            queryKey: ["subscription", "analytics"],
        });
    };

    const useGet = () => {
        return useQuery({
            queryKey: KEY,
            queryFn: async () => {
                const res = await cFetch<Budget | null>(
                    "/api/subscriptions/budget"
                );
                if (!res.ok) throw res.error;
                return res.data;
            },
        });
    };

    const useUpsert = () => {
        return useMutation({
            onMutate: () => ({ toastId: toast.loading("Saving budget...") }),
            mutationFn: async (values: UpsertBudget) => {
                const res = await cFetch<Budget>("/api/subscriptions/budget", {
                    method: "PUT",
                    body: JSON.stringify(values),
                });
                if (!res.ok) throw res.error;
                return res.data;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Budget saved", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    const useDelete = () => {
        return useMutation({
            onMutate: () => ({ toastId: toast.loading("Removing budget...") }),
            mutationFn: async () => {
                const res = await cFetch("/api/subscriptions/budget", {
                    method: "DELETE",
                });
                if (!res.ok) throw res.error;
            },
            onSuccess: (_, __, { toastId }) => {
                invalidate();
                toast.success("Budget removed", { id: toastId });
                router.refresh();
            },
            onError: handleClientError,
        });
    };

    return { useGet, useUpsert, useDelete };
}
