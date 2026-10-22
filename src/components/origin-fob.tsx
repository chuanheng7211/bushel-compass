import { Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { amsFile, amsLane, availLabel, impliedFob } from "@/lib/ams";
import { cropPrints } from "@/lib/catalog";
import { useDeskMoney } from "@/lib/desk-money";
import { cn } from "@/lib/utils";

export function OriginFob({ cmd }: { cmd: string }) {
  const { cad, tag } = useDeskMoney();
  const { dest, truck, fob, lane } = impliedFob(cmd);
  const farm = cropPrints(cmd).farm ?? null;
  if (!lane) {
    return (
      <section className="rounded-xl border border-line bg-cream p-5">
        <h2 className="font-display text-lg">Origin FOB · {cmd}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          No AMS truck lane on this crop. MARS shipping-point FOB is keyed — we do not invent a district print.
        </p>
      </section>
    );
  }
  const chart = lane.series.map((p) => ({ d: p.d.slice(5), cadKg: p.cadKg, usd: p.midUsd }));
  const gap = farm != null && fob != null ? fob - farm : null;

  return (
    <section className="rounded-xl border border-line bg-cream p-5">
      <p className="text-xs uppercase tracking-wide text-ink-soft">AMS truck · implied origin</p>
      <h2 className="font-display text-2xl leading-tight">{cmd}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {lane.origin} → {lane.dest}. {cad(lane.cadKg)} {tag} on a 40,000 lb reefer. {availLabel(lane.avail)}. Not MARS FOB.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile k="US farm" v={farm != null ? cad(farm) : "—"} d="NASS, monthly" />
        <Tile k="Implied FOB" v={fob != null ? cad(fob) : "—"} d="Dest − truck. Ceiling, not a pit." />
        <Tile k="AMS truck" v={cad(lane.cadKg)} d={`$${lane.midUsd.toFixed(0)} / load · ${lane.asof}`} />
        <Tile k="Vancouver dest" v={dest != null ? cad(dest) : "—"} d="AAFC ask this week" />
      </ul>
      {gap != null ? (
        <p className="mt-3 text-sm text-ink-soft">
          Farm to implied FOB is {cad(gap)} {tag} — packer, carton, and the importer. Truck on this west lane is{" "}
          {truck != null && dest ? `${((truck / dest) * 100).toFixed(1)}%` : "—"} of dest.
        </p>
      ) : null}
      {chart.length > 2 ? (
        <div className="mt-4 h-48 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} width={40} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(3)} /kg`, "Truck"]}
                contentStyle={{ background: "var(--color-cream)", border: "1px solid var(--color-line)", borderRadius: 12 }}
              />
              <Line type="monotone" dataKey="cadKg" stroke="var(--color-ink)" dot={false} strokeWidth={2} name="Truck CAD/kg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-ink-soft">
        {amsFile.note} Pulled {amsFile.generated}.{" "}
        <Link to="/world" search={{ cmd }} className="text-ink">
          Stack with FAO and diesel →
        </Link>
      </p>
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

export function OriginFobStrip({ cmd }: { cmd: string }) {
  const { cad } = useDeskMoney();
  const { fob, truck, lane } = impliedFob(cmd);
  if (!lane) return null;
  return (
    <p className={cn("text-sm text-ink-soft")}>
      AMS truck {cad(truck)} /kg ({lane.dest}). Implied origin ceiling {cad(fob)} /kg.
    </p>
  );
}
