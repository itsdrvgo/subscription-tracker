import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { upsertBudgetSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET() {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const data = await queries.budget.get({ userId: isAuth.user.id });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const body = await req.json();
        const parsed = upsertBudgetSchema.parse(body);

        const data = await queries.budget.upsert({
            userId: isAuth.user.id,
            values: parsed,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE() {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        await queries.budget.delete({ userId: isAuth.user.id });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
