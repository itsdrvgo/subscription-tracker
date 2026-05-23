import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { SubscriptionTable } from "@/components/subscriptions";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Subscriptions",
    description: "Manage all your subscriptions",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-7xl" }}>
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
                <div className="text-center md:text-start">
                    <h1 className="text-2xl font-bold">Subscriptions</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Browse, filter, and manage every recurring service you
                        pay for.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 md:justify-end">
                    <Button asChild variant="outline">
                        <Link href="/subscriptions/categories">
                            <Icons.Folder />
                            Categories
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/subscriptions/create">
                            <Icons.Plus />
                            New subscription
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense>
                <SubscriptionTable />
            </Suspense>
        </DashShell>
    );
}
