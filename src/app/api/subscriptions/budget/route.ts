import { RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { CResponse, handleError } from "@/lib/utils";
import { upsertBudgetSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const data = await queries.budget.get({ userId: userId! });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const body = await req.json();
        const parsed = upsertBudgetSchema.parse(body);

        const data = await queries.budget.upsert({
            userId: userId!,
            values: parsed,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        await queries.budget.delete({ userId: userId! });
        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
