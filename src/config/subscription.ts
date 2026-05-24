import {
    BILLING_CYCLES,
    PAYMENT_SOURCE_TYPES,
    SUBSCRIPTION_KINDS,
    SUBSCRIPTION_PRIORITIES,
    SUBSCRIPTION_STATUSES,
} from "@/lib/db/schemas";

export const BILLING_CYCLE_LABELS: Record<
    (typeof BILLING_CYCLES)[number],
    string
> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    custom: "Custom",
};

export const STATUS_LABELS: Record<
    (typeof SUBSCRIPTION_STATUSES)[number],
    string
> = {
    active: "Active",
    inactive: "Inactive",
    cancelled: "Cancelled",
    paused: "Paused",
    trial: "Trial",
    expired: "Expired",
    pending: "Pending",
};

export const STATUS_VARIANTS: Record<
    (typeof SUBSCRIPTION_STATUSES)[number],
    "default" | "secondary" | "destructive" | "outline"
> = {
    active: "default",
    inactive: "secondary",
    cancelled: "destructive",
    paused: "outline",
    trial: "outline",
    expired: "destructive",
    pending: "outline",
};

export const KIND_LABELS: Record<
    (typeof SUBSCRIPTION_KINDS)[number],
    string
> = {
    subscription: "Subscription",
    emi: "EMI",
    savings: "Savings",
};

export const KIND_DESCRIPTIONS: Record<
    (typeof SUBSCRIPTION_KINDS)[number],
    string
> = {
    subscription: "Recurring expense like Netflix or Spotify.",
    emi: "Fixed-term loan repayment — counts as spend until paid off.",
    savings: "Recurring deposit (RD/PPF) — debited monthly, returned at maturity.",
};

export const PRIORITY_LABELS: Record<
    (typeof SUBSCRIPTION_PRIORITIES)[number],
    string
> = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

export const PAYMENT_SOURCE_TYPE_LABELS: Record<
    (typeof PAYMENT_SOURCE_TYPES)[number],
    string
> = {
    play_store: "Play Store",
    app_store: "App Store",
    credit_card: "Credit Card",
    upi_credit_card: "UPI Credit Card",
    debit_card: "Debit Card",
    paypal: "PayPal",
    upi: "UPI",
    bank: "Bank Account",
    manual: "Manual",
    custom: "Custom",
};

export const CURRENCIES = [
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "GBP", symbol: "£", label: "British Pound" },
    { code: "INR", symbol: "₹", label: "Indian Rupee" },
    { code: "JPY", symbol: "¥", label: "Japanese Yen" },
    { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", label: "Australian Dollar" },
    { code: "CHF", symbol: "Fr", label: "Swiss Franc" },
    { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = CURRENCIES.reduce(
    (acc, c) => {
        acc[c.code] = c.symbol;
        return acc;
    },
    {} as Record<string, string>
);

export const DEFAULT_REMINDER_DAYS = 1;
