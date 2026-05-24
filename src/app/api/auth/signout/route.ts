import { COOKIES } from "@/config/const";
import { apiGuard, RATE_LIMITS } from "@/lib/api/security";
import { CResponse, handleError } from "@/lib/utils";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await apiGuard(req, {
            requireAuth: false,
            rateLimit: RATE_LIMITS.AUTH_GENERAL,
            enforceOrigin: true,
        });

        const cookieStore = await cookies();
        cookieStore.delete(COOKIES.ADMIN);

        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
