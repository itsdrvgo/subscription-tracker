import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function POST(_: NextRequest, { params }: Context) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        const existing = await queries.subscription.get({
            userId: isAuth.user.id,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscription.update({
            userId: isAuth.user.id,
            id,
            values: {
                status: "cancelled",
                cancelledAt: new Date(),
                autoRenew: false,
            },
        });

        if (data) {
            await queries.activityLog.add({
                userId: isAuth.user.id,
                subscriptionId: id,
                subscriptionName: data.name,
                action: "cancelled",
                metadata: { previousStatus: existing.status },
            });
        }

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}
