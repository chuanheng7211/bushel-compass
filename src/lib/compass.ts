import { catalog } from "./catalog";
import type {
  Analysis,
  Basis,
  CommodityPlay,
  LayersFile,
  MarketFile,
  MarketSnap,
  MonthlyPt,
  NassFile,
  Playbooks,
  Unit,
  Verdict,
} from "./types";

export const FX = 1.3863;
export const LB_PER_KG = 2.20462;

export function toCadKg(value: number, unit: Unit, fx = FX): number | null {
  if (!Number.isFinite(value)) return null;
  if (unit === "cadKg") return value;
  if (unit === "cadLb") return value * LB_PER_KG;
  if (unit === "usdLb") return value * LB_PER_KG * fx;
  if (unit === "usdKg") return value * fx;
  return value;
}

export function fmt(n: number | null | undefined, d = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(d);
}

export function percentile(sorted: number[], x: number): number | null {
  if (!sorted.length) return null;
  let below = 0;
  for (const v of sorted) if (v <= x) below++;
  return Math.round((below / sorted.length) * 100);
}

export function monthSlice(pts: MonthlyPt[], month: number): number[] {
  return pts.filter((p) => p.m === month).map((p) => p.cadKg);
}

export function regionalWholesale(market: MarketFile | null, cmd: string) {
  const centres = ["Vancouver", "Calgary", "Edmonton", "Winnipeg"];
  return centres.map((centre) => ({
    centre,
    snap: wholesaleFor(market, cmd, centre),
  }));
}

export function wholesaleFor(
  market: MarketFile | null,
  cmd: string,
  centre = "Vancouver",
): MarketSnap | null {
  const rows = (market?.snapshot || []).filter(
    (s) => s.centre === centre && s.cmd === cmd,
  );
  return rows[0] || null;
}

export function seriesFor(
  market: MarketFile | null,
  cmd: string,
  centre = "Vancouver",
) {
  return market?.series?.[`${centre}|${cmd}`] || [];
}

export function forecastFor(
  market: MarketFile | null,
  cmd: string,
  centre = "Vancouver",
) {
  return market?.forecast?.[`${centre}|${cmd}`] || [];
}

export function movers(market: MarketFile | null, centre = "Vancouver", n = 8) {
  const rows = (market?.snapshot || []).filter(
    (s) => s.centre === centre && s.yoy != null,
  );
  return [...rows]
    .sort((a, b) => Math.abs(b.yoy || 0) - Math.abs(a.yoy || 0))
    .slice(0, n);
}

export function nassFor(play: Playbooks | null, nass: NassFile | null, cmd: string) {
  const key =
    play?.commodities[cmd]?.nass || catalog.find((c) => c.label === cmd)?.nass;
  if (!key || !nass) return null;
  return nass.series[key] || null;
}

export function verdict(
  quoteCadKg: number,
  farmCadKg: number | undefined,
  wholesaleCadKg: number | undefined,
  basis: Basis,
): Verdict {
  if (basis === "farm" && farmCadKg) {
    const r = quoteCadKg / farmCadKg;
    if (r <= 1.1)
      return {
        cls: "great",
        title: "Near the farm print",
        note: "Close to what US growers were paid nationally last month. Confirm variety and fresh vs process.",
      };
    if (r <= 1.35)
      return {
        cls: "good",
        title: "Farm + a thin pack",
        note: "A little over farm-gate is normal if they already packed.",
      };
    return {
      cls: "rich",
      title: "Rich for farm gate",
      note: "If this is truly field price, shop another grower or ask if it is packed FOB.",
    };
  }
  if (basis === "process" && farmCadKg) {
    const r = quoteCadKg / farmCadKg;
    if (r <= 0.85)
      return {
        cls: "great",
        title: "Looks like process stock",
        note: "Processing should clear below fresh farm-gate. This sits in that band.",
      };
    return {
      cls: "fair",
      title: "Check the spec",
      note: "Processed quotes should not track extra-fancy fresh. Ask peelers vs juice vs IQF.",
    };
  }
  const bench = wholesaleCadKg || (farmCadKg ? farmCadKg * 1.8 : undefined);
  if (!bench)
    return {
      cls: "fair",
      title: "Need more prints",
      note: "No wholesale mid for this item. Use farm history and origin season only.",
    };
  const r = quoteCadKg / bench;
  if (basis === "retail") {
    if (r <= 1.15)
      return {
        cls: "great",
        title: "Shelf near wholesale",
        note: "Retail this close to wholesale is a deal — or a distressed pack.",
      };
    if (r <= 1.8)
      return {
        cls: "fair",
        title: "Ordinary retail",
        note: "Typical grocery ask after shrink and store labor.",
      };
    return {
      cls: "rich",
      title: "Rich retail",
      note: "You are paying the store's full markup. Better to buy wholesale or FOB.",
    };
  }
  if (r <= 0.9)
    return {
      cls: "great",
      title: "Cheap vs the public ask",
      note: "Under the Vancouver wholesale mid (AAFC). Confirm quality, pack, and variety.",
    };
  if (r <= 1.15)
    return {
      cls: "good",
      title: "In the fair band",
      note: "Inside about 15% of the public wholesale mid. A normal conversation.",
    };
  if (r <= 1.4)
    return {
      cls: "fair",
      title: "A bit rich",
      note: "Ask for a different origin, a larger pack, or a program off USDA FOB.",
    };
  return {
    cls: "rich",
    title: "Walk or change channel",
    note: "Well above the public destination ask. Try another country, a terminal break, or FOB plus freight.",
  };
}

export function analyzeQuote(opts: {
  cmd: string;
  form: string;
  unit: Unit;
  basis: Basis;
  originNote: string;
  price: number;
  play: Playbooks;
  nass: NassFile;
  market: MarketFile;
}): Analysis | null {
  const fx = opts.nass.fxUsdCad || opts.market.fxUsdCad || FX;
  const quoteCadKg = toCadKg(opts.price, opts.unit, fx);
  if (!quoteCadKg) return null;
  const series = nassFor(opts.play, opts.nass, opts.cmd);
  const farmLatest = series?.latest || null;
  const hist = series?.monthly || [];
  const thisMonth = farmLatest?.m || new Date().getMonth() + 1;
  const seasonal = monthSlice(hist, thisMonth).sort((a, b) => a - b);
  const all = hist.map((p) => p.cadKg).sort((a, b) => a - b);
  const ws = wholesaleFor(opts.market, opts.cmd);
  const play: CommodityPlay | null = opts.play.commodities[opts.cmd] || null;
  return {
    cmd: opts.cmd,
    form: opts.form,
    unit: opts.unit,
    basis: opts.basis,
    originNote: opts.originNote,
    quoteCadKg,
    farm: farmLatest,
    farmPctMonth: farmLatest ? percentile(seasonal, farmLatest.cadKg) : null,
    quoteVsFarmPct: farmLatest ? percentile(all, quoteCadKg) : null,
    quoteVsSeasonPct: seasonal.length ? percentile(seasonal, quoteCadKg) : null,
    wholesale: ws,
    play,
    hist,
    verdict: verdict(quoteCadKg, farmLatest?.cadKg, ws?.p50, opts.basis),
  };
}

export function paybackYears(opts: {
  farm?: number;
  wholesale?: number;
  kgWeek: number;
  capex: number;
}): { spread: number | null; take: number; years: number | null } {
  const spread =
    opts.farm != null && opts.wholesale != null ? opts.wholesale - opts.farm : null;
  const take = spread != null ? Math.max(spread * 0.25, 0) : 0.15;
  const years =
    take > 0 && opts.kgWeek > 0 ? opts.capex / (take * opts.kgWeek * 52) : null;
  return { spread, take, years };
}

export async function loadPublicData(): Promise<{
  play: Playbooks;
  nass: NassFile;
  market: MarketFile;
  layers: LayersFile;
}> {
  const [play, nass, market, layers] = await Promise.all([
    fetch("/data/playbooks.json").then((r) => r.json() as Promise<Playbooks>),
    fetch("/data/nass_farm.json").then((r) => r.json() as Promise<NassFile>),
    fetch("/data/market.json").then((r) =>
      r.ok ? (r.json() as Promise<MarketFile>) : { snapshot: [] },
    ),
    fetch("/data/layers.json").then((r) => r.json() as Promise<LayersFile>),
  ]);
  return { play, nass, market, layers };
}
