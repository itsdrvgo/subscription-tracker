"use client";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubscription } from "@/lib/rq";
import { FullSubscription } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PageProps {
    data: FullSubscription;
    onDelete?: (id: string) => void;
}

export function SubscriptionAction({ data, onDelete }: PageProps) {
    const router = useRouter();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const { useDelete, useCancel, usePause, useResume } = useSubscription();
    const { mutateAsync: del, isPending: isDeleting } = useDelete();
    const { mutateAsync: cancel, isPending: isCancelling } = useCancel();
    const { mutateAsync: pause, isPending: isPausing } = usePause();
    const { mutateAsync: resume, isPending: isResuming } = useResume();

    const isPending = isDeleting || isCancelling || isPausing || isResuming;

    const handleDelete = async () => {
        await del({ ids: [data.id] });
        setIsDeleteOpen(false);
        onDelete?.(data.id);
    };

    const isActiveOrTrial = data.status === "active" || data.status === "trial";

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        disabled={isPending}
                    >
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() =>
                                router.push(`/subscriptions/${data.id}/edit`)
                            }
                        >
                            <Icons.Edit className="size-4" />
                            Edit
                        </DropdownMenuItem>

                        {isActiveOrTrial && (
                            <DropdownMenuItem
                                onClick={() => pause({ id: data.id })}
                            >
                                <Icons.Pause className="size-4" />
                                Pause
                            </DropdownMenuItem>
                        )}

                        {(data.status === "paused" ||
                            data.status === "cancelled" ||
                            data.status === "inactive") && (
                            <DropdownMenuItem
                                onClick={() => resume({ id: data.id })}
                            >
                                <Icons.Play className="size-4" />
                                Resume
                            </DropdownMenuItem>
                        )}

                        {data.status !== "cancelled" && (
                            <DropdownMenuItem
                                onClick={() => cancel({ id: data.id })}
                            >
                                <Icons.XCircle className="size-4" />
                                Cancel
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Icons.Trash className="size-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete &ldquo;{data.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently removes the subscription and its
                            activity history. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
