import { DashboardView } from "@/components/dashboard";
import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Overview of your subscriptions, spending, and renewals",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-7xl" }}>
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
                <div className="text-center md:text-start">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Your subscriptions, spending, and upcoming renewals at a
                        glance.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 md:justify-end">
                    <Button asChild variant="outline">
                        <Link href="/subscriptions">
                            <Icons.Receipt />
                            All subscriptions
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/subscriptions/create">
                            <Icons.Plus />
                            Add subscription
                        </Link>
                    </Button>
                </div>
            </div>

            <Suspense>
                <DashboardView />
            </Suspense>
        </DashShell>
    );
}
