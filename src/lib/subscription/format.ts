import { CURRENCY_SYMBOLS } from "@/config/subscription";

export function formatCurrency(
    amount: number | string | null | undefined,
    currency: string = "USD",
    options: { keepDecimals?: boolean; compact?: boolean } = {}
): string {
    const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
    if (!Number.isFinite(n)) return "—";

    const { keepDecimals = true, compact = false } = options;

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: keepDecimals ? 2 : 0,
            maximumFractionDigits: keepDecimals ? 2 : 0,
            notation: compact ? "compact" : "standard",
        }).format(n);
    } catch {
        const symbol = CURRENCY_SYMBOLS[currency] ?? currency + " ";
        return `${symbol}${keepDecimals ? n.toFixed(2) : Math.round(n)}`;
    }
}

export function parseNumeric(
    value: string | number | null | undefined
): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}
