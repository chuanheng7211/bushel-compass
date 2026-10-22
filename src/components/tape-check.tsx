import { tapeCheck, tapeCrop, pct } from "@/lib/tape-check";
import { cn } from "@/lib/utils";

export function TapeCheck({ cmd, onCmd }: { cmd?: string; onCmd?: (c: string) => void }) {
  const hit = cmd ? tapeCrop(cmd) : undefined;
  const storage = tapeCheck.crops.filter((c) => !c.seasonal && c.ratio != null);
  const seasonal = tapeCheck.crops.filter((c) => c.seasonal && c.ratio != null);

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-line bg-cream p-5">
        <h2 className="font-display text-lg">Held-out check — dest vs a delivered book</h2>
        <p className="mt-1 text-sm text-ink-soft">{tapeCheck.heldOut} Compared to {tapeCheck.destSource}, week of {tapeCheck.destWeek} — the same week, not the latest snap.</p>
        <p className="mt-4 font-display text-2xl leading-tight">{tapeCheck.lesson}</p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile k="Same-week dest" v={pctErr(tapeCheck.mapeDest)} d={`Median ${tapeCheck.medianRatio}× dest`} />
          <Tile k="1.25× “fair” rule" v={pctErr(tapeCheck.mapeFair125)} d="Worse. Overstates this house." />
          <Tile k="Latest tape (Aug)" v={pctErr(tapeCheck.mapeAugustTape)} d="Wrong week. Don’t use it." />
          <Tile k="In dest p20–p80" v={pct(tapeCheck.shareInDestSpread)} d={`Distributor 1.15–1.50× band: ${pct(tapeCheck.shareInDistributorBand)}`} />
        </ul>
      </div>

      {hit ? (
        <div className="rounded-xl border border-line bg-cream p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">This crop · {hit.cmd}</p>
          <p className="mt-2 font-display text-2xl leading-tight">{cropLine(hit)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            Dest that week {hit.dest != null ? `$${hit.dest.toFixed(2)}/kg` : "—"}. {hit.n} conventional SKUs in the held-out book. No SKU list is kept.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-line bg-cream p-5">
        <h3 className="font-display text-lg">Storage crops — same-week dest</h3>
        <p className="mt-1 text-xs text-ink-soft">Ratio = held-out delivered median ÷ AAFC Vancouver p50. Under 1.00 means dest was the ceiling, not a floor.</p>
        <ul className="mt-3 grid gap-1">
          {storage.map((c) => (
            <li key={c.cmd}>
              <button
                type="button"
                onClick={() => onCmd?.(c.cmd)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm",
                  cmd === c.cmd ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink",
                )}
              >
                <span>{c.cmd}</span>
                <span className="tabular-nums">
                  {c.ratio?.toFixed(2)}× dest
                  <span className={cn("ml-2 text-xs", cmd === c.cmd ? "opacity-70" : "text-ink-soft")}>
                    Aug tape {c.ratioAugust?.toFixed(2)}×
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {seasonal.length ? (
          <>
            <h3 className="mt-5 font-display text-lg">Seasonal — same week still tracks</h3>
            <ul className="mt-3 grid gap-1">
              {seasonal.map((c) => (
                <li key={c.cmd}>
                  <button
                    type="button"
                    onClick={() => onCmd?.(c.cmd)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm",
                      cmd === c.cmd ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink",
                    )}
                  >
                    <span>{c.cmd}</span>
                    <span className="tabular-nums">{c.ratio?.toFixed(2)}× dest</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}

function Tile({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <li className="rounded-lg border border-line px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{k}</p>
      <p className="mt-1 font-display text-xl tabular-nums leading-tight">{v}</p>
      <p className="mt-1 text-xs text-ink-soft">{d}</p>
    </li>
  );
}

function pctErr(n: number): string {
  return `${Math.round(n * 100)}% MAPE`;
}

function cropLine(c: { cmd: string; ratio: number | null; ratioAugust: number | null }): string {
  if (c.ratio == null) return `${c.cmd}: no overlapping dest that week.`;
  if (c.ratio < 0.9) {
    return `${c.cmd} printed ${c.ratio.toFixed(2)}× dest. Public ask was the ceiling. Bid dest or under — do not pay 1.25×.`;
  }
  if (c.ratio > 1.35) {
    return `${c.cmd} printed ${c.ratio.toFixed(2)}× dest. Delivered was rich vs the terminal that week.`;
  }
  return `${c.cmd} printed ${c.ratio.toFixed(2)}× dest — dest p50 is a fair bench. August tape was ${c.ratioAugust?.toFixed(2) ?? "—"}×.`;
}
