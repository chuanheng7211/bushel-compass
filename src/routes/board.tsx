import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HistoryChart } from "@/components/history-chart";
import { OutlookChart } from "@/components/outlook-chart";
import { CropGrid } from "@/components/crop-grid";
import { Freshness } from "@/components/freshness";
import { Movers } from "@/components/movers";
import { SiteHeader } from "@/components/site-header";
import { catalog, fullPlaybooks } from "@/lib/catalog";
import { fmt, forecastFor, nassFor, regionalWholesale, seriesFor } from "@/lib/compass";
import { layersFile, marketFile, nassFarm } from "@/lib/data";
import leadersJson from "@/data/leaders.json";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/board")({ component: BoardPage });

const leaders = leadersJson as {
  thesis: string;
  stackTheyUse: { layer: string; print: string }[];
  houses: { name: string; what: string; bench: string; spread: string }[];
};

function BoardPage() {
  const play = fullPlaybooks();
  const [cmd, setCmd] = useState("Apples");
  const series = nassFor(play, nassFarm, cmd);
  const regions = useMemo(() => regionalWholesale(marketFile, cmd), [cmd]);
  const farm = series?.latest?.cadKg;
  const barData = regions
    .filter((r) => r.snap?.p50 != null)
    .map((r) => ({
      city: r.centre,
      wholesale: Number(r.snap!.p50!.toFixed(2)),
      farm: farm != null ? Number(farm.toFixed(2)) : undefined,
    }));
  const vancouver = regions.find((r) => r.centre === "Vancouver")?.snap;
  const fob = farm != null ? farm * 1.35 : null;
  const landed = fob != null ? fob + 0.3 : null;
  const retail = vancouver?.blsCadKg || vancouver?.estRetail;

  const nassCount = catalog.filter((c) => c.group === "nass").length;
  const both = catalog.filter((c) => c.nass && c.aafc).length;
  const aafcOnly = catalog.filter((c) => c.group === "aafc-only").length;

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="USDA farm history, Canadian city asks, the stack, and how the majors actually bench." />

      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Raw cost, region, and the chain.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          {nassCount} USDA NASS monthly farm-gate series. {both} of those also print on AAFC wholesale. {aafcOnly} more are Canadian asks only. Click a tile.
        </p>
        <div className="mt-2">
          <Freshness />
        </div>
        <div className="mt-5">
          <Movers onPick={setCmd} active={cmd} />
        </div>
        <div className="mt-5">
          <CropGrid value={cmd} onChange={setCmd} />
        </div>
      </section>

      <section className="grid gap-4 px-4 py-6 sm:px-9 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-line bg-cream p-4">
          <h2 className="font-display text-xl">Region — this week’s wholesale ask</h2>
          <p className="mt-1 text-xs text-ink-soft">
            AAFC destination mids, CAD/kg. The bar is not a US FOB. Farm line is US NASS national, converted.
          </p>
          {barData.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="city" tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} tickFormatter={(v: number) => `$${v}`} width={44} />
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toFixed(2)}/kg`, ""]}
                    contentStyle={{ background: "var(--color-cream)", border: "1px solid var(--color-line)", borderRadius: 12 }}
                  />
                  <Bar dataKey="wholesale" name="Wholesale ask" fill="var(--color-ink)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">No AAFC city print for this item. Use farm history only.</p>
          )}
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {regions.map((r) => (
              <li key={r.centre} className="rounded-lg border border-line p-2">
                <div className="text-xs text-ink-soft">{r.centre}</div>
                <div className="font-medium">{r.snap?.p50 != null ? `$${fmt(r.snap.p50)}/kg` : "—"}</div>
                <div className="text-xs text-ink-soft">
                  {r.snap?.wow != null ? `WoW ${r.snap.wow}%` : ""} {r.snap?.yoy != null ? `YoY ${r.snap.yoy}%` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 rounded-xl border border-line bg-cream p-4">
          <h2 className="font-display text-xl">US farm-gate trend (NASS)</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Latest {farm != null ? `$${fmt(farm)}/kg` : "—"}
            {series?.latest ? ` · ${series.latest.d.slice(0, 7)} · $${fmt(series.latest.usdLb)}/lb USD` : " · no NASS series"}
          </p>
          {series?.monthly?.length ? (
            <div className="mt-4">
              <HistoryChart hist={series.monthly} quoteCadKg={vancouver?.p50 || farm || 0} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">USDA does not publish a monthly prices-received series for this SKU (typical for bananas, avocados, most citrus).</p>
          )}
          <h3 className="mt-4 font-display text-lg">Vancouver weekly + outlook</h3>
          <OutlookChart
            hist={seriesFor(marketFile, cmd)}
            forecast={forecastFor(marketFile, cmd)}
            quote={vancouver?.p50}
          />
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-9">
        <h2 className="font-display text-xl">Value chain on this item</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Planning stack for a GTA buyer. FOB and landed are modeled (farm × 1.35, +$0.30/kg freight). Wholesale and retail are public asks when printed.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Chain n="1" t="Farm (NASS)" v={farm} note="US national monthly" />
          <Chain n="2" t="Packed FOB" v={fob} note="model ~1.35× farm" />
          <Chain n="3" t="Landed GTA" v={landed} note="FOB + reefer (model)" />
          <Chain n="4" t="Wholesale" v={vancouver?.p50} note="AAFC Vancouver ask" />
          <Chain n="5" t="Retail" v={retail ?? undefined} note="BLS / estimated" />
        </ol>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {layersFile.layers.map((l) => (
            <p key={l.id} className="rounded-lg border border-line bg-cream p-3 text-sm">
              <b>{l.name}</b> <span className="text-xs text-ink-soft">{l.integrate}</span>
              <span className="mt-1 block text-xs text-ink-soft">{l.publicData}</span>
            </p>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-9">
        <h2 className="font-display text-xl">How the majors actually bench</h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-soft">{leaders.thesis}</p>
        <ol className="mt-4 grid gap-2 md:grid-cols-5">
          {leaders.stackTheyUse.map((s, i) => (
            <li key={s.layer} className="rounded-xl border border-line bg-cream p-3">
              <div className="text-xs text-ink-soft">Step {i + 1}</div>
              <h3 className="font-medium">{s.layer}</h3>
              <p className="mt-1 text-xs text-ink-soft">{s.print}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {leaders.houses.map((h) => (
            <article key={h.name} className="rounded-xl border border-line bg-cream p-4">
              <h3 className="font-display text-lg">{h.name}</h3>
              <p className="text-xs text-ink-soft">{h.what}</p>
              <p className="mt-2 text-sm">{h.bench}</p>
              <p className="mt-2 text-xs text-ink-soft">{h.spread}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-9">
        <h2 className="font-display text-xl">Coverage — USDA vs this desk</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Every NASS fresh fruit/veg monthly series we convert is in the compass dropdown. AAFC-only rows can still be quoted against a Vancouver ask, with no farm floor.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink-soft">
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">NASS farm</th>
                <th className="px-3 py-2 font-medium">AAFC city</th>
                <th className="px-3 py-2 font-medium">Latest farm CAD/kg</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((c) => {
                const s = c.nass ? nassFarm.series[c.nass] : null;
                return (
                  <tr key={c.label} className="border-t border-line">
                    <td className="px-3 py-2">
                      <button type="button" className={cn("text-left", c.label === cmd && "font-medium")} onClick={() => setCmd(c.label)}>
                        {c.label}
                      </button>
                    </td>
                    <td className="px-3 py-2">{c.nass ? "yes" : "—"}</td>
                    <td className="px-3 py-2">{c.aafc ? "yes" : "—"}</td>
                    <td className="px-3 py-2">{s?.latest ? `$${fmt(s.latest.cadKg)}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Chain({ n, t, v, note }: { n: string; t: string; v?: number | null; note: string }) {
  return (
    <li className="rounded-xl border border-line bg-cream p-3">
      <div className="text-xs text-ink-soft">{n}</div>
      <h3 className="font-medium">{t}</h3>
      <p className="font-display text-2xl">{v != null ? `$${fmt(v)}` : "—"}</p>
      <p className="text-xs text-ink-soft">{note}</p>
    </li>
  );
}
