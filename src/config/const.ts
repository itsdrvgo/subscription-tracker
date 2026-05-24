export const MESSAGES = {
    ERRORS: {
        AUTH: {
            INVALID_CREDENTIALS: "Invalid credentials",
        },
        GENERAL: {
            GENERIC: "An error occurred, please try again",
            UNAUTHORIZED: "You are not authorized to perform this action",
            FORBIDDEN: "You do not have permission to access this resource",
            NOT_FOUND: "The requested resource was not found",
            CONFLICT: "The resource already exists",
            BAD_REQUEST: "The request is invalid",
            INTERNAL_SERVER_ERROR: "An internal server error occurred",
            INVALID_IDS: (ids: string[]) =>
                `Invalid IDs: ${ids.map((id) => `'${id}'`).join(", ")}`,
        },
    },
} as const;

export const DEFAULT_PFP_URL =
    "https://utfs.io/f/tgjx8p7aDhPeNbVvZa4UDsSHEIjC7GZY9ABuaeVPkrbivNMF" as const;

export const DEFAULT_PAGINATION = {
    GENERAL: {
        LIMIT: 10,
        PAGE: 1,
    },
} as const;

export const COOKIES = {
    ADMIN: "admin_subtrack_drvgo__419615",
} as const;

export const BILLING_CYCLES = [
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
    "custom",
] as const;

export const SUBSCRIPTION_STATUSES = [
    "active",
    "inactive",
    "cancelled",
    "paused",
    "trial",
    "expired",
    "pending",
] as const;

export const SUBSCRIPTION_PRIORITIES = ["low", "medium", "high"] as const;

// emi = fixed-term loan repayment; savings = recurring deposit that returns at
// maturity and is excluded from monthly spend totals.
export const SUBSCRIPTION_KINDS = ["subscription", "emi", "savings"] as const;

export const PAYMENT_SOURCE_TYPES = [
    "play_store",
    "app_store",
    "credit_card",
    "upi_credit_card",
    "debit_card",
    "paypal",
    "upi",
    "bank",
    "manual",
    "custom",
] as const;

export const ACTIVITY_ACTIONS = [
    "created",
    "updated",
    "deleted",
    "renewed",
    "cancelled",
    "paused",
    "resumed",
    "trial_ended",
    "reminder_sent",
    "status_changed",
    "price_changed",
] as const;

export const REMINDER_TYPES = [
    "renewal",
    "trial_ending",
    "budget_warning",
    "budget_critical",
    "budget_exceeded",
    "monthly_summary",
] as const;

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

export const RATE_LIMITS = {
    AUTH_STRICT: { limit: 5, windowMs: 60_000 },
    AUTH_GENERAL: { limit: 30, windowMs: 60_000 },
    READ: { limit: 120, windowMs: 60_000 },
    WRITE: { limit: 30, windowMs: 60_000 },
    MUTATING_BULK: { limit: 10, windowMs: 60_000 },
    CRON: { limit: 12, windowMs: 60_000 },
    EDGE_GLOBAL: { limit: 300, windowMs: 60_000 },
} as const;

export const BUDGET_QUERY_KEY = ["budget"] as const;
export const PAYMENT_SOURCE_QUERY_KEY = ["payment-source"] as const;
export const SUBSCRIPTION_CATEGORY_QUERY_KEY = ["subscription-category"] as const;
export const SUBSCRIPTION_QUERY_KEY = ["subscription"] as const;
export const SUBSCRIPTION_ANALYTICS_QUERY_KEY = [
    "subscription",
    "analytics",
] as const;
export const SUBSCRIPTION_ACTIVITY_QUERY_KEY = [
    "subscription",
    "activity",
] as const;

export type RateLimitPreset = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];
