import { FullSubscription } from "@/lib/validations";
import { TrialEndingEmail } from "../templates/trial-ending";

const sampleSubscription: FullSubscription = {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    categoryId: null,
    paymentSourceId: null,
    name: "ChatGPT Plus",
    description: null,
    websiteUrl: null,
    logoUrl: null,
    tags: [],
    kind: "subscription",
    billingCycle: "monthly",
    customIntervalDays: null,
    price: "20.00",
    trialPrice: "0",
    yearlyPrice: null,
    currency: "USD",
    taxAmount: "0",
    discountAmount: "0",
    startDate: new Date("2025-01-01"),
    nextRenewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: null,
    autoRenew: true,
    isTrial: true,
    trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: "trial",
    priority: "high",
    reminderEnabled: true,
    reminderDaysBefore: 3,
    notes: null,
    lastReminderSentAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    paymentSource: null,
};

export default function Preview() {
    return (
        <TrialEndingEmail
            userName="Alex"
            subscription={sampleSubscription}
            daysUntilEnd={2}
            dashboardUrl="https://example.com/dashboard"
        />
    );
}
