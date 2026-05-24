import { COOKIES, MESSAGES } from "@/config/const";
import { apiGuard, RATE_LIMITS } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updatePasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.AUTH_STRICT,
            enforceOrigin: true,
        });

        const body = await req.json();
        const { currentPassword, newPassword } =
            updatePasswordSchema.parse(body);

        const existing = await queries.user.get({
            id: userId!,
            safeParse: false,
        });
        if (!existing)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            existing.password
        );
        if (!isPasswordValid)
            throw new AppError(
                MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
                "FORBIDDEN"
            );

        const passwordHash = await bcrypt.hash(newPassword, 12);
        const data = await queries.user.updatePassword({
            id: existing.id,
            passwordHash,
        });

        const cookieStore = await cookies();
        cookieStore.delete(COOKIES.ADMIN);

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
