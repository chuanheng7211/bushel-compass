import type { ReactNode } from "react";
import { searchLines } from "@/lib/item-outlook";
import type { BookPlan, ScoredLine } from "@/lib/order-book";
import { cn } from "@/lib/utils";

export function BookList({
  plan,
  query,
  onQuery,
  cases,
  onCases,
  onOpenItem,
}: {
  plan: BookPlan;
  query: string;
  onQuery: (q: string) => void;
  cases: Record<string, number>;
  onCases: (id: string, n: number) => void;
  onOpenItem: (cmd: string) => void;
}) {
  const hits = searchLines(plan.scored.length ? plan.scored : plan.lines, query);
  const chips = [...new Set(plan.scored.map((l) => l.cmd).filter(Boolean))].slice(0, 8) as string[];
  const rows = hits.map((l) => {
    const id = l.sku || l.raw.slice(0, 24);
    const n = Math.max(1, cases[id] || 1);
    const kg = (l.qtyKg || 0) * n;
    const list = l.casePrice != null ? l.casePrice : l.quoteCadKg != null && l.qtyKg ? l.quoteCadKg * l.qtyKg : l.quoteCadKg;
    const total = l.casePrice != null ? l.casePrice * n : (l.quoteCadKg || 0) * (l.qtyKg || 0) * (l.qtyKg ? 1 : n);
    return { l, id, n, kg, list, total };
  });
  const tot$ = rows.reduce((s, r) => s + (r.total || 0), 0);
  const totKg = rows.reduce((s, r) => s + r.kg, 0);

  return (
    <section className="rounded-xl border border-line bg-cream p-5">
      <h2 className="font-display text-lg">The list — search, don’t scroll</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {plan.delivery}. {plan.week ? `Week ${plan.week}.` : ""} Case $ is the landed list, not FOB origin. Type a name, SKU, or origin.
      </p>
      <label className="mt-4 block text-xs text-ink-soft" htmlFor="book-search">
        Search the book
      </label>
      <input
        id="book-search"
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="gala, 100184, honeycrisp, mexico…"
        className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-sm"
      />
      {chips.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c}>
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-xl border px-3 text-sm",
                  query.toLowerCase() === c.toLowerCase() ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink",
                )}
                onClick={() => onQuery(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {query.trim().length < 2 ? (
        <p className="mt-4 text-sm text-ink-soft">Two letters to open the list. The full book stays closed on purpose.</p>
      ) : !rows.length ? (
        <p className="mt-4 text-sm text-ink-soft">Nothing in this book matches “{query}”.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Sum k="Lines" v={String(rows.length)} d="Matching SKUs, cap 40" />
            <Sum k="Volume" v={`${totKg.toFixed(0)} kg`} d="Pack kg × cases" />
            <Sum k="Total list" v={`$${tot$.toFixed(0)}`} d="Case $ × cases" />
            <Sum k="Delivery" v={plan.kind === "casebook" ? "YVR dock" : "As typed"} d={plan.delivery} />
          </div>
          <ul className="mt-4 grid gap-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-paper p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg leading-tight">{r.l.label || r.l.cmd || r.l.unknown}</p>
                    <p className="text-xs text-ink-soft">
                      {r.l.sku ? `#${r.l.sku} · ` : ""}
                      {r.l.pack || "—"}
                      {r.l.organic ? " · organic" : ""}
                    </p>
                  </div>
                  {r.l.cmd ? (
                    <button type="button" className="min-h-11 rounded-xl border border-line bg-cream px-3 text-sm" onClick={() => onOpenItem(r.l.cmd!)}>
                      Predict {r.l.cmd}
                    </button>
                  ) : null}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <Cell k="List / case" v={r.list != null ? `$${r.list.toFixed(2)}` : "—"} />
                  <Cell k="kg / case" v={r.l.qtyKg ? r.l.qtyKg.toFixed(1) : "—"} />
                  <Cell
                    k="Cases"
                    v=""
                    extra={
                      <input
                        aria-label={`Cases for ${r.l.label || r.l.cmd}`}
                        type="number"
                        min={1}
                        step={1}
                        value={r.n}
                        onChange={(e) => onCases(r.id, Math.max(1, Number(e.target.value) || 1))}
                        className="mt-1 min-h-11 w-full rounded-lg border border-line bg-cream px-2 tabular-nums"
                      />
                    }
                  />
                  <Cell k="Volume" v={`${r.kg.toFixed(0)} kg`} />
                  <Cell k="Total $" v={`$${(r.total || 0).toFixed(2)}`} />
                </dl>
                <p className="mt-2 text-xs text-ink-soft">{plan.delivery}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Sum({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="rounded-lg border border-line px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{k}</p>
      <p className="mt-1 font-display text-xl tabular-nums leading-tight">{v}</p>
      <p className="mt-1 text-xs text-ink-soft">{d}</p>
    </div>
  );
}

function Cell({
  k,
  v,
  extra,
}: {
  k: string;
  v: string;
  extra?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{k}</dt>
      {extra || <dd className="font-display text-lg tabular-nums leading-tight">{v}</dd>}
    </div>
  );
}
