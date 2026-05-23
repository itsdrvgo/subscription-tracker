import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Billing",
    description: "Manage payment sources and budgets",
};

const cards = [
    {
        title: "Payment sources",
        description:
            "Cards, wallets, and accounts that fund your recurring charges.",
        href: "/billing/payment-sources",
        icon: Icons.CreditCard,
    },
    {
        title: "Budget",
        description:
            "Set monthly and yearly limits and get alerted as you approach them.",
        href: "/billing/budget",
        icon: Icons.PiggyBank,
    },
];

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-6xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Billing</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Manage how subscriptions are funded and track your spending
                    against a budget.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Link key={c.href} href={c.href}>
                            <Card className="transition-colors hover:border-primary/40">
                                <CardHeader>
                                    <Icon className="size-5 text-muted-foreground" />
                                    <CardTitle>{c.title}</CardTitle>
                                    <CardDescription>
                                        {c.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex items-center gap-1 text-xs text-muted-foreground">
                                    Open <Icons.ArrowRight className="size-3" />
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </DashShell>
    );
}
