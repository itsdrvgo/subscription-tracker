import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";

export async function GET() {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const data = await queries.analytics.getDashboard({
            userId: isAuth.user.id,
        });
        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
