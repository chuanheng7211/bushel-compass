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

export type BeltRow = Lane;

export type Handoff = {
  from: BeltRow;
  to: BeltRow;
  months: number[];
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
  { id: "se", label: "US Southeast", lon: -81.0, lat: 33.4, kind: "district", daysToGta: 2, mode: "truck", aafc: ["US"] },
  { id: "mi", label: "Michigan", lon: -84.5, lat: 43.6, kind: "district", daysToGta: 1, mode: "truck", aafc: ["US"] },
  { id: "midwest", label: "US Midwest plants", lon: -87.6, lat: 41.5, kind: "plant", daysToGta: 1, mode: "truck", aafc: ["US"] },
  { id: "sinaloa", label: "Sinaloa", lon: -107.4, lat: 24.8, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX", "MEX"] },
  { id: "baja", label: "Baja", lon: -115.0, lat: 31.0, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX"] },
  { id: "mx", label: "Mexico", lon: -102.5, lat: 23.6, kind: "district", daysToGta: 5, mode: "truck", aafc: ["MX", "MEX"] },
  { id: "gt", label: "Guatemala", lon: -90.5, lat: 14.6, kind: "district", daysToGta: 8, mode: "truck", aafc: ["GT"] },
  { id: "ec", label: "Ecuador", lon: -79.0, lat: -2.0, kind: "district", daysToGta: 14, mode: "boat", aafc: ["EC"] },
  { id: "cr", label: "Costa Rica", lon: -84.0, lat: 10.0, kind: "district", daysToGta: 12, mode: "boat", aafc: ["CR"] },
  { id: "co", label: "Colombia", lon: -74.1, lat: 6.2, kind: "district", daysToGta: 12, mode: "boat", aafc: ["CO"] },
  { id: "cl", label: "Chile", lon: -70.7, lat: -33.45, kind: "district", daysToGta: 18, mode: "boat", aafc: ["CL", "CHILE"] },
  { id: "pe", label: "Peru", lon: -77.0, lat: -12.05, kind: "district", daysToGta: 16, mode: "boat", aafc: ["PE", "PERU"] },
  { id: "nz", label: "New Zealand", lon: 174.8, lat: -41.3, kind: "district", daysToGta: 22, mode: "boat", aafc: ["NZ"] },
];

const ALIAS: Record<string, string[]> = {
  washington: ["wa"],
  bc: ["bc"],
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
  "california winter": ["ca", "yuma"],
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
  "south carolina": ["se"],
  tennessee: ["midwest"],
  michigan: ["mi"],
  "us midwest": ["midwest"],
  midwest: ["midwest"],
  sinaloa: ["sinaloa"],
  baja: ["baja"],
  mexico: ["mx", "sinaloa"],
  guatemala: ["gt"],
  "central america": ["gt"],
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
  ecuador: ["ec"],
  "costa rica": ["cr"],
  colombia: ["co"],
  "pacific northwest": ["wa", "or"],
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

function tagHits(place: Place, tag: string): boolean {
  const t = tag.toUpperCase();
  return place.aafc.some((a) => {
    const p = a.toUpperCase();
    if (t === p) return true;
    if (p.includes("·") && t.startsWith(p)) return true;
    return false;
  });
}

function mixFor(place: Place, snap: MarketSnap | null): number {
  if (!snap?.origins?.length) return 0;
  const total = snap.origins.reduce((s, row) => s + Number(row[1] || 0), 0) || 1;
  let n = 0;
  for (const [code, c] of snap.origins) {
    if (tagHits(place, String(code))) n += Number(c || 0);
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

export const COUNTRY_NAME: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  NZ: "New Zealand",
  CL: "Chile",
  PE: "Peru",
  GT: "Guatemala",
  CN: "China",
  EC: "Ecuador",
  CR: "Costa Rica",
  CO: "Colombia",
  ES: "Spain",
  MA: "Morocco",
};

export function countryCode(raw: string): string {
  const t = String(raw || "").toUpperCase();
  if (t.includes("MEX")) return "MX";
  if (t.includes("CHILE")) return "CL";
  if (t.includes("PERU")) return "PE";
  return t.split(/[·.\s]/)[0] || "?";
}

export function countryOfPlace(place: Place): { code: string; name: string } {
  const code = countryCode(place.aafc[0] || place.id);
  return { code, name: COUNTRY_NAME[code] || code };
}

export function beltRows(lanes: Lane[]): BeltRow[] {
  const map = new Map<string, BeltRow>();
  for (const l of lanes) {
    const key = `${l.id}:${l.process ? "p" : "f"}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...l, months: [...l.months] });
      continue;
    }
    prev.months = [...new Set([...prev.months, ...l.months])].sort((a, b) => a - b);
    prev.mix = Math.max(prev.mix, l.mix);
    if (l.live) {
      prev.live = true;
      prev.when = l.when;
      prev.why = l.why;
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.process !== b.process) return a.process ? 1 : -1;
    return a.daysToGta - b.daysToGta;
  });
}

export function wrapMonth(m: number) {
  if (m < 1) return 12;
  if (m > 12) return 1;
  return m;
}

export function handoffWindows(rows: BeltRow[]): Handoff[] {
  const fresh = rows.filter((r) => !r.process);
  const out: Handoff[] = [];
  for (let i = 0; i < fresh.length; i++) {
    for (let j = i + 1; j < fresh.length; j++) {
      const a = fresh[i];
      const b = fresh[j];
      if (a.months.length >= 11 || b.months.length >= 11) continue;
      const overlap = a.months.filter((m) => b.months.includes(m));
      if (overlap.length && overlap.length <= 4) {
        const from = a.months.length >= b.months.length ? a : b;
        const to = from === a ? b : a;
        out.push({ from, to, months: overlap });
        continue;
      }
      const adjacent: number[] = [];
      for (const m of a.months) {
        const n = wrapMonth(m + 1);
        if (!a.months.includes(n) && b.months.includes(n)) adjacent.push(n);
      }
      for (const m of b.months) {
        const n = wrapMonth(m + 1);
        if (!b.months.includes(n) && a.months.includes(n)) adjacent.push(n);
      }
      if (adjacent.length) {
        const first = adjacent[0];
        const fromIsA = a.months.includes(wrapMonth(first - 1));
        out.push({
          from: fromIsA ? a : b,
          to: fromIsA ? b : a,
          months: [...new Set(adjacent)].sort((x, y) => x - y),
        });
      }
    }
  }
  return out;
}

export function majorLane(lanes: Lane[]): Lane | null {
  const live = lanes.filter((l) => l.live);
  if (!live.length) return null;
  const withMix = live.filter((l) => l.mix > 0);
  if (withMix.length) return [...withMix].sort((a, b) => b.mix - a.mix)[0];
  return [...live].sort((a, b) => a.daysToGta - b.daysToGta)[0];
}

export type MixRow = { code: string; name: string; n: number; share: number; district?: string };

export function tapeMix(snap: MarketSnap | null): MixRow[] {
  const rows = snap?.origins || [];
  if (!rows.length) return [];
  const total = rows.reduce((s, r) => s + Number(r[1] || 0), 0) || 1;
  const by = new Map<string, MixRow>();
  for (const [code, c] of rows) {
    const cc = countryCode(String(code));
    const n = Number(c || 0);
    const prev = by.get(cc);
    if (prev) {
      prev.n += n;
      prev.share = prev.n / total;
    } else {
      by.set(cc, {
        code: cc,
        name: COUNTRY_NAME[cc] || cc,
        n,
        share: n / total,
        district: String(code),
      });
    }
  }
  return [...by.values()].sort((a, b) => b.n - a.n);
}

export function districtMix(snap: MarketSnap | null): MixRow[] {
  const rows = snap?.origins || [];
  if (!rows.length) return [];
  const total = rows.reduce((s, r) => s + Number(r[1] || 0), 0) || 1;
  return rows
    .map(([code, c]) => {
      const n = Number(c || 0);
      const cc = countryCode(String(code));
      return {
        code: String(code),
        name: COUNTRY_NAME[cc] || cc,
        n,
        share: n / total,
        district: String(code),
      };
    })
    .sort((a, b) => b.n - a.n);
}

export function calendarCountries(rows: BeltRow[], month: number): MixRow[] {
  const live = rows.filter((r) => !r.process && r.months.includes(month));
  if (!live.length) return [];
  const by = new Map<string, number>();
  for (const r of live) {
    const { code } = countryOfPlace(r);
    by.set(code, (by.get(code) || 0) + 1);
  }
  const total = live.length;
  return [...by.entries()]
    .map(([code, n]) => ({
      code,
      name: COUNTRY_NAME[code] || code,
      n,
      share: n / total,
    }))
    .sort((a, b) => b.n - a.n);
}

export function clockByMonth(rows: BeltRow[]) {
  return MONTH_LABELS.map((_, i) => {
    const m = i + 1;
    const fresh = rows.filter((r) => !r.process && r.months.includes(m));
    const by: Record<string, number> = {};
    for (const r of fresh) {
      const { code } = countryOfPlace(r);
      by[code] = (by[code] || 0) + 1;
    }
    return { m, label: MONTH_LABELS[i], total: fresh.length, by };
  });
}

export function tapeVsClock(lanes: Lane[], month: number, snap: MarketSnap | null) {
  const live = lanes.filter((l) => l.live);
  const tape = districtMix(snap);
  const asofMonth = snap?.asof ? Number(String(snap.asof).slice(5, 7)) : null;
  const unexpected =
    asofMonth === month
      ? tape.filter((t) => {
          const hit = lanes.filter((l) => tagHits(l, t.code) || tagHits(l, t.district || t.code));
          return hit.length > 0 && hit.every((h) => !h.live);
        })
      : [];
  const missing = asofMonth === month ? live.filter((l) => l.mix === 0 && tape.length > 0) : [];
  const bits: string[] = [];
  if (asofMonth && asofMonth !== month) {
    bits.push(
      `The city sheet is the week of ${snap?.asof} (${MONTH_LABELS[asofMonth - 1]}), not ${MONTH_LABELS[month - 1]}. Mix is now; the calendar is the month you picked.`,
    );
  }
  if (unexpected.length) {
    bits.push(
      `Tape still shows ${unexpected.map((u) => u.district || u.code).join(", ")} after that window — leftover boat or storage, not the new crop.`,
    );
  }
  if (missing.length && tape.length) {
    bits.push(
      `Calendar has ${missing.map((row) => row.label).join(", ")} on, but this week’s AAFC sheet didn’t quote them.`,
    );
  }
  if (!bits.length && tape.length) {
    bits.push("This week’s origin mix sits on the in-season clock.");
  }
  if (!tape.length) {
    bits.push("No AAFC origin mix this week. Use the calendar, not a city sheet.");
  }
  return { tape, unexpected, missing, note: bits.join(" ") };
}

export function handoffStory(rows: BeltRow[], month: number, cmd: string) {
  const label = MONTH_LABELS[month - 1];
  const prev = wrapMonth(month - 1);
  const fresh = rows.filter((r) => !r.process);
  const on = fresh.filter((r) => r.months.includes(month));
  const starting = on.filter((r) => !r.months.includes(prev));
  const ending = fresh.filter((r) => r.months.includes(prev) && !r.months.includes(month));
  const overlaps = handoffWindows(rows).filter((h) => h.months.includes(month));
  if (starting.length && ending.length) {
    return {
      kind: "cutover" as const,
      title: `${label} cutover`,
      text: `${ending.map((e) => e.label).join(" + ")} hands off to ${starting.map((s) => s.label).join(" + ")}. Same ${cmd.toLowerCase()} name, different plant and clock.`,
    };
  }
  if (overlaps.length) {
    const h = overlaps[0];
    return {
      kind: "overlap" as const,
      title: `${label} overlap`,
      text: `${h.from.label} is still shipping as ${h.to.label} comes on. Buy the cheaper landed spec — not the cheaper FOB.`,
    };
  }
  if (starting.length) {
    return {
      kind: "open" as const,
      title: `${label} opens`,
      text: `${starting.map((s) => s.label).join(" + ")} comes onto the GTA desk this month.`,
    };
  }
  if (ending.length) {
    return {
      kind: "close" as const,
      title: `${label} closes`,
      text: `${ending.map((e) => e.label).join(" + ")} leaves. What remains is ${on.map((o) => o.label).join(" + ") || "off-season / process"}.`,
    };
  }
  if (on.length) {
    return {
      kind: "hold" as const,
      title: `${label} holds`,
      text: `${on.map((o) => o.label).join(" + ")} holds the ${cmd.toLowerCase()} window. No cutover this month.`,
    };
  }
  return {
    kind: "off" as const,
    title: `${label} is quiet`,
    text: `No fresh window stored for ${label}. Check process plants or another origin.`,
  };
}

export const COUNTRY_FILL: Record<string, string> = {
  US: "var(--color-ink)",
  CA: "var(--color-moss)",
  MX: "var(--color-rust)",
  CL: "var(--color-warn)",
  PE: "var(--color-warn)",
  NZ: "var(--color-warn)",
  GT: "var(--color-land)",
  EC: "var(--color-land)",
  CR: "var(--color-land)",
  CO: "var(--color-land)",
  CN: "var(--color-line)",
};
