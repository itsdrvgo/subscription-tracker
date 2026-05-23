import { COOKIES, MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updateEmailSchema } from "@/lib/validations";
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
        const { email, currentPassword } = updateEmailSchema.parse(body);

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

        if (email === existing.email)
            throw new AppError(
                "New email must be different from your current email",
                "BAD_REQUEST"
            );

        const emailOwner = await queries.user.get({ email });
        if (emailOwner && emailOwner.id !== existing.id)
            throw new AppError(
                "An account with this email already exists",
                "CONFLICT"
            );

        const data = await queries.user.updateEmail({
            id: existing.id,
            email,
        });

        const cookieStore = await cookies();
        cookieStore.delete(COOKIES.ADMIN);

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
