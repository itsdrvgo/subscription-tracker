import { formatCurrency } from "@/lib/subscription";
import { FullSubscription } from "@/lib/validations";
import { render, Text } from "react-email";
import { DetailsTable, EmailLayout, PrimaryButton } from "./layout";

type Props = {
    userName: string;
    subscription: FullSubscription;
    daysUntilEnd: number;
    dashboardUrl: string;
};

export function TrialEndingEmail({
    userName,
    subscription,
    daysUntilEnd,
    dashboardUrl,
}: Props) {
    const subject =
        daysUntilEnd <= 0
            ? `Your ${subscription.name} trial ends today`
            : daysUntilEnd === 1
              ? `Your ${subscription.name} trial ends tomorrow`
              : `Your ${subscription.name} trial ends in ${daysUntilEnd} days`;

    const whenPhrase =
        daysUntilEnd <= 0
            ? "today"
            : daysUntilEnd === 1
              ? "tomorrow"
              : `in ${daysUntilEnd} days`;

    return (
        <EmailLayout title={subject} preview={subject}>
            <Text style={{ marginTop: 0 }}>Hi {userName},</Text>
            <Text>
                Your free trial of{" "}
                <strong style={{ color: "#f5f5f5" }}>
                    {subscription.name}
                </strong>{" "}
                ends {whenPhrase}. After that, you&apos;ll be billed at the
                regular rate unless you cancel.
            </Text>

            <DetailsTable
                rows={[
                    {
                        label: "Rate after trial",
                        value: formatCurrency(
                            subscription.price,
                            subscription.currency,
                            { keepDecimals: true }
                        ),
                    },
                    {
                        label: "Trial ends",
                        value: (
                            subscription.trialEndDate ??
                            subscription.nextRenewalDate
                        ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                    },
                ]}
            />

            <Text style={{ marginTop: 20 }}>
                Make a decision before the trial ends to avoid surprise charges.
            </Text>
            <PrimaryButton href={dashboardUrl}>
                Review subscription
            </PrimaryButton>
        </EmailLayout>
    );
}

export async function trialEndingEmail(params: Props): Promise<{
    subject: string;
    html: string;
    text: string;
}> {
    const subject =
        params.daysUntilEnd <= 0
            ? `Your ${params.subscription.name} trial ends today`
            : params.daysUntilEnd === 1
              ? `Your ${params.subscription.name} trial ends tomorrow`
              : `Your ${params.subscription.name} trial ends in ${params.daysUntilEnd} days`;

    const element = <TrialEndingEmail {...params} />;
    const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
    ]);

    return { subject, html, text };
}

export default TrialEndingEmail;
