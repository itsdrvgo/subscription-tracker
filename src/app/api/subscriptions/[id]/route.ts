import { MESSAGES, RATE_LIMITS } from "@/config/const";
import { apiGuard } from "@/lib/api/security";
import { queries } from "@/lib/db/queries";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { updateSubscriptionSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

interface Context {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.READ,
        });

        const { id } = await params;
        const data = await queries.subscription.get({
            userId: userId!,
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
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const { id } = await params;
        const body = await req.json();
        const values = updateSubscriptionSchema.parse(body);

        const existing = await queries.subscription.get({
            userId: userId!,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        const data = await queries.subscription.update({
            userId: userId!,
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
                userId: userId!,
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

export async function DELETE(req: NextRequest, { params }: Context) {
    try {
        const { userId } = await apiGuard(req, {
            rateLimit: RATE_LIMITS.WRITE,
            enforceOrigin: true,
        });

        const { id } = await params;
        const existing = await queries.subscription.get({
            userId: userId!,
            id,
        });
        if (!existing)
            throw new AppError(MESSAGES.ERRORS.GENERAL.NOT_FOUND, "NOT_FOUND");

        await queries.subscription.delete({
            userId: userId!,
            ids: [id],
        });

        await queries.activityLog.add({
            userId: userId!,
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
