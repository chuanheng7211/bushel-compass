import { OutlookChart } from "@/components/outlook-chart";
import { useDeskMoney } from "@/lib/desk-money";
import { CALL_LABEL, cropChoices, outlookFor, type PriceCall } from "@/lib/item-outlook";
import { fmtChg, fmtPx } from "@/lib/markets";
import type { ScoredLine } from "@/lib/order-book";
import { cn } from "@/lib/utils";

const CALL_TONE: Record<PriceCall, string> = {
  cover: "bg-moss-soft text-moss",
  watch: "bg-warn-soft text-warn",
  wait: "bg-rich-soft text-rich",
};

export function ItemOutlook({
  cmd,
  onCmd,
  book,
}: {
  cmd: string;
  onCmd: (c: string) => void;
  book: ScoredLine[];
}) {
  const { cad } = useDeskMoney();
  const o = outlookFor(cmd, book);
  const choices = cropChoices(book);

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-line bg-cream p-5">
        <h2 className="font-display text-lg">One item — what the other files say next</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Not a model that invents a price. Farm, Vancouver weekly, grocery average, listed names, and this book. Then a four-week band from the public forecast.
        </p>
        <label className="mt-4 block text-xs text-ink-soft" htmlFor="item-cmd">
          Item
        </label>
        <select
          id="item-cmd"
          className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
          value={choices.includes(cmd) ? cmd : choices[0] || cmd}
          onChange={(e) => onCmd(e.target.value)}
        >
          {choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-4 font-display text-2xl leading-tight">{o.thesis}</p>
        <p className="mt-2">
          <span className={cn("rounded-lg px-2 py-1 text-xs font-medium", CALL_TONE[o.call])}>{CALL_LABEL[o.call]}</span>
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile k="Dest mid" v={cad(o.wholesale)} d={o.yoy != null ? `${o.yoy > 0 ? "+" : ""}${o.yoy.toFixed(0)}% YoY` : "AAFC Vancouver"} />
          <Tile k="Next weeks" v={cad(o.nextMid)} d={`Band ${cad(o.nextLo)} – ${cad(o.nextHi)}`} />
          <Tile k="Fair delivered" v={cad(o.deliveredFair)} d="~1.25× the terminal" />
          <Tile k="Rich delivered" v={cad(o.deliveredRich)} d="~1.50× — walk" />
        </ul>
        {o.why.length ? (
          <ul className="mt-4 grid gap-2">
            {o.why.map((w) => (
              <li key={w} className="rounded-lg border border-line px-3 py-3 text-sm">
                {w}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-xl border border-line bg-cream p-5">
        <h3 className="font-display text-lg">Weekly ask + public forecast</h3>
        <div className="mt-3 h-64">
          <OutlookChart hist={o.hist} forecast={o.forecast} quote={o.bookMed ?? undefined} />
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Solid line is Vancouver dest. Band is the file’s forecast, not a private model. Dots on the quote, if any, are this book’s median.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-cream p-5">
        <h3 className="font-display text-lg">What moves this price</h3>
        <ul className="mt-3 grid gap-2">
          {o.drivers.map((d) => (
            <li key={d.k} className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-soft">{d.k}</p>
              <p className="mt-1 font-display text-lg leading-tight">{d.v}</p>
              <p className="mt-1 text-sm text-ink-soft">{d.so}</p>
            </li>
          ))}
        </ul>
        {o.listed.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {o.listed.slice(0, 6).map((n) => (
              <li key={n.symbol} className="rounded-lg border border-line px-3 py-2">
                <p className="text-xs">{n.symbol}</p>
                <p className="font-display text-lg tabular-nums leading-tight">{fmtPx(n)}</p>
                <p className="text-xs text-ink-soft">{fmtChg(n.chgPct)}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {o.bookMed != null ? (
          <p className="mt-3 text-sm text-ink-soft">
            This book, {o.bookN} conventional SKUs, median {cad(o.bookMed)} vs dest {cad(o.wholesale)}. Farm {cad(o.farm)}
            {o.farmAsOf ? ` (${o.farmAsOf})` : ""}.
          </p>
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
