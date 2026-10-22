/** Server-side Yahoo chart pull. Delayed ~15m. Not a live pit. */

export type LiveQuote = {
  symbol: string;
  price: number | null;
  prevClose: number | null;
  chgPct: number | null;
  currency: string | null;
  spark: number[];
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function one(symbol: string): Promise<LiveQuote> {
  const empty: LiveQuote = { symbol, price: null, prevClose: null, chgPct: null, currency: null, spark: [] };
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return empty;
    const d = (await res.json()) as {
      chart?: { result?: { meta?: Record<string, unknown>; indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
    };
    const row = d.chart?.result?.[0];
    if (!row?.meta) return empty;
    const meta = row.meta;
    const price = num(meta.regularMarketPrice);
    const prev = num(meta.chartPreviousClose) ?? num(meta.previousClose);
    const closes = (row.indicators?.quote?.[0]?.close || []).filter((x): x is number => typeof x === "number");
    const spark = closes.filter((_, i) => i % 5 === 0 || i === closes.length - 1).slice(-36);
    const chgPct = price != null && prev ? ((price / prev - 1) * 100) : null;
    return {
      symbol,
      price,
      prevClose: prev,
      chgPct: chgPct != null ? Math.round(chgPct * 100) / 100 : null,
      currency: typeof meta.currency === "string" ? meta.currency : null,
      spark,
    };
  } catch {
    return empty;
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function fetchQuotes(symbols: string[]): Promise<LiveQuote[]> {
  const uniq = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))].slice(0, 40);
  const out: LiveQuote[] = [];
  const n = 6;
  for (let i = 0; i < uniq.length; i += n) {
    const batch = uniq.slice(i, i + n);
    out.push(...(await Promise.all(batch.map(one))));
  }
  return out;
}
