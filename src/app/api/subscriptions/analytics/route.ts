import { RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const data = await queries.analytics.getDashboard({
            userId: userId!,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
