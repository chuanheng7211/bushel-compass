import { impliedFob } from "./ams";
import { catalog, cropPrints, fullPlaybooks } from "./catalog";
import { forecastFor, nassFor, percentile, seriesFor, wholesaleFor } from "./compass";
import { marketFile, nassFarm } from "./data";
import worldJson from "@/data/world.json";
import { namesForCrop } from "./markets";
import { tapeCrop } from "./tape-check";
import type { LiveQuote } from "./yahoo-quotes";
import type { ForecastPt, WeekPt } from "./types";

const world = worldJson as {
  latest?: Record<string, number | string | null>;
  yoy?: Record<string, number | null>;
  series?: { d: string; food: number | null; oils: number | null; cereals: number | null; sugar: number | null }[];
};

export type FactorDir = "up" | "down" | "flat";

export type WorldFactor = {
  id: string;
  k: string;
  print: string;
  dir: FactorDir;
  so: string;
  /** Rough signed pressure on landed CAD, percentage points. Honest order of magnitude, not a model. */
  nudge: number;
};

export type WorldOutlook = {
  cmd: string;
  dest: number | null;
  destWow: number | null;
  destYoy: number | null;
  origins: string;
  farm: number | null;
  farmPct: number | null;
  nextMid: number | null;
  nextLo: number | null;
  nextHi: number | null;
  landed: number | null;
  nudge: number;
  call: "cover" | "watch" | "wait";
  thesis: string;
  factors: WorldFactor[];
  hist: WeekPt[];
  forecast: ForecastPt[];
  fao: { d: string; food: number | null; oils: number | null; cereals: number | null }[];
  destMonthly: { d: string; dest: number; food: number | null }[];
};

function liveOf(live: Map<string, LiveQuote> | undefined, symbol: string): LiveQuote | undefined {
  return live?.get(symbol);
}

function dirOf(n: number | null | undefined, lo = -0.4, hi = 0.4): FactorDir {
  if (n == null || Number.isNaN(n)) return "flat";
  if (n > hi) return "up";
  if (n < lo) return "down";
  return "flat";
}

export function worldOutlook(cmd: string, live?: Map<string, LiveQuote>): WorldOutlook {
  const play = fullPlaybooks();
  const snap =
    wholesaleFor(marketFile, cmd) ||
    (cmd === "Sweet Corn" ? wholesaleFor(marketFile, "Corn") : null);
  const p = cropPrints(cmd);
  const series = nassFor(play, nassFarm, cmd);
  const farm = p.farm ?? series?.latest?.cadKg ?? null;
  const histNass = series?.monthly || [];
  const m = series?.latest?.m || new Date().getMonth() + 1;
  const seasonal = histNass.filter((x) => x.m === m).map((x) => x.cadKg).sort((a, b) => a - b);
  const farmPct = farm != null && seasonal.length ? percentile(seasonal, farm) : null;
  const dest = snap?.p50 ?? p.wholesale ?? null;
  const wow = snap?.wow ?? null;
  const yoy = snap?.yoy ?? null;
  const origins = (snap?.origins || [])
    .slice(0, 3)
    .map((row) => `${row[0]} ${row[1]}`)
    .join(" · ");
  const hist = seriesFor(marketFile, cmd).length
    ? seriesFor(marketFile, cmd)
    : seriesFor(marketFile, cmd === "Sweet Corn" ? "Corn" : cmd);
  const forecast = (forecastFor(marketFile, cmd).length
    ? forecastFor(marketFile, cmd)
    : forecastFor(marketFile, cmd === "Sweet Corn" ? "Corn" : cmd)
  ).slice(0, 8);
  const next = forecast[0];
  const nextMid = next?.p ?? dest;
  const faoYoy = world.yoy || {};
  const faoLatest = world.latest || {};
  const diesel = liveOf(live, "HO=F");
  const fx = liveOf(live, "USDCAD=X");
  const mxn = liveOf(live, "USDMXN=X");
  const ntrLive = liveOf(live, "NTR");
  const ntrSnap = namesForCrop(cmd).find((n) => n.symbol === "NTR");
  const hold = tapeCrop(cmd);
  const mexico = /MX|Mexico/i.test(origins);
  const ams = impliedFob(cmd);
  const lane = ams.lane;

  const factors: WorldFactor[] = [];
  const destNudge = wow != null ? Math.max(-6, Math.min(6, wow * 0.35)) : 0;
  factors.push({
    id: "dest",
    k: "Vancouver dest",
    print: dest != null ? `$${dest.toFixed(2)}/kg` : "—",
    dir: dirOf(wow),
    nudge: destNudge,
    so: [wow != null ? `${wow > 0 ? "+" : ""}${wow.toFixed(1)}% WoW` : "weekly ask", yoy != null ? `${yoy > 0 ? "+" : ""}${yoy.toFixed(0)}% YoY` : null, origins || null]
      .filter(Boolean)
      .join(" · "),
  });
  if (farm != null) {
    const n = farmPct != null ? (farmPct - 50) / 50 : 0;
    factors.push({
      id: "farm",
      k: "US farm gate",
      print: `$${farm.toFixed(2)}/kg`,
      dir: dirOf(n, 0.2, -0.2) === "flat" ? dirOf(n) : n > 0.15 ? "up" : n < -0.15 ? "down" : "flat",
      nudge: farmPct != null && farmPct > 80 ? 1.2 : farmPct != null && farmPct < 20 ? -0.8 : 0,
      so: farmPct != null ? `${Math.round(farmPct)}th percentile for this month. Lags dest by weeks.` : "NASS monthly, all grades.",
    });
  }
  const oilsYoy = faoYoy.oils ?? null;
  factors.push({
    id: "fao-oils",
    k: "FAO oils",
    print: faoLatest.oils != null ? String(faoLatest.oils) : "—",
    dir: dirOf(oilsYoy, -8, 8),
    nudge: oilsYoy != null && oilsYoy > 12 ? 1.5 : oilsYoy != null && oilsYoy < -12 ? -0.8 : 0,
    so: `${oilsYoy != null ? `${oilsYoy > 0 ? "+" : ""}${oilsYoy}% YoY` : "index"}. Freight, resin, packing — not the leaf.`,
  });
  const foodYoy = faoYoy.food ?? null;
  factors.push({
    id: "fao-food",
    k: "FAO food",
    print: faoLatest.food != null ? String(faoLatest.food) : "—",
    dir: dirOf(foodYoy, -4, 4),
    nudge: foodYoy != null && foodYoy > 8 ? 0.6 : 0,
    so: `${foodYoy != null ? `${foodYoy > 0 ? "+" : ""}${foodYoy}% YoY` : "index"}. World staples weather around produce.`,
  });
  const dChg = diesel?.chgPct ?? null;
  factors.push({
    id: "diesel",
    k: "Diesel HO=F",
    print: diesel?.price != null ? `$${diesel.price.toFixed(2)}` : "—",
    dir: dirOf(dChg),
    nudge: dChg != null ? Math.max(-3, Math.min(3, dChg * 0.25)) : 0,
    so: dChg != null ? `${dChg > 0 ? "+" : ""}${dChg.toFixed(1)}% session. Reefer miles on landed, dest FOB can sit still.` : "ULSD proxy. Live delayed Yahoo.",
  });
  const fxChg = fx?.chgPct ?? null;
  factors.push({
    id: "fx",
    k: "USD/CAD",
    print: fx?.price != null ? fx.price.toFixed(4) : "—",
    dir: dirOf(fxChg),
    nudge: fxChg != null ? Math.max(-2, Math.min(2, fxChg * 0.6)) : 0,
    so: fxChg != null ? `${fxChg > 0 ? "+" : ""}${fxChg.toFixed(2)}%. Stronger USD makes US origin dearer in CAD.` : "Converts USDA prints into CAD.",
  });
  if (mexico) {
    const mChg = mxn?.chgPct ?? null;
    factors.push({
      id: "mxn",
      k: "USD/MXN",
      print: mxn?.price != null ? mxn.price.toFixed(2) : "—",
      dir: dirOf(mChg),
      nudge: mChg != null ? Math.max(-1.5, Math.min(1.5, mChg * 0.2)) : 0,
      so: "Mexico is on this week's mix. Peso moves Nogales FOB in dollars.",
    });
  }
  const ntr1m = ntrSnap?.ret1m ?? null;
  const ntrChg = ntrLive?.chgPct ?? ntr1m;
  const ntrPx = ntrLive?.price ?? ntrSnap?.price ?? null;
  factors.push({
    id: "fert",
    k: "Fertilizer NTR",
    print: ntrPx != null ? `$${ntrPx.toFixed(2)}` : "—",
    dir: dirOf(ntrChg, -1, 1),
    nudge: ntr1m != null && ntr1m > 8 ? 0.4 : 0,
    so: "Next planting's floor. Does not reprice this week's carton.",
  });
  if (lane && ams.truck != null) {
    const share = dest != null && dest > 0 ? (ams.truck / dest) * 100 : 0;
    factors.push({
      id: "ams",
      k: "AMS truck",
      print: `$${ams.truck.toFixed(2)}/kg`,
      dir: share > 8 ? "up" : "flat",
      nudge: share > 12 ? 1.2 : share > 6 ? 0.4 : 0,
      so: `${lane.origin.split(",")[0]} → ${lane.dest}. $${lane.midUsd.toFixed(0)}/load. Implied FOB ceiling ${ams.fob != null ? `$${ams.fob.toFixed(2)}` : "—"}. Not MARS FOB.`,
    });
  }
  if (hold?.ratio != null) {
    factors.push({
      id: "hold",
      k: "Held-out book",
      print: `${hold.ratio.toFixed(2)}× dest`,
      dir: hold.ratio < 0.9 ? "down" : hold.ratio > 1.3 ? "up" : "flat",
      nudge: 0,
      so: "Same-week dest tracked that delivered house. Dest is the ceiling, not a 1.25× floor.",
    });
  }

  const nudge = factors.reduce((s, f) => s + f.nudge, 0);
  const landed = nextMid != null ? nextMid * (1 + nudge / 100) : dest;
  let call: WorldOutlook["call"] = "watch";
  if ((yoy ?? 0) > 25 && (wow ?? 0) >= 0 && nudge > 0) call = "cover";
  else if ((yoy ?? 0) < -20 || (wow ?? 0) < -8 || nudge < -3) call = "wait";
  else if (nudge > 2.5 && (wow ?? 0) > 0) call = "cover";

  const thesis =
    call === "cover"
      ? `Cover ${cmd}. Dest next weeks ~${fmt(nextMid)}. Combined factors nudge landed toward ${fmt(landed)} CAD/kg.`
      : call === "wait"
        ? `Wait on ${cmd}. Dest ${fmt(dest)} with ${nudge.toFixed(1)} pp of factor pressure. Don’t chase.`
        : `Watch ${cmd}. Dest ${fmt(dest)}. Factors net ${nudge >= 0 ? "+" : ""}${nudge.toFixed(1)} pp on landed — not a reason to stretch.`;

  const fao = (world.series || []).slice(-24).map((r) => ({
    d: r.d.slice(0, 7),
    food: r.food,
    oils: r.oils,
    cereals: r.cereals,
  }));
  const destMonthly = monthlyDestVsFao(hist, world.series || []);

  return {
    cmd,
    dest,
    destWow: wow,
    destYoy: yoy,
    origins,
    farm,
    farmPct,
    nextMid,
    nextLo: next?.lo ?? snap?.p20 ?? null,
    nextHi: next?.hi ?? snap?.p80 ?? null,
    landed,
    nudge,
    call,
    thesis,
    factors,
    hist,
    forecast,
    fao,
    destMonthly,
  };
}

function monthlyDestVsFao(
  hist: WeekPt[],
  fao: { d: string; food: number | null }[],
): { d: string; dest: number; food: number | null }[] {
  const buckets = new Map<string, number[]>();
  for (const w of hist) {
    const key = w.d.slice(0, 7);
    const arr = buckets.get(key) || [];
    arr.push(w.p50);
    buckets.set(key, arr);
  }
  const faoBy = new Map(fao.map((r) => [r.d.slice(0, 7), r.food]));
  const keys = [...buckets.keys()].sort().slice(-18);
  if (!keys.length) return [];
  const baseDest = median(buckets.get(keys[0]) || []) || 1;
  const baseFood = faoBy.get(keys[0]) || 100;
  return keys.map((k) => {
    const dest = median(buckets.get(k) || []) || 0;
    const food = faoBy.get(k);
    return {
      d: k,
      dest: (dest / baseDest) * 100,
      food: food != null ? (food / baseFood) * 100 : null,
    };
  });
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

export function worldCrops(): string[] {
  return catalog.filter((c) => c.aafc).map((c) => c.label);
}

export const CALL_LABEL = {
  cover: "Cover — lock dest",
  watch: "Watch — no stretch",
  wait: "Wait — don’t chase",
} as const;
