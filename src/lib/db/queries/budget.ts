import { Budget, budgetSchema, UpsertBudget } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { db } from "../client";
import { budgets } from "../schemas";

class BudgetQuery {
    async get({ userId }: { userId: string }): Promise<Budget | null> {
        const data = await db.query.budgets.findFirst({
            where: { userId },
        });
        if (!data) return null;
        return budgetSchema.parse(data);
    }

    async upsert({
        userId,
        values,
    }: {
        userId: string;
        values: UpsertBudget;
    }): Promise<Budget> {
        const existing = await db.query.budgets.findFirst({
            where: { userId },
        });

        const payload = {
            monthlyLimit: values.monthlyLimit ?? null,
            yearlyLimit: values.yearlyLimit ?? null,
            warningThreshold: values.warningThreshold,
            criticalThreshold: values.criticalThreshold,
            currency: values.currency,
        };

        if (existing) {
            const updated = await db
                .update(budgets)
                .set({ ...payload, updatedAt: new Date() })
                .where(eq(budgets.userId, userId))
                .returning()
                .then((res) => res[0]!);
            return budgetSchema.parse(updated);
        }

        const created = await db
            .insert(budgets)
            .values({ ...payload, userId })
            .returning()
            .then((res) => res[0]!);
        return budgetSchema.parse(created);
    }

    async delete({ userId }: { userId: string }) {
        return db.delete(budgets).where(eq(budgets.userId, userId)).returning();
    }
}

export const budgetQueries = new BudgetQuery();
