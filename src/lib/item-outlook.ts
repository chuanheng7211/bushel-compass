import { impliedFob } from "./ams";
import { catalog, cropPrints, fullPlaybooks } from "./catalog";
import { forecastFor, nassFor, percentile, seriesFor, wholesaleFor } from "./compass";
import { marketFile, nassFarm } from "./data";
import { groceryPrints } from "./grocery";
import { namesForCrop } from "./markets";
import type { ScoredLine } from "./order-book";
import { tapeCheck, tapeCrop } from "./tape-check";
import type { ForecastPt, ListedName, MonthlyPt, WeekPt } from "./types";

export type PriceCall = "cover" | "watch" | "wait";

export type Driver = { k: string; v: string; so: string };

export type ItemOutlook = {
  cmd: string;
  farm: number | null;
  farmAsOf: string | null;
  farmPctMonth: number | null;
  wholesale: number | null;
  p20: number | null;
  p80: number | null;
  wow: number | null;
  yoy: number | null;
  origins: string;
  bls: number | null;
  bookMed: number | null;
  bookN: number;
  hist: WeekPt[];
  forecast: ForecastPt[];
  listed: ListedName[];
  nextLo: number | null;
  nextMid: number | null;
  nextHi: number | null;
  deliveredFair: number | null;
  deliveredRich: number | null;
  call: PriceCall;
  thesis: string;
  why: string[];
  drivers: Driver[];
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

export function outlookFor(cmd: string, book: ScoredLine[] = []): ItemOutlook {
  const play = fullPlaybooks();
  const snap =
    wholesaleFor(marketFile, cmd) ||
    (cmd === "Sweet Corn" ? wholesaleFor(marketFile, "Corn") : null);
  const p = cropPrints(cmd);
  const series = nassFor(play, nassFarm, cmd);
  const farm = p.farm ?? series?.latest?.cadKg ?? null;
  const histNass: MonthlyPt[] = series?.monthly || [];
  const thisMonth = series?.latest?.m || new Date().getMonth() + 1;
  const seasonal = histNass.filter((x) => x.m === thisMonth).map((x) => x.cadKg).sort((a, b) => a - b);
  const farmPctMonth = farm != null && seasonal.length ? percentile(seasonal, farm) : null;
  const g = groceryPrints(cmd);
  const conv = book
    .filter((l) => l.cmd === cmd && !l.organic && l.quoteCadKg != null)
    .map((l) => l.quoteCadKg as number);
  const bookMed = median(conv);
  const hist = seriesFor(marketFile, cmd).length
    ? seriesFor(marketFile, cmd)
    : seriesFor(marketFile, cmd === "Sweet Corn" ? "Corn" : cmd);
  const forecast = forecastFor(marketFile, cmd).length
    ? forecastFor(marketFile, cmd)
    : forecastFor(marketFile, cmd === "Sweet Corn" ? "Corn" : cmd);
  const next = forecast[0];
  const wholesale = snap?.p50 ?? p.wholesale ?? null;
  const wow = snap?.wow ?? null;
  const yoy = snap?.yoy ?? null;
  const nextMid = next?.p ?? (wholesale != null && wow != null ? wholesale * (1 + wow / 200) : wholesale);
  const nextLo = next?.lo ?? snap?.p20 ?? null;
  const nextHi = next?.hi ?? snap?.p80 ?? null;
  const deliveredFair = wholesale != null ? wholesale * 1.25 : null;
  const deliveredRich = wholesale != null ? wholesale * 1.5 : null;
  const listed = namesForCrop(cmd);
  const origins = (snap?.origins || [])
    .slice(0, 3)
    .map((row) => `${row[0]} ${row[1]}`)
    .join(" · ");

  const drivers: Driver[] = [];
  if (farm != null) {
    drivers.push({
      k: "Farm gate",
      v: `USDA ${farm.toFixed(2)} CAD/kg`,
      so:
        farmPctMonth != null
          ? `This month sits at the ${Math.round(farmPctMonth)}th percentile of prior ${monthName(thisMonth)} prints.`
          : "Monthly NASS, all grades.",
    });
  }
  if (wholesale != null) {
    drivers.push({
      k: "Vancouver ask",
      v: `${wholesale.toFixed(2)} CAD/kg`,
      so: [
        wow != null ? `${wow > 0 ? "+" : ""}${wow.toFixed(1)}% WoW` : null,
        yoy != null ? `${yoy > 0 ? "+" : ""}${yoy.toFixed(1)}% YoY` : null,
        origins || null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (g.bls != null) {
    drivers.push({
      k: "Grocery average",
      v: `BLS ${g.bls.toFixed(2)} CAD/kg`,
      so: "Retail demand, not the carton. Lagging.",
    });
  }
  if (bookMed != null && wholesale != null) {
    drivers.push({
      k: "This book",
      v: `${bookMed.toFixed(2)} CAD/kg median`,
      so: `${(bookMed / wholesale).toFixed(2)}× the terminal on ${conv.length} conventional SKUs.`,
    });
  }
  const hold = tapeCrop(cmd);
  const ams = impliedFob(cmd);
  if (listed[0]) {
    drivers.push({
      k: "Listed weather",
      v: listed
        .slice(0, 3)
        .map((n) => n.symbol)
        .join(" · "),
      so: listed[0].means,
    });
  }
  if (ams.lane && ams.fob != null) {
    drivers.push({
      k: "Implied origin FOB",
      v: `${ams.fob.toFixed(2)} CAD/kg`,
      so: `Dest minus AMS truck to ${ams.lane.dest} (${ams.truck?.toFixed(2)} /kg). Ceiling, not a reported FOB. ${ams.lane.asof}.`,
    });
  }
  if (hold?.ratio != null) {
    drivers.push({
      k: "Held-out book",
      v: `${hold.ratio.toFixed(2)}× dest that week`,
      so: `Week of ${hold.destAsOf || tapeCheck.destWeek}. Dest p50 was the better predictor than dest × 1.25. Raw list not stored.`,
    });
  }

  let call: PriceCall = "watch";
  const why: string[] = [];
  if ((yoy ?? 0) > 25 && (wow ?? 0) >= 0) {
    call = "cover";
    why.push("The public ask is running. Lock a dest print near the Vancouver mid. Do not add 1.25× unless this house has historically sat there.");
  } else if ((yoy ?? 0) < -20 || (wow ?? 0) < -8) {
    call = "wait";
    why.push("The tape already dropped. Don’t chase last week’s case dollar. Bid the mid and wait.");
  }
  if (bookMed != null && wholesale != null && bookMed > wholesale * 1.65) {
    if (call !== "wait") call = "wait";
    why.push("This book’s median is rich vs the terminal even for a house that delivers. Counter or change pack.");
  } else if (bookMed != null && wholesale != null && bookMed <= wholesale * 1.15) {
    if (call === "watch") call = "cover";
    why.push("Delivered case $ is inside a tight band vs Vancouver. Cover if you need the volume.");
  }
  if (hold?.ratio != null && hold.ratio < 0.9) {
    if (call !== "wait") call = "watch";
    why.push(
      `Held-out delivered book sat at ${hold.ratio.toFixed(2)}× dest the same week. Dest is the ceiling for that house. Bid the Vancouver mid, not 1.25× it.`,
    );
  }
  if (!why.length) {
    why.push("No shock on farm, dest, or the book. Watch the next weekly print. Don’t add inventory you don’t need.");
  }

  const thesis =
    call === "cover"
      ? `Cover ${cmd}. Next weeks sit near ${fmt(nextMid)} CAD/kg dest. Bid the Vancouver mid first — a 1.25× delivered add-on failed the held-out book.`
      : call === "wait"
        ? `Wait on ${cmd}. The public tape is not confirming a stretch. Bid ${fmt(wholesale)} dest and let them come.`
        : `Watch ${cmd}. Dest mid ${fmt(wholesale)}. Held-out delivered sat under dest on this house. Don’t stretch.`;

  return {
    cmd,
    farm,
    farmAsOf: series?.latest?.d?.slice(0, 7) ?? null,
    farmPctMonth,
    wholesale,
    p20: snap?.p20 ?? null,
    p80: snap?.p80 ?? null,
    wow,
    yoy,
    origins,
    bls: g.bls,
    bookMed,
    bookN: conv.length,
    hist,
    forecast: forecast.slice(0, 8),
    listed,
    nextLo,
    nextMid,
    nextHi,
    deliveredFair,
    deliveredRich,
    call,
    thesis,
    why,
    drivers,
  };
}

function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

function monthName(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] || String(m);
}

export function searchLines(lines: ScoredLine[], q: string): ScoredLine[] {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  const hits = lines.filter((l) => {
    const blob = [l.sku, l.label, l.cmd, l.unknown, l.vendor, l.pack, l.raw].filter(Boolean).join(" ").toLowerCase();
    return t.split(/\s+/).every((w) => blob.includes(w));
  });
  return hits.slice(0, 40);
}

export const CALL_LABEL: Record<PriceCall, string> = {
  cover: "Cover — lock volume",
  watch: "Watch — no stretch",
  wait: "Wait — don’t chase",
};

export function cropChoices(book: ScoredLine[]): string[] {
  const fromBook = [...new Set(book.map((l) => l.cmd).filter((x): x is string => Boolean(x)))];
  if (fromBook.length) return fromBook.sort();
  return catalog.map((c) => c.label);
}
