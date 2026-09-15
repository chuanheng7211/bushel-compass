import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteHeader } from "@/components/site-header";
import { catalog } from "@/lib/catalog";
import { marketsFile } from "@/lib/data";
import { sliceByPeriod } from "@/lib/desk-filter";
import { useDesk } from "@/lib/desk-store";
import { chgTone, cropTapeFor, fmtChg, fmtPx, listedBySymbol, namesForCrop } from "@/lib/markets";
import type { ListedName } from "@/lib/types";
import { cn } from "@/lib/utils";

type MarketsSearch = { crop?: string };

export const Route = createFileRoute("/markets")({
  component: MarketsPage,
  validateSearch: (s: Record<string, unknown>): MarketsSearch => ({
    crop: typeof s.crop === "string" ? s.crop : undefined,
  }),
});

function MarketsPage() {
  const { crop: cropQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [lens, setLens] = useState<string>("all");
  const [picked, setPicked] = useState<string | null>(null);
  const by = listedBySymbol();
  const crop = cropQ && (marketsFile.crops[cropQ] || catalog.some((c) => c.label === cropQ)) ? cropQ : undefined;
  const tape = crop ? cropTapeFor(crop) : null;
  const cropNames = crop ? namesForCrop(crop) : [];
  const shown = useMemo(() => {
    let rows = marketsFile.universe;
    if (lens !== "all") rows = rows.filter((n) => n.lens === lens);
    if (crop) {
      const want = new Set(cropTapeFor(crop).tickers);
      rows = rows.filter((n) => want.has(n.symbol));
    }
    return rows;
  }, [lens, crop]);

  const featured = picked ? by.get(picked) : cropNames[0] || shown[0];
  const history = featured ? marketsFile.history[featured.symbol] || [] : [];
  const cropLabels = Object.keys(marketsFile.crops).sort();

  function setCrop(next?: string) {
    navigate({ search: { crop: next } });
    setPicked(null);
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Listed growers, inputs, freight, and buyers — weather around the carton, not the carton." />
      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">The pit is not the carton.</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">{marketsFile.thesis}</p>
        <p className="mt-2 text-xs text-ink-soft">
          {marketsFile.source} Pulled {marketsFile.generated || "—"}.
          {marketsFile.quoted != null ? ` ${marketsFile.quoted}/${marketsFile.of} names printed.` : ""}
        </p>
      </section>

      <section className="px-4 py-4 sm:px-9">
        <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm text-warn">
          {marketsFile.disclaimer}
        </div>
      </section>

      <section className="px-4 sm:px-9">
        <h2 className="font-display text-xl">If this listed name moves</h2>
        <p className="mt-1 text-xs text-ink-soft">
          These are the relationships, not a trading signal. The carton still clears on AMS FOB and your PO.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {marketsFile.relations.map((r) => (
            <article key={r.if} className="rounded-xl border border-line bg-cream p-4">
              <h3 className="font-medium">{r.if}</h3>
              <p className="mt-2 text-sm text-ink-soft">{r.then}</p>
              <p className="mt-2 text-xs text-ink-soft">Watch {r.watch.join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-6 sm:px-9">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl">Pick a crop</h2>
          {crop ? (
            <button type="button" className="text-sm text-rust" onClick={() => setCrop(undefined)}>
              Clear crop
            </button>
          ) : (
            <p className="text-xs text-ink-soft">Then the tape shrinks to the names that actually touch it.</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cropLabels.map((label) => {
            const on = crop === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCrop(on ? undefined : label)}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-sm",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {tape && crop ? (
          <div className="mt-4 rounded-xl border border-line bg-cream p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg">{crop}</h3>
              <Link to="/" className="text-sm text-rust no-underline hover:underline">
                Open in Compass
              </Link>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{tape.read}</p>
            {tape.futures.length ? (
              <p className="mt-2 text-xs text-warn">Listed futures on this crop: {tape.futures.join(", ")} — juice or process, not a fresh carton.</p>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">No carton futures. The names below are weather, not a bid.</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="px-4 sm:px-9">
        <div className="flex flex-wrap gap-2">
          <LensChip id="all" label="All names" blurb="The whole listed weather map" on={lens === "all"} onPick={() => setLens("all")} />
          {marketsFile.lenses.map((l) => (
            <LensChip
              key={l.id}
              id={l.id}
              label={l.label}
              blurb={l.blurb}
              on={lens === l.id}
              onPick={() => setLens(l.id)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {lens === "all"
            ? "The whole listed weather map."
            : marketsFile.lenses.find((l) => l.id === lens)?.blurb}
        </p>
      </section>

      <section className="grid min-w-0 gap-4 px-4 py-4 pb-16 sm:px-9 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-line bg-cream md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-ink-soft">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Last</th>
                  <th className="px-3 py-2 font-medium">Session</th>
                  <th className="px-3 py-2 font-medium">1m</th>
                  <th className="px-3 py-2 font-medium">If it moves</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((n) => (
                  <tr
                    key={n.symbol}
                    className={cn(
                      "cursor-pointer border-t border-line",
                      featured?.symbol === n.symbol ? "bg-moss-soft" : "",
                    )}
                    onClick={() => setPicked(n.symbol)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{n.symbol}</div>
                      <div className="text-xs text-ink-soft">{n.name}</div>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{n.role}</td>
                    <td className="px-3 py-2 font-display text-base tabular-nums">{fmtPx(n)}</td>
                    <td className={cn("px-3 py-2 tabular-nums", chgTone(n.chgPct))}>{fmtChg(n.chgPct)}</td>
                    <td className={cn("px-3 py-2 tabular-nums", chgTone(n.ret1m))}>{fmtChg(n.ret1m)}</td>
                    <td className="px-3 py-2 text-ink-soft">{n.means}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-2 md:hidden">
            {shown.map((n) => (
              <li key={n.symbol}>
                <button
                  type="button"
                  onClick={() => setPicked(n.symbol)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left",
                    featured?.symbol === n.symbol ? "border-ink bg-ink text-paper" : "border-line bg-cream",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {n.symbol}
                      <span className={cn("ml-2 text-xs font-normal", featured?.symbol === n.symbol ? "opacity-70" : "text-ink-soft")}>
                        {n.name}
                      </span>
                    </span>
                    <span className={cn("text-sm tabular-nums", featured?.symbol === n.symbol ? "opacity-80" : chgTone(n.chgPct))}>
                      {fmtChg(n.chgPct)}
                    </span>
                  </div>
                  <div className="font-display text-2xl leading-tight tabular-nums">{fmtPx(n)}</div>
                  <p className={cn("mt-1 text-xs", featured?.symbol === n.symbol ? "opacity-80" : "text-ink-soft")}>{n.means}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-cream p-4">
          {featured ? <NameDetail name={featured} history={history} /> : <p className="text-sm text-ink-soft">Pick a name.</p>}
        </aside>
      </section>
    </div>
  );
}

function LensChip({
  id,
  label,
  blurb,
  on,
  onPick,
}: {
  id: string;
  label: string;
  blurb: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "min-h-11 rounded-xl border px-3 py-2 text-sm",
        on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
      )}
    >
      {label}
      <span className="sr-only">{blurb}</span>
    </button>
  );
}

function NameDetail({ name, history }: { name: ListedName; history: { d: string; p: number }[] }) {
  const period = useDesk((s) => s.period);
  const chart = sliceByPeriod(history, period, 60).map((h) => ({ d: h.d.slice(5), p: h.p }));
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-soft">{name.role}</p>
      <h3 className="font-display text-2xl leading-tight">
        {name.symbol}
        <span className="ml-2 text-base font-sans font-normal text-ink-soft">{name.name}</span>
      </h3>
      <div className="mt-2 flex items-end gap-3">
        <div className="font-display text-3xl tabular-nums">{fmtPx(name)}</div>
        <div className={cn("pb-1 text-sm tabular-nums", chgTone(name.chgPct))}>{fmtChg(name.chgPct)} session</div>
      </div>
      <div className="mt-1 flex gap-3 text-xs text-ink-soft">
        <span>1m {fmtChg(name.ret1m)}</span>
        <span>3m {fmtChg(name.ret3m)}</span>
        {name.asof ? <span>as of {name.asof}</span> : null}
      </div>
      {chart.length > 2 ? (
        <div className="mt-3 h-40 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--color-ink-soft)" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-ink-soft)" }} width={40} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "var(--color-cream)", border: "1px solid var(--color-line)", borderRadius: 12 }}
              />
              <Line type="monotone" dataKey="p" stroke="var(--color-ink)" dot={false} strokeWidth={2} name={name.symbol} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">History fills in when the data desk can reach the tape.</p>
      )}
      <p className="mt-3 text-sm">{name.what}</p>
      <p className="mt-2 text-sm text-ink-soft">{name.means}</p>
      {name.crops.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {name.crops.map((c) => (
            <Link
              key={c}
              to="/markets"
              search={{ crop: c }}
              className="rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink no-underline"
            >
              {c}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">Not tied to one carton — this is the broader ag complex.</p>
      )}
    </div>
  );
}
