import { DashShell } from "@/components/globals/layouts";
import { CategoryManager } from "@/components/subscriptions/category-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Categories",
    description: "Organize your subscriptions into categories",
};

export default function Page() {
    return (
        <DashShell classNames={{ innerWrapper: "max-w-6xl" }}>
            <div>
                <h1 className="text-2xl font-bold">Categories</h1>
                <p className="text-sm text-balance text-muted-foreground">
                    Group your subscriptions to see spend breakdowns and filter
                    the list faster.
                </p>
            </div>

            <CategoryManager />
        </DashShell>
    );
}
