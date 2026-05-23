import { PaymentSourceManager } from "@/components/billing/payment-source-manager";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Payment sources",
    description: "Manage payment sources used by your subscriptions",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-6xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Payment sources</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Track which card or account funds each subscription so you
                    can see spend by source.
                </p>
            </div>

            <PaymentSourceManager />
        </DashShell>
    );
}
