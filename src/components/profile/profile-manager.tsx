"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { PasswordInput } from "@/components/ui/password";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/rq";
import {
    UpdateEmail,
    updateEmailSchema,
    UpdatePassword,
    updatePasswordSchema,
    UpdateProfile,
    updateProfileSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";

export function ProfileManager() {
    const { useCurrentUser } = useAuth();
    const { data: user, isPending } = useCurrentUser();

    if (isPending || !user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Tabs defaultValue="general">
            <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
                <GeneralTab
                    firstName={user.firstName}
                    lastName={user.lastName}
                />
            </TabsContent>

            <TabsContent value="email">
                <EmailTab currentEmail={user.email} />
            </TabsContent>

            <TabsContent value="password">
                <PasswordTab />
            </TabsContent>
        </Tabs>
    );
}

function GeneralTab({
    firstName,
    lastName,
}: {
    firstName: string;
    lastName: string;
}) {
    const { useUpdateProfile } = useAuth();
    const { mutateAsync, isPending } = useUpdateProfile();

    const form = useForm<UpdateProfile>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: { firstName, lastName },
    });

    useEffect(() => {
        form.reset({ firstName, lastName });
    }, [firstName, lastName, form]);

    const onSubmit = async (values: UpdateProfile) => {
        await mutateAsync(values);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                    Update the name shown across the app.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Jane"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Doe"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    isPending || !form.formState.isDirty
                                }
                            >
                                Save changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function EmailTab({ currentEmail }: { currentEmail: string }) {
    const { useUpdateEmail } = useAuth();
    const { mutateAsync, isPending } = useUpdateEmail();

    const form = useForm<UpdateEmail>({
        resolver: zodResolver(updateEmailSchema),
        defaultValues: { email: "", currentPassword: "" },
    });

    const onSubmit = async (values: UpdateEmail) => {
        await mutateAsync(values);
        form.reset({ email: "", currentPassword: "" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                    Currently signed in as{" "}
                    <span className="font-medium text-foreground">
                        {currentEmail}
                    </span>
                    . Changing your email signs you out of every device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="newemail@example.com"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            {...field}
                                            placeholder="**********"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Confirm your password to change your
                                        email.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    isPending || !form.formState.isDirty
                                }
                            >
                                Update email
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function PasswordTab() {
    const { useUpdatePassword } = useAuth();
    const { mutateAsync, isPending } = useUpdatePassword();

    const form = useForm<UpdatePassword>({
        resolver: zodResolver(
            updatePasswordSchema
        ) as unknown as Resolver<UpdatePassword>,
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: UpdatePassword) => {
        await mutateAsync(values);
        form.reset({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                    Choose a strong password. Changing it signs you out of every
                    device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            {...field}
                                            placeholder="**********"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            {...field}
                                            placeholder="**********"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        At least 8 characters with one
                                        uppercase, one lowercase, one number,
                                        and one special character.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm new password</FormLabel>
                                    <FormControl>
                                        <PasswordInput
                                            {...field}
                                            placeholder="**********"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    isPending || !form.formState.isDirty
                                }
                            >
                                Update password
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
