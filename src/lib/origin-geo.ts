import type { CommodityPlay, MarketSnap } from "./types";

export type Place = {
  id: string;
  label: string;
  lon: number;
  lat: number;
  kind: "district" | "hub" | "plant";
  daysToGta: number;
  mode: "truck" | "boat" | "local";
  aafc: string[];
};

export type Lane = Place & {
  when: string;
  why: string;
  months: number[];
  process: boolean;
  live: boolean;
  mix: number;
};

export const GTA: Place = {
  id: "gta",
  label: "GTA / Ontario dest.",
  lon: -79.4,
  lat: 43.7,
  kind: "hub",
  daysToGta: 0,
  mode: "local",
  aafc: ["CA", "CA·ON"],
};

const PLACES: Place[] = [
  GTA,
  { id: "wa", label: "Washington", lon: -120.5, lat: 46.6, kind: "district", daysToGta: 4, mode: "truck", aafc: ["US·WA", "US"] },
  { id: "bc", label: "BC Okanagan", lon: -119.5, lat: 49.9, kind: "district", daysToGta: 4, mode: "truck", aafc: ["CA", "CA·BC"] },
  { id: "on", label: "Ontario", lon: -81.2, lat: 42.8, kind: "district", daysToGta: 1, mode: "local", aafc: ["CA", "CA·ON"] },
  { id: "qc", label: "Quebec", lon: -71.2, lat: 46.8, kind: "district", daysToGta: 1, mode: "truck", aafc: ["CA", "CA·QC"] },
  { id: "ns", label: "Nova Scotia", lon: -63.6, lat: 45.1, kind: "district", daysToGta: 2, mode: "truck", aafc: ["CA"] },
  { id: "pei", label: "PEI", lon: -63.4, lat: 46.3, kind: "district", daysToGta: 2, mode: "truck", aafc: ["CA"] },
  { id: "mb", label: "Manitoba", lon: -97.1, lat: 49.9, kind: "district", daysToGta: 2, mode: "truck", aafc: ["CA"] },
  { id: "id", label: "Idaho", lon: -116.2, lat: 43.6, kind: "district", daysToGta: 4, mode: "truck", aafc: ["US·ID", "US"] },
  { id: "or", label: "Oregon", lon: -120.6, lat: 44.0, kind: "district", daysToGta: 4, mode: "truck", aafc: ["US"] },
  { id: "salinas", label: "Salinas–Watsonville", lon: -121.65, lat: 36.68, kind: "district", daysToGta: 5, mode: "truck", aafc: ["US·CA", "US"] },
  { id: "santamaria", label: "Santa Maria", lon: -120.43, lat: 34.95, kind: "district", daysToGta: 5, mode: "truck", aafc: ["US·CA", "US"] },
  { id: "ca", label: "California", lon: -119.4, lat: 36.1, kind: "district", daysToGta: 5, mode: "truck", aafc: ["US·CA", "US"] },
  { id: "coachella", label: "Coachella", lon: -116.17, lat: 33.68, kind: "district", daysToGta: 5, mode: "truck", aafc: ["US·CA", "US"] },
  { id: "yuma", label: "Yuma / Imperial", lon: -114.62, lat: 32.69, kind: "district", daysToGta: 4, mode: "truck", aafc: ["US·AZ", "US"] },
  { id: "az", label: "Arizona", lon: -112.0, lat: 33.4, kind: "district", daysToGta: 4, mode: "truck", aafc: ["US·AZ", "US"] },
  { id: "fl", label: "Florida", lon: -81.5, lat: 27.5, kind: "district", daysToGta: 3, mode: "truck", aafc: ["US·FL", "US"] },
  { id: "tx", label: "Texas / McAllen", lon: -98.2, lat: 26.2, kind: "hub", daysToGta: 4, mode: "truck", aafc: ["US·TX", "US"] },
  { id: "ga", label: "Georgia sweets", lon: -83.5, lat: 31.5, kind: "district", daysToGta: 2, mode: "truck", aafc: ["US"] },
  { id: "midwest", label: "US Midwest plants", lon: -87.6, lat: 41.5, kind: "plant", daysToGta: 1, mode: "truck", aafc: ["US"] },
  { id: "sinaloa", label: "Sinaloa", lon: -107.4, lat: 24.8, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX", "MEX"] },
  { id: "baja", label: "Baja", lon: -115.0, lat: 31.0, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX"] },
  { id: "mx", label: "Mexico", lon: -102.5, lat: 23.6, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX", "MEX"] },
  { id: "gt", label: "Guatemala", lon: -90.5, lat: 14.6, kind: "district", daysToGta: 8, mode: "truck", aafc: ["GT"] },
  { id: "cl", label: "Chile", lon: -70.7, lat: -33.45, kind: "district", daysToGta: 18, mode: "boat", aafc: ["CL", "CHILE"] },
  { id: "pe", label: "Peru", lon: -77.0, lat: -12.05, kind: "district", daysToGta: 16, mode: "boat", aafc: ["PE", "PERU"] },
  { id: "nz", label: "New Zealand", lon: 174.8, lat: -41.3, kind: "district", daysToGta: 22, mode: "boat", aafc: ["NZ"] },
];

const ALIAS: Record<string, string[]> = {
  washington: ["wa"],
  "bc": ["bc"],
  okanagan: ["bc"],
  ontario: ["on"],
  "ontario greenhouse": ["on"],
  quebec: ["qc"],
  "nova scotia": ["ns"],
  ns: ["ns"],
  pei: ["pei"],
  manitoba: ["mb"],
  idaho: ["id"],
  oregon: ["or"],
  "idaho–oregon": ["id", "or"],
  california: ["ca"],
  "california districts rotating": ["salinas", "ca", "coachella"],
  salinas: ["salinas"],
  "salinas–watsonville": ["salinas"],
  "santa maria": ["santamaria"],
  "california salinas": ["salinas", "santamaria"],
  yuma: ["yuma"],
  imperial: ["yuma"],
  arizona: ["az"],
  florida: ["fl"],
  texas: ["tx"],
  georgia: ["ga"],
  "us midwest": ["midwest"],
  midwest: ["midwest"],
  sinaloa: ["sinaloa"],
  baja: ["baja"],
  mexico: ["mx", "sinaloa"],
  guatemala: ["gt"],
  chile: ["cl"],
  peru: ["pe"],
  "new zealand": ["nz"],
  nz: ["nz"],
  coachella: ["coachella"],
  leamington: ["on"],
  "taylor farms": ["salinas"],
  "fresh express": ["salinas"],
  grimmway: ["ca"],
  bolthouse: ["ca"],
};

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const NAME_TO_NUM: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

export function monthsFromWhen(when: string): { months: number[]; process: boolean } {
  const w = when.toLowerCase();
  const process = /process|iqf|paste|frozen|cut salad|plants/.test(w);
  if (/year-?round|most months/.test(w)) return { months: range(1, 12), process };
  if (/winter/.test(w)) return { months: [11, 12, 1, 2, 3], process };
  if (/spring/.test(w)) return { months: [3, 4, 5], process };
  const names = w.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/g) || [];
  const nums = names.map((n) => NAME_TO_NUM[n]).filter(Boolean);
  if (nums.length >= 2) return { months: wrapRange(nums[0], nums[1]), process };
  if (nums.length === 1) return { months: [nums[0]], process };
  return { months: range(1, 12), process };
}

function range(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function wrapRange(a: number, b: number) {
  if (a <= b) return range(a, b);
  return [...range(a, 12), ...range(1, b)];
}

function tokens(who: string): string[] {
  return who
    .toLowerCase()
    .split(/[/+,]| and | via /)
    .map((s) => s.replace(/greenhouse|\+|field|cluster|plants?|processors?|shipper|districts?|rotating|same sheds.*|jumbo line|news/g, " ").trim())
    .filter((s) => s.length > 1);
}

function matchPlaces(who: string): Place[] {
  const found = new Map<string, Place>();
  for (const t of tokens(who)) {
    for (const [k, ids] of Object.entries(ALIAS)) {
      if (t.includes(k) || k.includes(t)) {
        for (const id of ids) {
          const p = PLACES.find((x) => x.id === id);
          if (p) found.set(p.id, p);
        }
      }
    }
  }
  if (!found.size) {
    const p = PLACES.find((x) => who.toLowerCase().includes(x.label.toLowerCase()));
    if (p) found.set(p.id, p);
  }
  return [...found.values()];
}

function mixFor(place: Place, snap: MarketSnap | null): number {
  if (!snap?.origins?.length) return 0;
  const total = snap.origins.reduce((s, row) => s + Number(row[1] || 0), 0) || 1;
  let n = 0;
  for (const [code, c] of snap.origins) {
    const tag = String(code).toUpperCase();
    if (place.aafc.some((a) => tag === a.toUpperCase() || tag.startsWith(a.toUpperCase()))) {
      n += Number(c || 0);
    }
  }
  return n / total;
}

export function lanesFor(
  play: CommodityPlay | null | undefined,
  month: number,
  snap: MarketSnap | null,
): Lane[] {
  if (!play) return [];
  const out: Lane[] = [];
  for (const o of play.origins) {
    const { months, process } = monthsFromWhen(o.when);
    const places = matchPlaces(o.who);
    for (const place of places) {
      if (place.id === "gta") continue;
      out.push({
        ...place,
        when: o.when,
        why: o.why,
        months,
        process,
        live: months.includes(month) && !process,
        mix: mixFor(place, snap),
      });
    }
  }
  return out;
}

export function namedPlace(note: string): Place | null {
  if (!note.trim()) return null;
  const m = matchPlaces(note);
  return m[0] || null;
}

export function storyFor(lanes: Lane[], month: number, cmd: string): string {
  const live = lanes.filter((l) => l.live);
  const boats = live.filter((l) => l.mode === "boat");
  const trucks = live.filter((l) => l.mode === "truck" || l.mode === "local");
  const label = MONTH_LABELS[month - 1];
  if (!live.length) {
    const proc = lanes.filter((l) => l.process);
    if (proc.length) {
      return `${label} ${cmd.toLowerCase()} on this map are mostly process plants, not a fresh carton. Do not bench them against extra-fancy.`;
    }
    return `No fresh window stored for ${label}. Check the calendar cards — the named origin may be off-season.`;
  }
  const truckBit = trucks.length
    ? `Truck from ${trucks.map((l) => l.label).join(", ")} (${Math.min(...trucks.map((l) => l.daysToGta))}–${Math.max(...trucks.map((l) => l.daysToGta))} days to the GTA)`
    : "";
  const boatBit = boats.length
    ? `boat from ${boats.map((l) => l.label).join(" / ")} (${boats[0].daysToGta}+ days, already duty and arrival risk)`
    : "";
  return `${label}: ${[truckBit, boatBit].filter(Boolean).join("; ")}. Buy the cheaper landed spec, not the cheaper FOB.`;
}

/** Equirectangular, Americas + NZ inset. */
export function project(lon: number, lat: number): { x: number; y: number; inset: boolean } {
  if (lon > 0) {
    const x = 868 + ((lon - 165) / 20) * 110;
    const y = 390 + ((-lat - 34) / 14) * 90;
    return { x, y, inset: true };
  }
  const x = 40 + ((lon + 130) / 70) * 780;
  const y = 36 + ((55 - lat) / 100) * 430;
  return { x, y, inset: false };
}

export function arcPath(from: Place, to: Place = GTA): string {
  const a = project(from.lon, from.lat);
  const b = project(to.lon, to.lat);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.max(24, Math.abs(a.x - b.x) * 0.12);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}
