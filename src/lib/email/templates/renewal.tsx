import { BILLING_CYCLE_LABELS } from "@/config/subscription";
import { formatCurrency } from "@/lib/utils";
import { FullSubscription } from "@/lib/validations";
import { render, Text } from "react-email";
import { DetailsTable, EmailLayout, PrimaryButton } from "./layout";

type Props = {
    userName: string;
    subscription: FullSubscription;
    daysUntilRenewal: number;
    dashboardUrl: string;
};

export function RenewalReminderEmail({
    userName,
    subscription,
    daysUntilRenewal,
    dashboardUrl,
}: Props) {
    const subject =
        daysUntilRenewal <= 0
            ? `${subscription.name} renews today`
            : daysUntilRenewal === 1
              ? `${subscription.name} renews tomorrow`
              : `${subscription.name} renews in ${daysUntilRenewal} days`;

    const whenPhrase =
        daysUntilRenewal <= 0
            ? "today"
            : daysUntilRenewal === 1
              ? "tomorrow"
              : `in ${daysUntilRenewal} days`;

    return (
        <EmailLayout
            title={subject}
            preview={`${subscription.name} renews ${whenPhrase}`}
        >
            <Text style={{ marginTop: 0 }}>Hi {userName},</Text>
            <Text>
                Your subscription to{" "}
                <strong style={{ color: "#f5f5f5" }}>
                    {subscription.name}
                </strong>{" "}
                is set to renew {whenPhrase}.
            </Text>

            <DetailsTable
                rows={[
                    {
                        label: "Amount",
                        value: formatCurrency(
                            subscription.price,
                            subscription.currency,
                            { keepDecimals: true }
                        ),
                    },
                    {
                        label: "Billing cycle",
                        value: BILLING_CYCLE_LABELS[subscription.billingCycle],
                    },
                    {
                        label: "Renewal date",
                        value: subscription.nextRenewalDate.toLocaleDateString(
                            "en-US",
                            {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }
                        ),
                    },
                    ...(subscription.paymentSource
                        ? [
                              {
                                  label: "Payment source",
                                  value: subscription.paymentSource.name,
                              },
                          ]
                        : []),
                ]}
            />

            <Text style={{ marginTop: 20 }}>
                If you no longer need this subscription, you can cancel it from
                the dashboard before it renews.
            </Text>
            <PrimaryButton href={dashboardUrl}>View subscription</PrimaryButton>
        </EmailLayout>
    );
}

export async function renewalReminderEmail(params: Props): Promise<{
    subject: string;
    html: string;
    text: string;
}> {
    const subject =
        params.daysUntilRenewal <= 0
            ? `${params.subscription.name} renews today`
            : params.daysUntilRenewal === 1
              ? `${params.subscription.name} renews tomorrow`
              : `${params.subscription.name} renews in ${params.daysUntilRenewal} days`;

    const element = <RenewalReminderEmail {...params} />;
    const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
    ]);

    return { subject, html, text };
}

export default RenewalReminderEmail;
