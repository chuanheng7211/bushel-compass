import { createFileRoute } from "@tanstack/react-router";
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
import worldJson from "@/data/world.json";
import { marketFile, nassFarm } from "@/lib/data";

export const Route = createFileRoute("/world")({ component: WorldPage });

const world = worldJson as {
  generated?: string;
  source?: string;
  note?: string;
  latest?: Record<string, number | string | null>;
  yoy?: Record<string, number | null>;
  series?: { d: string; food: number | null; cereals: number | null; oils: number | null; sugar: number | null }[];
  tapes?: { id: string; name: string; what: string; cadence: string; fresh: boolean }[];
  belts?: { belt: string; who: string; feeds: string; clock: string }[];
  conditions?: { t: string; d: string }[];
  howToUse?: string[];
};

function WorldPage() {
  const chart = (world.series || []).filter((r) => r.food != null).map((r) => ({
    d: r.d.slice(0, 7),
    food: r.food,
    cereals: r.cereals,
    oils: r.oils,
    sugar: r.sugar,
  }));
  const yoy = world.yoy || {};

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="World staples, produce belts, and the difference between a public tape and a receiving dock." />
      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">The world is belts, not a pit.</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          {world.note} Last FAO pull {world.generated || "—"}. NASS {nassFarm.generated || "—"}. AAFC {marketFile.generated || "—"}.
        </p>
      </section>

      <section className="px-4 py-6 sm:px-9">
        <h2 className="font-display text-xl">FAO Food Price Index</h2>
        <p className="mt-1 text-xs text-ink-soft">{world.source}. YoY is vs the same month last year.</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(["food", "cereals", "oils", "sugar", "meat", "dairy"] as const).map((k) => (
            <li key={k} className="rounded-xl border border-line bg-cream p-3">
              <div className="text-xs uppercase tracking-wide text-ink-soft">{k}</div>
              <div className="font-display text-2xl">{world.latest?.[k] ?? "—"}</div>
              <div className="text-xs text-ink-soft">{yoy[k] != null ? `${yoy[k]}% YoY` : ""}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 h-72 min-w-0 rounded-xl border border-line bg-cream p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} minTickGap={28} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} width={36} />
              <Tooltip contentStyle={{ background: "var(--color-cream)", border: "1px solid var(--color-line)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="food" stroke="var(--color-ink)" dot={false} strokeWidth={2} name="Food" />
              <Line type="monotone" dataKey="oils" stroke="var(--color-rust)" dot={false} strokeWidth={1.5} name="Oils" />
              <Line type="monotone" dataKey="sugar" stroke="var(--color-moss)" dot={false} strokeWidth={1.5} name="Sugar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-9">
        <h2 className="font-display text-xl">Where the world’s produce actually sits</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(world.belts || []).map((b) => (
            <article key={b.belt} className="rounded-xl border border-line bg-cream p-4">
              <h3 className="font-display text-lg">{b.belt}</h3>
              <p className="text-sm">{b.who}</p>
              <p className="mt-1 text-sm text-ink-soft">{b.feeds}</p>
              <p className="mt-2 text-xs text-ink-soft">{b.clock}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-9">
        <h2 className="font-display text-xl">Public tape vs experience</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-cream">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink-soft">
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Cadence</th>
                <th className="px-3 py-2 font-medium">What you actually get</th>
              </tr>
            </thead>
            <tbody>
              {(world.tapes || []).map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    {t.name}
                    {t.fresh ? <span className="ml-2 text-xs text-moss">this desk pulls it</span> : null}
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{t.cadence}</td>
                  <td className="px-3 py-2 text-ink-soft">{t.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 px-4 pb-6 sm:px-9 md:grid-cols-2">
        {(world.conditions || []).map((c) => (
          <article key={c.t} className="rounded-xl border border-line bg-cream p-4">
            <h3 className="font-display text-lg">{c.t}</h3>
            <p className="mt-2 text-sm text-ink-soft">{c.d}</p>
          </article>
        ))}
      </section>

      <section className="px-4 pb-16 sm:px-9">
        <h2 className="font-display text-xl">How to use this on a quote</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-soft">
          {(world.howToUse || []).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
