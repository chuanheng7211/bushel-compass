import { OutlookChart } from "@/components/outlook-chart";
import { CALL_LABEL, worldCrops, worldOutlook } from "@/lib/world-outlook";
import { useLiveQuotes } from "@/lib/live-quotes";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CALL_TONE = {
  cover: "bg-moss-soft text-moss",
  watch: "bg-warn-soft text-warn",
  wait: "bg-rich-soft text-rich",
} as const;

const DIR = { up: "text-moss", down: "text-rust", flat: "text-ink-soft" } as const;

export function WorldFactors({
  cmd,
  onCmd,
}: {
  cmd: string;
  onCmd?: (c: string) => void;
}) {
  const live = useLiveQuotes(["HO=F", "NG=F", "NTR", "USDCAD=X", "USDMXN=X", "ZIM"]);
  const o = worldOutlook(cmd, live.by);
  const crops = worldCrops();

  return (
    <div className="grid gap-4">
      {onCmd ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {crops.slice(0, 24).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCmd(c)}
              className={cn(
                "min-h-11 shrink-0 rounded-xl border px-3 py-2 text-sm",
                cmd === c ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <section className="rounded-xl border border-line bg-cream p-5">
        <p className="text-xs uppercase tracking-wide text-ink-soft">Combined factors · {cmd}</p>
        <p className="mt-2 font-display text-2xl leading-tight">{o.thesis}</p>
        <p className="mt-2">
          <span className={cn("rounded-lg px-2 py-1 text-xs font-medium", CALL_TONE[o.call])}>{CALL_LABEL[o.call]}</span>
          {live.live ? <span className="ml-2 text-xs text-moss">Live delayed energy / FX</span> : <span className="ml-2 text-xs text-ink-soft">Energy/FX from last snapshot</span>}
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile k="Dest now" v={money(o.dest)} d={o.destYoy != null ? `${o.destYoy > 0 ? "+" : ""}${o.destYoy.toFixed(0)}% YoY` : "AAFC Vancouver"} />
          <Tile k="Next weeks" v={money(o.nextMid)} d={`Band ${money(o.nextLo)} – ${money(o.nextHi)}`} />
          <Tile k="Landed nudge" v={`${o.nudge >= 0 ? "+" : ""}${o.nudge.toFixed(1)} pp`} d="Diesel + FX + FAO on dest" />
          <Tile k="Landed look" v={money(o.landed)} d="Dest × (1 + nudge). Not a pit." />
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-cream p-5">
        <h3 className="font-display text-lg">What is pushing this number</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {o.factors.map((f) => (
            <li key={f.id} className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-soft">{f.k}</p>
              <p className="mt-1 flex items-baseline justify-between gap-2">
                <span className="font-display text-xl tabular-nums leading-tight">{f.print}</span>
                <span className={cn("text-xs tabular-nums", DIR[f.dir])}>
                  {f.nudge ? `${f.nudge > 0 ? "+" : ""}${f.nudge.toFixed(1)} pp` : "—"}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">{f.so}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-line bg-cream p-5">
          <h3 className="font-display text-lg">Vancouver dest + public forecast</h3>
          <div className="mt-3 h-64">
            <OutlookChart hist={o.hist} forecast={o.forecast} />
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-line bg-cream p-5">
          <h3 className="font-display text-lg">Dest vs FAO food (indexed)</h3>
          <p className="mt-1 text-xs text-ink-soft">Both start at 100. FAO is staples. Dest is this carton in Vancouver.</p>
          {o.destMonthly.length > 2 ? (
            <div className="mt-3 h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={o.destMonthly}>
                  <CartesianGrid stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} minTickGap={28} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} width={36} />
                  <Tooltip contentStyle={{ background: "var(--color-cream)", border: "1px solid var(--color-line)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="dest" name={`${cmd} dest`} stroke="var(--color-ink)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="food" name="FAO food" stroke="var(--color-rust)" dot={false} strokeWidth={1.5} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">Not enough weekly dest to index against FAO.</p>
          )}
        </div>
      </section>
    </div>
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

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}
