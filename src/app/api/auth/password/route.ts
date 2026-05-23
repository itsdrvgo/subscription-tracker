import { COOKIES, MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updatePasswordSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
    try {
        const isAuth = await auth();
        if (!isAuth)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const body = await req.json();
        const { currentPassword, newPassword } =
            updatePasswordSchema.parse(body);

        const existing = await queries.user.get({
            id: isAuth.user!.id,
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

        const passwordHash = await bcrypt.hash(newPassword, 10);
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
