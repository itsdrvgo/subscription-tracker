import { env } from "@/env";

export type SendEmailParams = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
};

export type SendEmailResult = {
    ok: boolean;
    id?: string;
    skipped?: boolean;
    error?: string;
};

/**
 * Sends a transactional email via Resend.
 *
 * If RESEND_API_KEY is unset, the email is logged instead of sent — this
 * keeps local development self-contained and lets the cron exercise its
 * full code path without an external dependency. Failures from Resend are
 * caught and returned in the result, never thrown.
 */
export async function sendEmail(
    params: SendEmailParams
): Promise<SendEmailResult> {
    const apiKey = env.RESEND_API_KEY;
    const from = params.from ?? env.EMAIL_FROM;

    if (!apiKey) {
        console.log("[email:skip] no RESEND_API_KEY set", {
            to: params.to,
            subject: params.subject,
        });
        return { ok: true, skipped: true };
    }

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(params.to) ? params.to : [params.to],
                subject: params.subject,
                html: params.html,
                text: params.text,
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text().catch(() => "");
            console.error("[email:fail] resend", res.status, errorBody);
            return {
                ok: false,
                error: `Resend returned ${res.status}: ${errorBody}`,
            };
        }

        const data = (await res.json()) as { id?: string };
        return { ok: true, id: data.id };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[email:fail] exception", message);
        return { ok: false, error: message };
    }
}
