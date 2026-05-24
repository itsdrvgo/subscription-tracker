import "server-only";

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";
const CACHE_SECONDS = 60 * 60 * 24;

type LatestRatesResponse = {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
};

async function fetchRates(base: string): Promise<Record<string, number>> {
    const url = `${FRANKFURTER_BASE}/latest?base=${encodeURIComponent(base)}`;
    try {
        const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
        if (!res.ok) return {};
        const data = (await res.json()) as LatestRatesResponse;
        return data.rates ?? {};
    } catch {
        return {};
    }
}

/**
 * Build a converter scoped to a single target currency. Internal cache avoids
 * re-fetching rate tables for the same base currency across calls.
 */
export async function buildCurrencyConverter(target: string) {
    const to = target.toUpperCase();
    const ratesByBase = new Map<string, Record<string, number>>();

    async function rateFor(from: string): Promise<number> {
        const f = from.toUpperCase();
        if (f === to) return 1;
        let table = ratesByBase.get(f);
        if (!table) {
            table = await fetchRates(f);
            ratesByBase.set(f, table);
        }
        const r = table[to];
        return Number.isFinite(r) && r > 0 ? r : 1;
    }

    return async (amount: number, from: string): Promise<number> => {
        if (!Number.isFinite(amount) || amount === 0) return 0;
        const r = await rateFor(from);
        return amount * r;
    };
}

export type CurrencyConverter = Awaited<
    ReturnType<typeof buildCurrencyConverter>
>;
