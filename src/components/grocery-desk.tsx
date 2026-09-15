import { ShoppingBasket, Store } from "lucide-react";
import { DeltaLine } from "@/components/delta-line";
import { toCadKg } from "@/lib/compass";
import { useDeskMoney } from "@/lib/desk-money";
import {
  BANNERS,
  compareTicket,
  groceryPrints,
  hintBanner,
  ownerBench,
  shelfBands,
  shopperTips,
  type BannerId,
} from "@/lib/grocery";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  great: "border-moss bg-moss-soft text-moss",
  good: "border-moss bg-moss-soft text-moss",
  fair: "border-warn bg-warn-soft text-warn",
  rich: "border-rich bg-rich-soft text-rich",
};

export function GroceryDesk({
  cmd,
  ticket,
  store,
  banner,
  onTicket,
  onStore,
  onBanner,
}: {
  cmd: string;
  ticket: string;
  store: string;
  banner: BannerId;
  onTicket: (v: string) => void;
  onStore: (v: string) => void;
  onBanner: (v: BannerId) => void;
}) {
  const { cad, tag, unit, fx } = useDeskMoney();
  const g = groceryPrints(cmd);
  const bands = shelfBands(cmd);
  const ticketN = Number(ticket);
  const ticketCad = ticket.trim() && Number.isFinite(ticketN) && ticketN > 0 ? toCadKg(ticketN, unit, fx) : null;
  const read = ticketCad != null ? compareTicket(cmd, ticketCad, banner) : null;
  const bench = ownerBench(cmd, ticketCad, banner);
  const tips = shopperTips(cmd, ticketCad, store);
  const maxBand = Math.max(
    ...bands.map((b) => b.cadKg || 0),
    ticketCad || 0,
    g.farm || 0,
    g.wholesale || 0,
    g.bls || 0,
    0.01,
  );

  return (
    <div className="space-y-4">
      <article className="rounded-xl border border-line bg-cream p-5">
        <p className="text-xs uppercase tracking-wide text-ink-soft">Public ladder · {cmd}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Print n="Farm" v={g.farm} asof={null} />
          <Print n="Wholesale ask" v={g.wholesale} asof={g.snapAsOf} />
          <Print n="BLS grocery" v={g.bls} asof={g.blsAsOf} />
          <Print n="Conventional shelf" v={g.conventional} asof={null} />
        </dl>
        {g.wholesale != null ? (
          <div className="mt-3">
            <DeltaLine cmd={cmd} currentCadKg={g.wholesale} layer="wholesale" />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-ink-soft">
          Bands below are typical GTA markups on the Vancouver ask — not a scrape of Loblaws, Walmart, or Costco.
          BLS is a US grocery average converted to CAD/kg. Type the ticket you actually saw.
        </p>
      </article>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {bands.map((b) => {
          const on = banner === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onBanner(b.id)}
              className={cn(
                "flex min-h-11 flex-col items-start rounded-xl border px-3 py-3 text-left",
                on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
              )}
            >
              <span className="text-xs uppercase tracking-wide opacity-70">{b.label}</span>
              <span className="font-display text-2xl tabular-nums leading-tight">
                {b.cadKg != null ? cad(b.cadKg) : "—"}
              </span>
              <span className={cn("mt-1 text-xs", on ? "opacity-70" : "text-ink-soft")}>{b.examples}</span>
              <span className={cn("mt-1 text-xs tabular-nums", on ? "opacity-70" : "text-ink-soft")}>{b.how}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-line bg-cream p-4">
        {bands.map((b) => (
          <BarRow
            key={b.id}
            label={b.label}
            value={b.cadKg}
            max={maxBand}
            active={banner === b.id}
            money={cad}
            ink={banner === b.id}
          />
        ))}
        {g.farm != null ? <BarRow label="Farm" value={g.farm} max={maxBand} money={cad} tone="moss" /> : null}
        {g.bls != null ? <BarRow label="BLS grocery" value={g.bls} max={maxBand} money={cad} tone="rust" /> : null}
        {ticketCad != null ? <BarRow label="Your ticket" value={ticketCad} max={maxBand} money={cad} tone="ticket" /> : null}
      </div>

      <form
        className="rounded-xl border border-line bg-cream p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <h2 className="flex items-center gap-2 font-display text-xl">
          <ShoppingBasket className="size-5" aria-hidden />
          The ticket you saw
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block" htmlFor="shelf-ticket">
            <input
              id="shelf-ticket"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={ticket}
              onChange={(e) => onTicket(e.target.value)}
              placeholder="0.00"
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-lg tabular-nums text-ink"
            />
          </label>
          <label className="block" htmlFor="store-note">
            <input
              id="store-note"
              type="text"
              value={store}
              onChange={(e) => {
                const v = e.target.value;
                onStore(v);
                const hint = hintBanner(v);
                if (hint) onBanner(hint);
              }}
              placeholder="No Frills Queen, Costco Vaughan…"
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-ink"
            />
          </label>
        </div>
        {read ? (
          <div className={cn("mt-4 rounded-xl border px-4 py-3", TONE[read.cls])}>
            <p className="font-display text-2xl leading-tight">{read.title}</p>
            <p className="mt-1 text-sm">{read.note}</p>
            <ul className="mt-2 grid gap-1 text-sm tabular-nums sm:grid-cols-2">
              {read.vsWarehouse != null ? (
                <li>vs warehouse {read.vsWarehouse >= 0 ? "+" : ""}{(read.vsWarehouse * 100).toFixed(0)}%</li>
              ) : null}
              {read.vsBls != null ? (
                <li>vs BLS {read.vsBls >= 0 ? "+" : ""}{(read.vsBls * 100).toFixed(0)}%</li>
              ) : null}
              {read.multipleOfFarm != null ? <li>{read.multipleOfFarm.toFixed(1)}× the farm print</li> : null}
              {read.saveCadKg != null ? <li>club band saves {cad(read.saveCadKg)}/{tag.split("/")[1] || "kg"}</li> : null}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Pick a store format, then type the shelf ticket in the unit on the filter bar.
          </p>
        )}
      </form>

      <section>
        <h2 className="font-display text-xl">How to get a better price</h2>
        <ul className="mt-3 space-y-2">
          {tips.map((t) => (
            <li key={t} className="rounded-xl border border-line bg-cream px-4 py-3 text-sm">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-cream p-5">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Store className="size-5" aria-hidden />
          Owner bench — how to price
        </h2>
        <p className="mt-2 text-sm text-ink-soft">{bench.growerRule}</p>
        <p className="mt-1 text-sm text-ink-soft">{bench.retailerRule}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Print n="Packed cost (farm × 1.15)" v={bench.costPacked} asof={null} />
          <Print n="DTC floor" v={bench.dtcLo} asof={null} />
          <Print n="Stall target" v={bench.dtcTarget} asof={null} />
          <Print n="DTC ceiling (discount)" v={bench.dtcHi} asof={null} />
        </dl>
        {bench.impliedCost != null ? (
          <p className="mt-3 text-sm">
            Ticket {ticketCad != null ? cad(ticketCad) : "—"} at {BANNERS.find((b) => b.id === banner)?.label.toLowerCase()} markup
            implies a landed cost near {cad(bench.impliedCost)} {tag}. To beat that shelf, land under it.
          </p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="text-ink-soft">
                <th className="py-2 pr-3 font-medium">Format</th>
                <th className="py-2 pr-3 font-medium">Shelf {tag}</th>
                <th className="py-2 pr-3 font-medium">Retailer gross</th>
                <th className="py-2 font-medium">Grower vs packed</th>
              </tr>
            </thead>
            <tbody>
              {bench.rows.map((r) => (
                <tr key={r.id} className={cn("border-t border-line", r.id === banner && "font-medium")}>
                  <td className="py-2 pr-3">{r.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{cad(r.shelf)}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {r.retailerMargin != null
                      ? `${cad(r.retailerMargin)} · ${((r.retailerPct || 0) * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="py-2 tabular-nums">
                    {r.growerMargin != null
                      ? `${cad(r.growerMargin)} · ${((r.growerPct || 0) * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Gross before shrink, labor, and rent. NASS farm is all grades — extra-fancy DTC sits higher. A benchmark, not a suggested retail price.
        </p>
      </section>
    </div>
  );
}

function Print({ n, v, asof }: { n: string; v: number | null; asof: string | null }) {
  const { cad, tag } = useDeskMoney();
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{n}</dt>
      <dd className="font-display text-2xl tabular-nums leading-tight">
        {v != null ? cad(v) : "—"}
        {v != null ? <span className="ml-1 font-sans text-xs text-ink-soft">{tag}</span> : null}
      </dd>
      {asof ? <p className="text-xs text-ink-soft">{asof}</p> : null}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  money,
  active,
  ink,
  tone,
}: {
  label: string;
  value: number | null;
  max: number;
  money: (n: number | null | undefined) => string;
  active?: boolean;
  ink?: boolean;
  tone?: "moss" | "rust" | "ticket";
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  const bar =
    tone === "moss"
      ? "bg-moss"
      : tone === "rust"
        ? "bg-rust"
        : tone === "ticket"
          ? "bg-rich"
          : ink
            ? "bg-ink"
            : "bg-land";
  return (
    <div className={cn("grid grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 py-1", active && "font-medium")}>
      <span className="truncate text-xs text-ink-soft">{label}</span>
      <div className="h-2 rounded-full bg-paper">
        <div className={cn("h-2 rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-right text-xs tabular-nums">{money(value)}</span>
    </div>
  );
}
