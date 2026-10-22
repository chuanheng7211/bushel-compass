import { Link } from "@tanstack/react-router";
import { impliedFob } from "@/lib/ams";
import { cropPrints } from "@/lib/catalog";
import { useDeskMoney } from "@/lib/desk-money";
import { groceryPrints } from "@/lib/grocery";
import { namesForCrop } from "@/lib/markets";
import { cn } from "@/lib/utils";

type Layer = {
  k: string;
  source: string;
  learn: string;
  value: string;
  note?: string;
  to?: "/" | "/origins" | "/grocery" | "/board" | "/markets" | "/world" | "/order";
  search?: Record<string, string>;
};

export function DataLayers({ cmd }: { cmd: string }) {
  const { cad } = useDeskMoney();
  const p = cropPrints(cmd);
  const g = groceryPrints(cmd);
  const listed = namesForCrop(cmd);
  const fob = impliedFob(cmd);
  const yoy =
    g.yoy != null
      ? `${g.yoy > 0 ? "+" : ""}${g.yoy.toFixed(1)}% YoY`
      : undefined;
  const layers: Layer[] = [
    {
      k: "Farm gate",
      source: "USDA NASS",
      learn: "What the grower was paid, monthly, all grades on the series.",
      value: p.farm != null ? cad(p.farm) : "No farm print",
    },
    {
      k: "Wholesale ask",
      source: "AAFC InfoHort · Vancouver",
      learn: "Terminal midpoint this week. The carton, not the shelf.",
      value: g.wholesale != null ? cad(g.wholesale) : "No Vancouver snap",
      note: yoy,
    },
    {
      k: "AMS truck / implied FOB",
      source: "AMS refrigerated truck · public SODA",
      learn: "MARS shipping-point is keyed. Dest minus this truck is the room left for origin FOB — not a reported FOB.",
      value: fob.fob != null ? cad(fob.fob) : "No truck lane",
      note: fob.lane ? `${fob.lane.dest} · ${cad(fob.truck)} truck` : undefined,
      to: "/world",
      search: { cmd },
    },
    {
      k: "Origin mix",
      source: "AAFC origins on the snap",
      learn: "Who packed this week vs the calendar. Country of origin walks.",
      value: g.origins || "Calendar only",
      to: "/origins",
    },
    {
      k: "Grocery average",
      source: "BLS APU",
      learn: "US city-average retail, converted. Not a GTA flyer.",
      value: g.bls != null ? cad(g.bls) : "No BLS series",
      note: g.blsAsOf || undefined,
      to: "/grocery",
      search: { cmd },
    },
    {
      k: "Sales chain",
      source: "Process + substitute forms",
      learn: "Frozen, dried, juice — the other public prices on the same crop.",
      value: "Fresh is not the only tape",
      to: "/board",
    },
    {
      k: listed.length ? "Listed names" : "World index",
      source: listed.length ? "Delayed futures / equities" : "FAO food price index",
      learn: listed.length
        ? listed.map((n) => n.symbol).join(" · ")
        : "Global produce conditions vs the public tape.",
      value: listed.length ? `${listed.length} listed` : "FAO FPI",
      to: listed.length ? "/markets" : "/world",
      search: listed.length ? { crop: cmd } : { cmd },
    },
    {
      k: "World + 原物料",
      source: "FAO + dest + diesel + FX",
      learn: "Combine the files: dest forecast, farm, FAO oils, diesel, CAD. A landed look, not a pit.",
      value: g.yoy != null ? `${g.yoy > 0 ? "+" : ""}${g.yoy.toFixed(0)}% dest YoY` : "Open World",
      to: "/world",
      search: { cmd },
    },
  ];

  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-ink-soft">What these files say · {cmd}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {layers.map((layer) => {
          const body = (
            <>
              <span className="text-xs uppercase tracking-wide text-ink-soft">{layer.source}</span>
              <span className="mt-1 block font-display text-lg leading-tight">{layer.k}</span>
              <span className="mt-2 block font-display text-2xl leading-tight tabular-nums">{layer.value}</span>
              {layer.note ? <span className="mt-1 block text-sm text-ink-soft">{layer.note}</span> : null}
              <span className="mt-2 block text-sm text-ink-soft">{layer.learn}</span>
            </>
          );
          return (
            <li key={layer.k}>
              {layer.to ? (
                <Link
                  to={layer.to}
                  search={layer.search}
                  className={cn(
                    "flex min-h-11 h-full flex-col rounded-xl border border-line bg-cream p-4 text-ink no-underline",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-xl border border-line bg-cream p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
