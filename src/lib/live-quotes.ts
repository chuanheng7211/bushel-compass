import { useEffect, useState } from "react";
import type { LiveQuote } from "./yahoo-quotes";

export type QuoteTape = {
  live: boolean;
  asof: string | null;
  by: Map<string, LiveQuote>;
};

export const COST_STACK: { symbol: string; k: string; so: string }[] = [
  { symbol: "NTR", k: "Potash / N", so: "Next planting's floor. Not this week's FOB." },
  { symbol: "UAN", k: "Urea", so: "Nitrogen closest to a farm invoice." },
  { symbol: "HO=F", k: "Diesel", so: "Reefer miles. Landed can rise with FOB flat." },
  { symbol: "NG=F", k: "Nat gas", so: "Greenhouse heat. Ontario winter glass." },
  { symbol: "KNX", k: "Truck", so: "Salinas / Yakima / Nogales lanes." },
  { symbol: "USDCAD=X", k: "USD/CAD", so: "US FOB costs more in CAD when this rips." },
  { symbol: "USDMXN=X", k: "USD/MXN", so: "Mexico winter veg and Hass in dollars." },
  { symbol: "ZIM", k: "Boat", so: "Chile / Peru / NZ counter-season." },
];

export function useLiveQuotes(symbols: string[], ms = 20000): QuoteTape {
  const [tape, setTape] = useState<QuoteTape>({ live: false, asof: null, by: new Map() });
  const key = symbols.join(",");

  useEffect(() => {
    let on = true;
    async function pull() {
      if (!key) return;
      try {
        const r = await fetch(`/api/quotes?symbols=${encodeURIComponent(key)}`);
        if (!r.ok) throw new Error(String(r.status));
        const d = (await r.json()) as { asof?: string; quotes?: LiveQuote[] };
        if (!on) return;
        const by = new Map<string, LiveQuote>();
        for (const q of d.quotes || []) by.set(q.symbol, q);
        setTape({ live: by.size > 0, asof: d.asof || new Date().toISOString(), by });
      } catch {
        if (on) setTape((prev) => ({ ...prev, live: false }));
      }
    }
    void pull();
    const id = window.setInterval(pull, ms);
    return () => {
      on = false;
      window.clearInterval(id);
    };
  }, [key, ms]);

  return tape;
}
