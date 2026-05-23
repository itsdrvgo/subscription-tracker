import { BudgetManager } from "@/components/billing";
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Budget",
    description: "Set spending limits and threshold alerts",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-4xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Budget</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Set spending limits and get alerted when your subscriptions
                    creep up.
                </p>
            </div>

            <BudgetManager />
        </DashShell>
    );
}
