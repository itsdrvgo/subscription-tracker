import { MonthlySummaryEmail } from "../templates/monthly-summary";

export default function Preview() {
    return (
        <MonthlySummaryEmail
            userName="Alex"
            monthLabel="May 2026"
            totalSpend={87.42}
            currency="USD"
            activeCount={12}
            upcomingCount={4}
            trialsEnding={1}
            topSubscriptions={[
                { name: "Netflix", monthlyCost: 15.49, currency: "USD" },
                { name: "Claude Pro", monthlyCost: 20, currency: "USD" },
                { name: "AWS", monthlyCost: 18.32, currency: "USD" },
            ]}
            dashboardUrl="https://example.com/dashboard"
        />
    );
}
