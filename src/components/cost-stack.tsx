import { COST_STACK } from "@/lib/live-quotes";
import { chgTone, fmtChg, fmtPx, withLive } from "@/lib/markets";
import type { LiveQuote } from "@/lib/yahoo-quotes";
import type { ListedName } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CostStack({
  byName,
  live,
  onPick,
  picked,
}: {
  byName: Map<string, ListedName>;
  live: Map<string, LiveQuote>;
  onPick: (symbol: string) => void;
  picked: string | null;
}) {
  return (
    <section className="rounded-xl border border-line bg-cream p-5">
      <h2 className="font-display text-lg">原物料 — the cost stack</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Fertilizer, diesel, greenhouse gas, truck, boat, FX. These move landed cost even when the field did not. Delayed Yahoo, not FOB.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {COST_STACK.map((row) => {
          const base = byName.get(row.symbol);
          const q = live.get(row.symbol);
          const n = base ? withLive(base, q) : undefined;
          const on = picked === row.symbol;
          return (
            <li key={row.symbol}>
              <button
                type="button"
                onClick={() => onPick(row.symbol)}
                className={cn(
                  "flex min-h-11 w-full flex-col rounded-xl border px-3 py-3 text-left",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide">{row.k}</span>
                  <span className={cn("text-xs tabular-nums", on ? "opacity-80" : chgTone(n?.chgPct))}>
                    {fmtChg(n?.chgPct)}
                  </span>
                </span>
                <span className="mt-1 font-display text-2xl tabular-nums leading-tight">{n ? fmtPx(n) : "—"}</span>
                <Spark pts={q?.spark || []} on={on} />
                <span className={cn("mt-1 text-xs", on ? "opacity-70" : "text-ink-soft")}>{row.so}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Spark({ pts, on }: { pts: number[]; on: boolean }) {
  if (pts.length < 2) return null;
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const d = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * 100;
      const y = 18 - ((p - lo) / span) * 16;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 20" className="mt-2 h-5 w-full" aria-hidden>
      <path d={d} fill="none" stroke={on ? "currentColor" : "var(--color-ink)"} strokeWidth="1.5" />
    </svg>
  );
}
