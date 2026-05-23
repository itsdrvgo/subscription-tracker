import { ActivityPage } from "@/components/dashboard";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Activity",
    description: "All actions taken across your subscriptions",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-5xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Activity</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    A complete log of every event recorded across your
                    subscriptions.
                </p>
            </div>

            <Suspense>
                <ActivityPage />
            </Suspense>
        </DashShell>
    );
}
