import { movers } from "@/lib/compass";
import { marketFile } from "@/lib/data";
import { compareHit } from "@/lib/desk-compare";
import { compareShort, fmtPct } from "@/lib/desk-filter";
import { useDeskMoney } from "@/lib/desk-money";
import { cn } from "@/lib/utils";

export function Movers({
  onPick,
  active,
}: {
  onPick: (cmd: string) => void;
  active?: string;
}) {
  const { cad, tag, compare } = useDeskMoney();
  const rows = movers(marketFile, "Vancouver", 8);
  if (!rows.length) return null;
  return (
    <section className="px-4 sm:px-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl">What’s moving</h2>
        <p className="text-xs text-ink-soft">
          Vancouver wholesale ask · {compareShort(compare)} · {tag}. Click to load the quote.
        </p>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((r) => {
          const hit = compareHit(r.cmd, r.p50 ?? null, compare);
          const pct = hit?.pct ?? r.yoy ?? 0;
          const up = pct > 0;
          const on = active === r.cmd;
          return (
            <li key={r.cmd}>
              <button
                type="button"
                onClick={() => onPick(r.cmd)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-3 text-left",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-cream",
                )}
              >
                <span className="font-medium">{r.cmd}</span>
                <span className={cn("text-sm tabular-nums", on ? "opacity-80" : up ? "text-rich" : "text-moss")}>
                  {fmtPct(hit?.pct ?? r.yoy)} {hit?.label || "vs last year"} · {cad(r.p50)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
