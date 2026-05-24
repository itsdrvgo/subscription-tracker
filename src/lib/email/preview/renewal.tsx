import { FullSubscription } from "@/lib/validations";
import { RenewalReminderEmail } from "../templates/renewal";

const sampleSubscription: FullSubscription = {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    categoryId: null,
    paymentSourceId: "00000000-0000-0000-0000-000000000003",
    name: "Netflix",
    description: null,
    websiteUrl: null,
    logoUrl: null,
    tags: [],
    billingCycle: "monthly",
    customIntervalDays: null,
    price: "15.49",
    trialPrice: null,
    yearlyPrice: null,
    currency: "USD",
    taxAmount: "0",
    discountAmount: "0",
    startDate: new Date("2025-01-01"),
    nextRenewalDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    autoRenew: true,
    isTrial: false,
    trialEndDate: null,
    status: "active",
    priority: "medium",
    reminderEnabled: true,
    reminderDaysBefore: 1,
    notes: null,
    lastReminderSentAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: null,
    paymentSource: {
        id: "00000000-0000-0000-0000-000000000003",
        userId: "00000000-0000-0000-0000-000000000002",
        name: "Chase Sapphire",
        type: "credit_card",
        identifier: "4242",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
};

export default function Preview() {
    return (
        <RenewalReminderEmail
            userName="Alex"
            subscription={sampleSubscription}
            daysUntilRenewal={1}
            dashboardUrl="https://example.com/dashboard"
        />
    );
}
