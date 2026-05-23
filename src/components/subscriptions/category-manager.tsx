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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionCategory } from "@/lib/rq";
import { slugify } from "@/lib/utils";
import {
    CreateSubscriptionCategory,
    createSubscriptionCategorySchema,
    SubscriptionCategory,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function CategoryManager() {
    const [editing, setEditing] = useState<SubscriptionCategory | null>(null);
    const { useScan } = useSubscriptionCategory();
    const { data, isPending } = useScan({});

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {editing ? "Edit category" : "New category"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryForm
                        key={editing?.id ?? "new"}
                        editing={editing}
                        onFinish={() => setEditing(null)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {isPending ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))
                    ) : !data?.length ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No categories yet. Create one to organize your
                            subscriptions.
                        </p>
                    ) : (
                        data.map((category) => (
                            <CategoryRow
                                key={category.id}
                                category={category}
                                onEdit={() => setEditing(category)}
                            />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function CategoryForm({
    editing,
    onFinish,
}: {
    editing: SubscriptionCategory | null;
    onFinish: () => void;
}) {
    const isEdit = !!editing;

    const form = useForm<CreateSubscriptionCategory>({
        resolver: zodResolver(createSubscriptionCategorySchema),
        defaultValues: {
            name: editing?.name ?? "",
            slug: editing?.slug ?? "",
            color: editing?.color ?? null,
            icon: editing?.icon ?? null,
        },
    });

    const { useCreate, useUpdate } = useSubscriptionCategory();
    const { mutateAsync: createCategory, isPending: isCreating } = useCreate();
    const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdate();
    const isSubmitting = isCreating || isUpdating;

    const handleSubmit = async (values: CreateSubscriptionCategory) => {
        if (isEdit && editing) {
            await updateCategory({ id: editing.id, values });
        } else {
            await createCategory([values]);
        }
        form.reset({ name: "", slug: "", color: null, icon: null });
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
                                    placeholder="e.g. Streaming"
                                    disabled={isSubmitting}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (
                                            !isEdit &&
                                            !form.getFieldState("slug").isDirty
                                        ) {
                                            form.setValue(
                                                "slug",
                                                slugify(e.target.value),
                                                { shouldValidate: false }
                                            );
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
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
                                    slug: "",
                                    color: null,
                                    icon: null,
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
                        {isEdit ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function CategoryRow({
    category,
    onEdit,
}: {
    category: SubscriptionCategory;
    onEdit: () => void;
}) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const { useDelete } = useSubscriptionCategory();
    const { mutateAsync, isPending } = useDelete();

    const handleDelete = async () => {
        await mutateAsync({ ids: [category.id] });
        setIsDeleteOpen(false);
    };

    return (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-background p-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                    {category.slug}
                </p>
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
                            Delete &ldquo;{category.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Subscriptions assigned to this category will keep
                            working but be marked uncategorized.
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
