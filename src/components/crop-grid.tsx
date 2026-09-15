import { catalog, cropPrints } from "@/lib/catalog";
import { compareHit } from "@/lib/desk-compare";
import { fmtPct } from "@/lib/desk-filter";
import { useDeskMoney } from "@/lib/desk-money";
import { cn } from "@/lib/utils";

export function CropGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (label: string) => void;
}) {
  const { tag } = useDeskMoney();
  const nass = catalog.filter((c) => c.group === "nass");
  const extra = catalog.filter((c) => c.group === "aafc-only");

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl">All items on this desk</h2>
        <p className="text-xs text-ink-soft">
          {nass.length} USDA farm series · {extra.length} Canadian wholesale only · {tag}
        </p>
      </div>
      <Group title="USDA NASS farm-gate" items={nass} value={value} onChange={onChange} />
      <Group title="AAFC wholesale only — no monthly USDA farm print" items={extra} value={value} onChange={onChange} />
    </div>
  );
}

function Group({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: { label: string }[];
  value: string;
  onChange: (label: string) => void;
}) {
  const { cad, compare } = useDeskMoney();
  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">{title}</h3>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((c) => {
          const p = cropPrints(c.label);
          const on = value === c.label;
          const shown = p.wholesale ?? p.farm ?? null;
          const hit = compareHit(c.label, shown, compare);
          return (
            <li key={c.label}>
              <button
                type="button"
                onClick={() => onChange(c.label)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-3 text-left",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                )}
              >
                <span className="font-medium">{c.label}</span>
                <span className={cn("mt-1 text-xs", on ? "opacity-80" : "text-ink-soft")}>
                  {p.farm != null ? `farm ${cad(p.farm)}` : "no farm"}
                  {p.wholesale != null ? ` · ask ${cad(p.wholesale)}` : ""}
                </span>
                {hit && hit.pct != null ? (
                  <span className={cn("mt-0.5 text-xs tabular-nums", on ? "opacity-80" : (hit.pct > 0 ? "text-rich" : "text-moss"))}>
                    {fmtPct(hit.pct)} {hit.label}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
