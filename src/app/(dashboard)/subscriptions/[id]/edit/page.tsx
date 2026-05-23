import { DashShell } from "@/components/globals/layouts";
import { SubscriptionFormFetch } from "@/components/subscriptions/forms";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit subscription",
    description: "Update subscription details",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-7xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Edit subscription</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Adjust pricing, renewal, and reminders.
                </p>
            </div>

            <SubscriptionFormFetch type="edit" />
        </DashShell>
    );
}
