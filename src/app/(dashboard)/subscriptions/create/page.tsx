import { DashShell } from "@/components/globals/layouts";
import { SubscriptionFormFetch } from "@/components/subscriptions/forms";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "New subscription",
    description: "Add a new subscription to track",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-7xl" }}>
            <div>
                <h1 className="text-2xl font-bold">New subscription</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Start tracking a new recurring service.
                </p>
            </div>

            <SubscriptionFormFetch type="create" />
        </DashShell>
    );
}
