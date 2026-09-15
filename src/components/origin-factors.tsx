import { Snowflake, Sun, CloudRain, Warehouse, Ship, Truck, ScanSearch } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { couplingsFor, factorPulls, factorsFor, type FactorKind } from "@/lib/origin-story";
import type { BeltRow } from "@/lib/origin-geo";

const ICONS: Record<FactorKind, typeof Snowflake> = {
  frost: Snowflake,
  heat: Sun,
  rain: CloudRain,
  storage: Warehouse,
  boat: Ship,
  freight: Truck,
  spec: ScanSearch,
};

export function OriginFactors({
  cmd,
  month,
  rows,
}: {
  cmd: string;
  month: number;
  rows: BeltRow[];
}) {
  const factors = factorsFor(cmd, month, rows);
  const links = couplingsFor(cmd, month);
  const pull = factorPulls(rows, month);

  return (
    <div>
      <h3 className="font-display text-lg">Weather and the other clocks</h3>
      <p className="text-xs text-ink-soft">
        This is the seasonal climate desk, not this morning’s forecast. A freeze in a live belt reprices the SKU in days. FAO will not.
      </p>

      {pull.countries.length ? (
        <p className="mt-2 text-sm">
          On now: <b>{pull.countries.join(" · ")}</b>
          {pull.truckDays != null ? ` · fastest truck ${pull.truckDays}d` : ""}
          {pull.boatDays != null ? ` · boat ${pull.boatDays}d+` : ""}.
        </p>
      ) : null}

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {factors.map((f) => {
          const Icon = ICONS[f.kind];
          return (
            <li key={f.id} className="rounded-xl border border-line bg-cream p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-soft">
                <Icon className="h-3.5 w-3.5" />
                {f.kind} · {f.where}
              </div>
              <h4 className="mt-1 font-medium">{f.t}</h4>
              <p className="mt-1 text-sm text-ink-soft">{f.d}</p>
            </li>
          );
        })}
      </ul>

      {links.length ? (
        <div className="mt-4">
          <h3 className="font-display text-lg">How they pull on each other</h3>
          <ul className="mt-2 space-y-2">
            {links.map((c) => (
              <li
                key={c.id}
                className="grid gap-2 rounded-xl border border-line bg-cream p-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center"
              >
                <Step k="If" t={c.if} />
                <ArrowRight className="hidden h-4 w-4 text-ink-soft md:block" />
                <Step k="Then" t={c.then} />
                <ArrowRight className="hidden h-4 w-4 text-ink-soft md:block" />
                <Step k="So" t={c.so} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Step({ k, t }: { k: string; t: string }) {
  return (
    <p className="text-sm">
      <span className="block text-xs uppercase tracking-wide text-ink-soft">{k}</span>
      {t}
    </p>
  );
}
