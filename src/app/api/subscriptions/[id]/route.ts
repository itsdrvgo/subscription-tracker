import { MESSAGES } from "@/config/const";
import { queries } from "@/lib/db/queries";
import { auth } from "@/lib/jwt";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updateSubscriptionSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: Context) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        const data = await queries.subscription.get({
            userId: isAuth.user.id,
            id,
        });
        if (!data)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function PATCH(req: NextRequest, { params }: Context) {
    try {
        const isAuth = await auth();
        if (!isAuth?.user?.id)
            throw new AppError(
                MESSAGES.ERRORS.GENERAL.UNAUTHORIZED,
                "UNAUTHORIZED"
            );

        const { id } = await params;
        const body = await req.json();
        const values = updateSubscriptionSchema.parse(body);

        const existing = await queries.subscription.get({
            userId: isAuth.user.id,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscription.update({
            userId: isAuth.user.id,
            id,
            values,
        });

        if (data) {
            const statusChanged =
                values.status !== undefined &&
                values.status !== existing.status;
            const priceChanged =
                values.price !== undefined && values.price !== existing.price;

            await queries.activityLog.add({
                userId: isAuth.user.id,
                subscriptionId: id,
                subscriptionName: data.name,
                action: statusChanged
                    ? "status_changed"
                    : priceChanged
                      ? "price_changed"
                      : "updated",
                metadata: statusChanged
                    ? { from: existing.status, to: values.status }
                    : priceChanged
                      ? { from: existing.price, to: values.price }
                      : { changes: Object.keys(values) },
            });
        }

        return CResponse({ data });
    } catch (err) {
        return handleError(err);
    }
}

export async function DELETE(_: NextRequest, { params }: Context) {
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

        await queries.subscription.delete({
            userId: isAuth.user.id,
            ids: [id],
        });

        await queries.activityLog.add({
            userId: isAuth.user.id,
            subscriptionId: null,
            subscriptionName: existing.name,
            action: "deleted",
            metadata: { id },
        });

        return CResponse();
    } catch (err) {
        return handleError(err);
    }
}
