import { formatCurrency } from "@/lib/subscription";
import { render, Text } from "react-email";
import { DetailsTable, EmailLayout, PrimaryButton } from "./layout";

type TopSubscription = {
    name: string;
    monthlyCost: number;
    currency: string;
};

type Props = {
    userName: string;
    monthLabel: string;
    totalSpend: number;
    currency: string;
    activeCount: number;
    upcomingCount: number;
    trialsEnding: number;
    topSubscriptions: TopSubscription[];
    dashboardUrl: string;
};

export function MonthlySummaryEmail({
    userName,
    monthLabel,
    totalSpend,
    currency,
    activeCount,
    upcomingCount,
    trialsEnding,
    topSubscriptions,
    dashboardUrl,
}: Props) {
    const subject = `${monthLabel} subscription summary`;

    return (
        <EmailLayout
            title={subject}
            preview={`Your ${monthLabel} subscription summary`}
        >
            <Text style={{ marginTop: 0 }}>Hi {userName},</Text>
            <Text>
                Here&apos;s your subscription snapshot for{" "}
                <strong>{monthLabel}</strong>.
            </Text>

            <DetailsTable
                rows={[
                    {
                        label: "Total monthly spend",
                        value: formatCurrency(totalSpend, currency),
                    },
                    {
                        label: "Active subscriptions",
                        value: String(activeCount),
                    },
                    {
                        label: "Upcoming renewals (30d)",
                        value: String(upcomingCount),
                    },
                    {
                        label: "Trials ending soon",
                        value: String(trialsEnding),
                    },
                ]}
            />

            {topSubscriptions.length > 0 ? (
                <>
                    <Text
                        style={{
                            margin: "24px 0 0 0",
                            color: "#f5f5f5",
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        Top subscriptions
                    </Text>
                    <table
                        role="presentation"
                        cellSpacing={0}
                        cellPadding={0}
                        width="100%"
                        style={{ marginTop: 12, borderCollapse: "collapse" }}
                    >
                        <tbody>
                            {topSubscriptions.map((s) => (
                                <tr key={s.name}>
                                    <td
                                        style={{
                                            padding: "10px 0",
                                            borderBottom: "1px solid #1f1f22",
                                            color: "#f5f5f5",
                                            fontSize: 14,
                                        }}
                                    >
                                        {s.name}
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 0",
                                            borderBottom: "1px solid #1f1f22",
                                            color: "#d4d4d8",
                                            fontSize: 14,
                                            textAlign: "right",
                                        }}
                                    >
                                        {formatCurrency(
                                            s.monthlyCost,
                                            s.currency
                                        )}
                                        /mo
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : null}

            <PrimaryButton href={dashboardUrl}>Open dashboard</PrimaryButton>
        </EmailLayout>
    );
}

export async function monthlySummaryEmail(params: Props): Promise<{
    subject: string;
    html: string;
    text: string;
}> {
    const subject = `${params.monthLabel} subscription summary`;
    const element = <MonthlySummaryEmail {...params} />;
    const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
    ]);
    return { subject, html, text };
}

export default MonthlySummaryEmail;
