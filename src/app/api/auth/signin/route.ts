import { COOKIES, MESSAGES, RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { signToken } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { safeUserSchema, signInSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Fixed dummy hash so failed lookups still spend bcrypt time and don't
// leak account existence via response timing.
const DUMMY_HASH =
    "$2b$10$CwTycUXWue0Thq9StjUM0uJ8r3sPWv9.LcGdSGN.OY9o6QQzS7Pmu";

export async function POST(req: NextRequest) {
    try {
        await apiGuard(req, {
            requireAuth: false,
            rateLimit: RATE_LIMITS.AUTH_STRICT,
            enforceOrigin: true,
        });

        const body = await req.json();
        const { email, password } = signInSchema.parse(body);

        const existingData = await queries.user.get({
            email,
            safeParse: false,
        });

        const hashToCompare = existingData?.password ?? DUMMY_HASH;
        const isPasswordValid = await bcrypt.compare(password, hashToCompare);

        if (!existingData || !isPasswordValid)
            throw new AppError(
                MESSAGES.ERRORS.AUTH.INVALID_CREDENTIALS,
                "UNAUTHORIZED"
            );

        const token = await signToken({ id: existingData.id });

        const cookieStore = await cookies();
        cookieStore.set(COOKIES.ADMIN, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return CResponse({ data: safeUserSchema.parse(existingData) });
    } catch (err) {
        return handleError(err);
    }
}
