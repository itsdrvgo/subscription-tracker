import { formatCurrency } from "@/lib/utils";
import { render, Text } from "react-email";
import { DetailsTable, EmailLayout, PrimaryButton } from "./layout";

type Severity = "warning" | "critical" | "exceeded";

type Props = {
    userName: string;
    severity: Severity;
    period: "monthly" | "yearly";
    limit: number;
    usage: number;
    percent: number;
    currency: string;
    dashboardUrl: string;
};

const SEVERITY_LABEL: Record<Severity, string> = {
    exceeded: "Budget exceeded",
    critical: "Budget critical",
    warning: "Budget warning",
};

const SEVERITY_COLOR: Record<Severity, string> = {
    exceeded: "#f87171",
    critical: "#fbbf24",
    warning: "#fcd34d",
};

export function BudgetAlertEmail({
    userName,
    severity,
    period,
    limit,
    usage,
    percent,
    currency,
    dashboardUrl,
}: Props) {
    const subject = `${SEVERITY_LABEL[severity]}: ${period} subscription spending at ${Math.round(percent)}%`;

    return (
        <EmailLayout
            title={subject}
            preview={`${SEVERITY_LABEL[severity]} — ${Math.round(percent)}% of your ${period} budget`}
        >
            <Text style={{ marginTop: 0 }}>Hi {userName},</Text>
            <Text>
                Your <strong>{period}</strong> subscription spending has reached{" "}
                <strong style={{ color: SEVERITY_COLOR[severity] }}>
                    {Math.round(percent)}%
                </strong>{" "}
                of your configured limit.
            </Text>

            <DetailsTable
                rows={[
                    { label: "Limit", value: formatCurrency(limit, currency) },
                    {
                        label: "Spent so far",
                        value: formatCurrency(usage, currency),
                    },
                    { label: "Usage", value: `${percent.toFixed(1)}%` },
                    {
                        label: "Period",
                        value:
                            period === "monthly" ? "This month" : "This year",
                    },
                ]}
            />

            <Text style={{ marginTop: 20 }}>
                Review your subscriptions and pause or cancel any you no longer
                need.
            </Text>
            <PrimaryButton href={dashboardUrl}>
                Review subscriptions
            </PrimaryButton>
        </EmailLayout>
    );
}

export async function budgetAlertEmail(params: Props): Promise<{
    subject: string;
    html: string;
    text: string;
}> {
    const subject = `${SEVERITY_LABEL[params.severity]}: ${params.period} subscription spending at ${Math.round(params.percent)}%`;

    const element = <BudgetAlertEmail {...params} />;
    const [html, text] = await Promise.all([
        render(element),
        render(element, { plainText: true }),
    ]);

    return { subject, html, text };
}

export default BudgetAlertEmail;
