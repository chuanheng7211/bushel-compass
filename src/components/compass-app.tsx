import { useMemo, useState } from "react";
import { Compass, Globe, GitBranch, History, Layers, Landmark } from "lucide-react";
import { analyzeQuote, fmt, forecastFor, paybackYears, seriesFor } from "@/lib/compass";
import { layersFile, marketFile, nassFarm } from "@/lib/data";
import { fullPlaybooks, cropPrints } from "@/lib/catalog";
import { HistoryChart } from "@/components/history-chart";
import { OutlookChart } from "@/components/outlook-chart";
import { OriginMap } from "@/components/origin-map";
import { CropGrid } from "@/components/crop-grid";
import { Movers } from "@/components/movers";
import { Freshness } from "@/components/freshness";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import type { AgentId, Analysis, Basis, Layer, LayersFile, Unit, VerdictCls } from "@/lib/types";

const ICONS: Record<AgentId, typeof Compass> = {
  compass: Compass,
  origin: Globe,
  channel: GitBranch,
  history: History,
  stack: Layers,
  vertical: Landmark,
};

const VERDICT_TONE: Record<VerdictCls, string> = {
  great: "bg-moss-soft text-moss",
  good: "bg-moss-soft text-moss",
  fair: "bg-warn-soft text-warn",
  rich: "bg-rich-soft text-rich",
};

const SAMPLE = {
  cmd: "Apples",
  price: "3.40",
  unit: "cadKg" as Unit,
  basis: "wholesale" as Basis,
  originNote: "Washington",
};

export function CompassApp() {
  const play = fullPlaybooks();
  const nass = nassFarm;
  const market = marketFile;
  const layers = layersFile;
  const [agent, setAgent] = useState<AgentId>("compass");
  const [cmd, setCmd] = useState(SAMPLE.cmd);
  const [form, setForm] = useState(
    fullPlaybooks().commodities[SAMPLE.cmd]?.form?.[0] || "fresh carton",
  );
  const [price, setPrice] = useState(SAMPLE.price);
  const [unit, setUnit] = useState<Unit>(SAMPLE.unit);
  const [basis, setBasis] = useState<Basis>(SAMPLE.basis);
  const [originNote, setOriginNote] = useState(SAMPLE.originNote);
  const [kgWeek, setKgWeek] = useState(8000);
  const [capex, setCapex] = useState(400000);

  const forms = play.commodities[cmd]?.form || ["fresh"];

  function pickCmd(next: string) {
    setCmd(next);
    const f = play.commodities[next]?.form?.[0];
    if (f) setForm(f);
    const p = cropPrints(next);
    if (p.wholesale != null) {
      setPrice(p.wholesale.toFixed(2));
      setUnit("cadKg");
      setBasis("wholesale");
    } else if (p.farm != null) {
      setPrice(p.farm.toFixed(2));
      setUnit("cadKg");
      setBasis("farm");
    }
    requestAnimationFrame(() => {
      document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const result = useMemo(() => {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0) return null;
    return analyzeQuote({
      cmd,
      form,
      unit,
      basis,
      originNote,
      price: n,
      play,
      nass,
      market,
    });
  }, [play, nass, market, cmd, form, unit, basis, originNote, price]);


  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader />
      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          A benchmark for people walking into produce.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Click an item. Farm is USDA NASS. Ask is AAFC Vancouver wholesale. Then overwrite the quote with what they asked you.
        </p>
        <div className="mt-3">
          <Freshness />
        </div>
      </section>

      <div className="mt-4">
        <Movers onPick={pickCmd} active={cmd} />
      </div>

      <section className="px-4 py-4 sm:px-9">
        <CropGrid value={cmd} onChange={pickCmd} />
      </section>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2 sm:px-9">
        {play.agents.map((a) => {
          const Icon = ICONS[a.id] || Compass;
          const on = agent === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAgent(a.id)}
              className={cn(
                "min-h-11 min-w-[140px] rounded-xl border px-3 py-2 text-left transition-opacity duration-150",
                on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
              )}
            >
              <span className="flex items-center gap-2 font-display text-sm">
                <Icon className="h-4 w-4" />
                {a.name}
              </span>
              <span className={cn("mt-0.5 block text-xs", on ? "opacity-70" : "text-ink-soft")}>
                {a.job}
              </span>
            </button>
          );
        })}
      </div>

      <section id="workbench" className="grid gap-4 px-4 py-4 pb-16 sm:px-9 lg:grid-cols-[320px_1fr]">
        <form
          className="h-fit rounded-xl border border-line bg-cream p-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <h2 className="font-display text-lg">Your quote · {cmd}</h2>
          <p className="mt-1 text-xs text-ink-soft">Pick an item above. Price starts at the public ask (or farm if there is no ask).</p>
          <label className="mt-3 block text-xs text-ink-soft" htmlFor="form">
            Form
          </label>
          <select
            id="form"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
            value={form}
            onChange={(e) => setForm(e.target.value)}
          >
            {forms.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <label className="mt-3 block text-xs text-ink-soft" htmlFor="price">
            Price they asked
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <label className="mt-3 block text-xs text-ink-soft" htmlFor="unit">
            Unit
          </label>
          <select
            id="unit"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            <option value="cadKg">CAD / kg</option>
            <option value="cadLb">CAD / lb</option>
            <option value="usdLb">USD / lb</option>
            <option value="usdKg">USD / kg</option>
          </select>
          <label className="mt-3 block text-xs text-ink-soft" htmlFor="basis">
            What they called this price
          </label>
          <select
            id="basis"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
            value={basis}
            onChange={(e) => setBasis(e.target.value as Basis)}
          >
            <option value="wholesale">Destination wholesale / delivered GTA</option>
            <option value="fob">Packed FOB at origin</option>
            <option value="farm">Farm gate / field</option>
            <option value="process">Processor / plant</option>
            <option value="retail">Retail shelf</option>
          </select>
          <label className="mt-3 block text-xs text-ink-soft" htmlFor="origin">
            Origin they named (optional)
          </label>
          <input
            id="origin"
            className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3"
            value={originNote}
            onChange={(e) => setOriginNote(e.target.value)}
            placeholder="Mexico, Washington, Ontario GH…"
          />
          <button
            type="button"
            className="mt-4 min-h-11 w-full rounded-xl border border-line bg-paper font-medium"
            onClick={() => {
              setCmd(SAMPLE.cmd);
              setForm(play.commodities[SAMPLE.cmd]?.form?.[0] || "fresh carton");
              setPrice(SAMPLE.price);
              setUnit(SAMPLE.unit);
              setBasis(SAMPLE.basis);
              setOriginNote(SAMPLE.originNote);
              setAgent("compass");
            }}
          >
            Load sample quote (apples)
          </button>
          <p className="mt-3 text-xs text-ink-soft">
            Farm history is USDA NASS prices received. Wholesale is AAFC asking prices. Neither is your invoice.
          </p>
        </form>

        <div className="rounded-xl border border-line bg-cream p-5">
          {result ? (
            <AgentView
              agent={agent}
              p={result}
              layers={layers}
              kgWeek={kgWeek}
              capex={capex}
              setKgWeek={setKgWeek}
              setCapex={setCapex}
            />
          ) : (
            <p className="text-sm text-ink-soft">Enter a price first.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Step({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <li className="grid grid-cols-[28px_1fr] gap-3 border-t border-line py-3">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-paper">
        {n}
      </span>
      <div>
        <div className="text-sm text-ink-soft">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </li>
  );
}

function AgentView({
  agent,
  p,
  layers,
  kgWeek,
  capex,
  setKgWeek,
  setCapex,
}: {
  agent: AgentId;
  p: Analysis;
  layers: LayersFile | null;
  kgWeek: number;
  capex: number;
  setKgWeek: (n: number) => void;
  setCapex: (n: number) => void;
}) {
  if (agent === "history") {
    const last = (p.hist || []).slice(-12);
    const weeks = seriesFor(marketFile, p.cmd);
    const outlook = forecastFor(marketFile, p.cmd);
    return (
      <div>
        <h2 className="font-display text-2xl">History agent</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Two clocks: USDA farm-gate (monthly floor) and AAFC Vancouver ask (weekly). Outlook is a naive seasonal blend, not a model you should trade.
        </p>
        <p className="mt-2">
          Latest farm print <b>${fmt(p.farm?.cadKg)}/kg</b>. Your quote is the{" "}
          <b>{p.quoteVsFarmPct ?? "—"}th</b> percentile of the farm series.
          {p.wholesale?.yoy != null ? ` Vancouver ask is ${p.wholesale.yoy}% vs a year ago.` : ""}
        </p>
        <h3 className="mt-4 font-display text-lg">Weekly destination ask + 8-week outlook</h3>
        <OutlookChart hist={weeks} forecast={outlook} quote={p.quoteCadKg} />
        <h3 className="mt-4 font-display text-lg">US farm-gate (NASS)</h3>
        <div className="mt-2">
          <HistoryChart hist={p.hist} quoteCadKg={p.quoteCadKg} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-ink-soft">
                <th className="py-1 font-medium">Month</th>
                <th className="py-1 font-medium">USD/lb</th>
                <th className="py-1 font-medium">CAD/kg</th>
              </tr>
            </thead>
            <tbody>
              {last.map((h) => (
                <tr key={h.d} className="border-t border-line">
                  <td className="py-1.5">{h.d.slice(0, 7)}</td>
                  <td>${fmt(h.usdLb)}</td>
                  <td>${fmt(h.cadKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (agent === "origin") {
    return (
      <div>
        <h2 className="font-display text-2xl">Origin scout</h2>
        {p.originNote ? (
          <p className="mt-2">
            They named <b>{p.originNote}</b>. If that district is dim on the map for this month, ask why you are not seeing the in-season country.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            They did not name an origin. That is a yellow flag. Fresh produce without a place is not a comparable print.
          </p>
        )}
        <div className="mt-4">
          <OriginMap
            cmd={p.cmd}
            play={p.play}
            snap={p.wholesale}
            originNote={p.originNote}
            compact
          />
        </div>
      </div>
    );
  }

  if (agent === "channel") {
    return (
      <div>
        <h2 className="font-display text-2xl">Channel scout</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Same commodity, several doors. The fair price changes with the door.
        </p>
        <div className="mt-4 space-y-3">
          {(p.play?.channels || []).map((c) => (
            <div key={c.id} className="rounded-lg border border-line p-3">
              <h3 className="font-medium">{c.label}</h3>
              <p className="text-sm text-ink-soft">{c.use}</p>
            </div>
          ))}
        </div>
        {p.wholesale?.origins?.length ? (
          <p className="mt-4 text-sm">
            This week's AAFC origin mix:{" "}
            {p.wholesale.origins.map((pair) => `${pair[0]} (${pair[1]})`).join(" · ")}
          </p>
        ) : null}
      </div>
    );
  }

  if (agent === "stack") {
    const farm = p.farm?.cadKg;
    const ws = p.wholesale?.p50;
    const retail = p.wholesale?.blsCadKg || p.wholesale?.estRetail;
    const row = (label: string, val?: number | null, you?: boolean) =>
      val == null ? null : (
        <Step
          key={label}
          n="·"
          label={label + (you ? " ← you" : "")}
          value={`$${fmt(val)}/kg`}
        />
      );
    return (
      <div>
        <h2 className="font-display text-2xl">Stack agent</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Typical fresh path. Processed skips pack presentation and most retail shrink.
        </p>
        <ul className="mt-3 list-none p-0">
          {row("US farm gate (NASS)", farm, p.basis === "farm")}
          {row("Packed FOB (farm + pack/cool, ~1.35× farm)", farm ? farm * 1.35 : null, p.basis === "fob")}
          {row("Landed Toronto (FOB + freight, rough +$0.30/kg)", farm ? farm * 1.35 + 0.3 : null)}
          {row("Destination wholesale ask (AAFC)", ws, p.basis === "wholesale")}
          {row("Typical retail", retail, p.basis === "retail")}
          {row("Your quote", p.quoteCadKg, true)}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
          If your quote sits above wholesale and they called it FOB, they have already sold you the next two layers.
        </p>
      </div>
    );
  }

  if (agent === "vertical") {
    const math = paybackYears({
      farm: p.farm?.cadKg,
      wholesale: p.wholesale?.p50,
      kgWeek,
      capex,
    });
    const rec =
      math.years == null
        ? "Need a farm print and a wholesale mid to size the spread."
        : math.years > 7
          ? `At ${kgWeek} kg/week and keeping ~$${fmt(math.take)}/kg of the farm-to-wholesale spread, a $${fmt(capex, 0)} layer takes ~${fmt(math.years, 1)} years. Rent it.`
          : math.years > 3
            ? `Same math: ~${fmt(math.years, 1)} years. Contract the layer; do not buy the building yet.`
            : `Same math: ~${fmt(math.years, 1)} years. Only then is owning this layer a conversation — and only after you have sold the output for a year.`;
    return (
      <div>
        <h2 className="font-display text-2xl">Vertical agent</h2>
        <p className="mt-2 text-sm text-ink-soft">{layers?.thesis}</p>
        <p className="mt-3">
          Farm-to-wholesale gap on this item:{" "}
          <b>{math.spread == null ? "—" : `$${fmt(math.spread)}/kg`}</b>. You do not keep the whole gap.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="text-sm">
            kg / week you can actually sell
            <input
              type="number"
              className="ml-2 min-h-11 w-28 rounded-lg border border-line bg-paper px-2"
              value={kgWeek}
              onChange={(e) => setKgWeek(Number(e.target.value) || 0)}
            />
          </label>
          <label className="text-sm">
            capex of the layer (CAD)
            <input
              type="number"
              className="ml-2 min-h-11 w-36 rounded-lg border border-line bg-paper px-2"
              value={capex}
              onChange={(e) => setCapex(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <p className="mt-4 font-medium">{rec}</p>
        <div className="mt-4 space-y-3">
          {(layers?.layers || []).map((l: Layer) => (
            <div key={l.id} className="rounded-lg border border-line p-3">
              <h3 className="font-medium">
                {l.name}{" "}
                <span className="text-xs font-normal text-ink-soft">{l.integrate}</span>
              </h3>
              <p className="text-sm text-ink-soft">
                <b>Own if</b> {l.ownIf}
              </p>
              <p className="text-sm text-ink-soft">
                <b>Rent if</b> {l.rentIf}
              </p>
              <p className="text-xs text-ink-soft">
                {l.capexCad} · cash tied ~{l.workingDays}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const farm = p.farm
    ? `$${fmt(p.farm.cadKg)}/kg ($${fmt(p.farm.usdLb)}/lb USD) · ${p.farm.d.slice(0, 7)}`
    : "no NASS series";
  const ws = p.wholesale
    ? `$${fmt(p.wholesale.p50)}/kg Vancouver ask · week ${p.wholesale.asof}`
    : "no AAFC mid";
  const weeks = seriesFor(marketFile, p.cmd);
  const outlook = forecastFor(marketFile, p.cmd);
  const next = outlook[0];
  return (
    <div>
      <h2 className="font-display text-3xl leading-tight">{p.verdict.title}</h2>
      <p className={cn("mt-3 rounded-lg px-3 py-2 text-sm", VERDICT_TONE[p.verdict.cls])}>
        {p.verdict.note}
      </p>
      <ul className="mt-2 list-none p-0">
        <Step n="1" label="Your quote as CAD/kg" value={`$${fmt(p.quoteCadKg)} · ${p.basis} · ${p.form}`} />
        <Step n="2" label="US farm gate (NASS, national monthly)" value={farm} />
        <Step n="3" label="Public wholesale mid (AAFC Vancouver)" value={ws} />
        <Step
          n="4"
          label="This week vs last year"
          value={
            p.wholesale?.yoy == null
              ? "—"
              : `${p.wholesale.yoy}% YoY${p.wholesale.wow != null ? ` · ${p.wholesale.wow}% week-on-week` : ""}`
          }
        />
        <Step
          n="5"
          label="Where your number sits in farm history"
          value={
            p.quoteVsSeasonPct == null
              ? "—"
              : `${p.quoteVsSeasonPct}th percentile for this calendar month`
          }
        />
        <Step
          n="6"
          label="Next week outlook (naive)"
          value={next ? `$${fmt(next.p)}/kg (band ${fmt(next.lo)}–${fmt(next.hi)})` : "not enough weeks"}
        />
      </ul>
      <h3 className="mt-4 font-display text-lg">Ask + outlook</h3>
      <OutlookChart hist={weeks} forecast={outlook} quote={p.quoteCadKg} />
      <div className="mt-4">
        <HistoryChart hist={p.hist} quoteCadKg={p.quoteCadKg} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        If the quote is FOB, add reefer to Toronto before you call it cheap. If it is processed, ignore the fresh carton print. Outlook is seasonal, not a hedge.
      </p>
    </div>
  );
}
