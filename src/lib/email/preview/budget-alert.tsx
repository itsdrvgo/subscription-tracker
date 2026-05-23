import { BudgetAlertEmail } from "../templates/budget-alert";

export default function Preview() {
    return (
        <BudgetAlertEmail
            userName="Alex"
            severity="critical"
            period="monthly"
            limit={150}
            usage={142.5}
            percent={95}
            currency="USD"
            dashboardUrl="https://example.com/dashboard"
        />
    );
}
