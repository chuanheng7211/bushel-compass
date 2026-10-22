import { cropPrints } from "./catalog";
import { toCadKg, verdict, wholesaleFor } from "./compass";
import { marketFile, nassFarm } from "./data";
import { cropSubs, printForForm } from "./substitutes";
import { matchCmd } from "./crop-match";
import { caseBookMeta, isCaseBook, parseCaseBook, SEASONAL } from "./case-book";
import type { Basis, Unit, Verdict } from "./types";

export const SAMPLE_PO = `crop,price,qty_kg,vendor
Apples,4.85,400,Pacific Produce
Strawberries,9.40,80,BerryCo
Lettuce,2.45,200,Salinas Direct
Potatoes,1.20,900,Foodservice packer
Tomatoes,4.90,150,Ontario GH
Onions,2.70,300,Idaho packer
Blueberries,14.50,40,Chile boat
Broccoli,4.60,120,Salinas`;

export type BargainMove = "hold" | "lock" | "counter" | "walk" | "unknown";

export type OrderDraft = {
  raw: string;
  cmd: string | null;
  unknown: string | null;
  price: number | null;
  qtyKg: number | null;
  vendor: string;
  basis: Basis;
  sku?: string;
  pack?: string;
  organic?: boolean;
  channel?: "terminal" | "distributor";
  casePrice?: number;
  label?: string;
};

export type ScoredLine = OrderDraft & {
  quoteCadKg: number | null;
  farm: number | null;
  wholesale: number | null;
  p20: number | null;
  wow: number | null;
  yoy: number | null;
  origins: string;
  vsWholesalePct: number | null;
  vsFarmX: number | null;
  overpayCad: number | null;
  counterCadKg: number | null;
  move: BargainMove;
  verdict: Verdict | null;
  subHint: string | null;
};

export type BookPlan = {
  lines: ScoredLine[];
  scored: ScoredLine[];
  skipped: ScoredLine[];
  overpayCad: number;
  saveIfMidCad: number;
  kg: number;
  open: ScoredLine[];
  hold: ScoredLine[];
  lock: ScoredLine[];
  walk: ScoredLine[];
  thesis: string;
  kind: "po" | "casebook";
  vendor: string;
  week: string | null;
  tapeAsOf: string | null;
  rollups: CropRollup[];
  zones: string | null;
  delivery: string;
};

export type CropRollup = {
  cmd: string;
  n: number;
  nOrg: number;
  nConv: number;
  medianCadKg: number;
  medianConv: number | null;
  wholesale: number | null;
  farm: number | null;
  ratio: number | null;
  move: BargainMove;
  yoy: number | null;
  seasonal: boolean;
};

export { matchCmd } from "./crop-match";

function num(s: string): number | null {
  const t = s.replace(/[$,]/g, "").replace(/\/\s*(kg|lb).*/i, "").trim();
  const m = t.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function qtyKgFrom(s: string): { qty: number | null; rest: string } {
  const lb = s.match(/(-?\d+(?:\.\d+)?)\s*(lb|lbs|pound)/i);
  if (lb) {
    return { qty: Number(lb[1]) / 2.20462, rest: s.replace(lb[0], " ").trim() };
  }
  const kg = s.match(/(-?\d+(?:\.\d+)?)\s*(kg|kgs|kilo)/i);
  if (kg) {
    return { qty: Number(kg[1]), rest: s.replace(kg[0], " ").trim() };
  }
  return { qty: null, rest: s };
}

function splitCsv(line: string): string[] {
  return line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
}

function isHeader(line: string): boolean {
  const t = line.toLowerCase();
  return /crop|item|commodity|product/.test(t) && /price|cad|usd|ask/.test(t);
}

function parseLine(raw: string): OrderDraft | null {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return null;
  const parts = line.includes(",") ? splitCsv(line) : line.split(/\s{2,}|\t/).filter(Boolean);
  const blob = parts.join(" ");
  let cmd: string | null = null;
  let unknown: string | null = null;
  let price: number | null = null;
  let qtyKg: number | null = null;
  let vendor = "";
  let basis: Basis = "wholesale";
  if (parts.length >= 2) {
    cmd = matchCmd(parts[0]);
    if (!cmd) unknown = parts[0];
    const nums: number[] = [];
    const words: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const cell = parts[i];
      const q = qtyKgFrom(cell);
      if (q.qty != null && qtyKg == null) {
        qtyKg = q.qty;
        continue;
      }
      const n = num(cell);
      if (n != null && !/[a-z]/i.test(cell.replace(/[$,/kg]/gi, ""))) {
        nums.push(n);
      } else if (/fob/i.test(cell)) {
        basis = "fob";
      } else if (/farm|field/i.test(cell)) {
        basis = "farm";
      } else if (/retail|shelf/i.test(cell)) {
        basis = "retail";
      } else if (/process|iqf|frozen|juice/i.test(cell)) {
        basis = "process";
      } else if (cell) {
        words.push(cell);
      }
    }
    if (price == null && nums[0] != null) price = nums[0];
    if (qtyKg == null && nums[1] != null) qtyKg = nums[1];
    vendor = words.join(" ").trim();
  }

  if (price == null) {
    const q = qtyKgFrom(blob);
    const numbers = [...blob.matchAll(/\$?\d+(?:\.\d+)?/g)].map((m) => Number(m[0].replace("$", "")));
    if (price == null && numbers[0] != null) price = numbers[0];
    if (qtyKg == null) qtyKg = q.qty ?? numbers[1] ?? null;
  }
  if (!cmd && !unknown) {
    const guess = matchCmd(blob.replace(/[0-9$.,].*/, "").trim());
    cmd = guess;
    if (!guess) unknown = parts[0] || blob.slice(0, 24);
  }
  if (price == null && !cmd && !unknown) return null;
  return { raw: line, cmd, unknown, price, qtyKg, vendor, basis };
}

export function parseOrder(text: string, _unit: Unit): OrderDraft[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: OrderDraft[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 && isHeader(lines[i])) continue;
    const row = parseLine(lines[i]);
    if (row) out.push(row);
  }
  return out;
}

function subHint(cmd: string, quoteCadKg: number): string | null {
  const forms = cropSubs(cmd).forms.filter((f) => f.kind !== "fresh");
  for (const f of forms) {
    const p = printForForm(cmd, f);
    if (p && p.cadKg < quoteCadKg * 0.7) {
      return `${f.label} prints ${p.source.split(" ")[0]} ${p.cadKg.toFixed(2)} CAD/kg — use only if the kitchen can take process spec.`;
    }
  }
  return null;
}

export function scoreLine(draft: OrderDraft, unit: Unit): ScoredLine {
  const quoteCadKg =
    draft.price != null ? toCadKg(draft.price, unit) : null;
  const cmd = draft.cmd;
  const p = cmd ? cropPrints(cmd) : null;
  const snap =
    (cmd ? wholesaleFor(marketFile, cmd) : null) ||
    (cmd === "Sweet Corn" ? wholesaleFor(marketFile, "Corn") : null);
  const farm = p?.farm ?? nassFarm.series[p?.nass || ""]?.latest?.cadKg ?? null;
  const wholesale = snap?.p50 ?? p?.wholesale ?? null;
  const bench = wholesale || (farm != null ? farm * 1.8 : null);
  const vsWholesalePct =
    quoteCadKg != null && wholesale ? ((quoteCadKg - wholesale) / wholesale) * 100 : null;
  const vsFarmX = quoteCadKg != null && farm ? quoteCadKg / farm : null;
  const overpayCad =
    quoteCadKg != null && bench != null && draft.qtyKg
      ? (quoteCadKg - bench) * draft.qtyKg
      : null;
  const v =
    quoteCadKg != null && cmd
      ? verdict(quoteCadKg, farm ?? undefined, wholesale ?? undefined, draft.basis)
      : null;

  let move: BargainMove = "unknown";
  let counterCadKg: number | null = null;
  if (!cmd || quoteCadKg == null) {
    move = "unknown";
  } else if (wholesale != null) {
    const r = quoteCadKg / wholesale;
    const falling = (snap?.yoy ?? 0) < -20 || (snap?.wow ?? 0) < -8;
    const running = (snap?.yoy ?? 0) > 25;
    const dist = draft.channel === "distributor";
    const bump = draft.organic ? 0.35 : 0;
    if (dist) {
      if (r <= 1.08 + bump * 0.15) {
        move = "hold";
        counterCadKg = quoteCadKg;
      } else if (r <= 1.32 + bump) {
        move = "lock";
        counterCadKg = quoteCadKg;
      } else if (r <= 1.65 + bump) {
        move = "counter";
        counterCadKg = wholesale * (1.25 + bump * 0.4);
      } else {
        move = "walk";
        counterCadKg = wholesale * (1.25 + bump * 0.4);
      }
    } else if (r <= 0.95) {
      move = "hold";
      counterCadKg = quoteCadKg;
    } else if (r <= 1.08 && running) {
      move = "lock";
      counterCadKg = quoteCadKg;
    } else if (r <= 1.08) {
      move = "lock";
      counterCadKg = quoteCadKg;
    } else if (r <= 1.28 && !falling) {
      move = "counter";
      counterCadKg = wholesale;
    } else {
      move = "walk";
      counterCadKg = falling && snap?.p20 ? snap.p20 : wholesale;
    }
  } else if (farm != null && quoteCadKg != null) {
    const r = quoteCadKg / farm;
    if (draft.basis === "farm" && r <= 1.15) {
      move = "hold";
      counterCadKg = quoteCadKg;
    } else if (r > 2.2) {
      move = "walk";
      counterCadKg = farm * 1.8;
    } else {
      move = "counter";
      counterCadKg = farm * 1.8;
    }
  }

  const origins = (snap?.origins || [])
    .slice(0, 3)
    .map((row) => `${row[0]} ${row[1]}`)
    .join(" · ");

  return {
    ...draft,
    quoteCadKg,
    farm: farm ?? null,
    wholesale: wholesale ?? null,
    p20: snap?.p20 ?? null,
    wow: snap?.wow ?? null,
    yoy: snap?.yoy ?? null,
    origins,
    vsWholesalePct,
    vsFarmX,
    overpayCad,
    counterCadKg,
    move,
    verdict: v,
    subHint: cmd && quoteCadKg != null ? subHint(cmd, quoteCadKg) : null,
  };
}

export function planBook(text: string, unit: Unit): BookPlan {
  const kind = isCaseBook(text) ? "casebook" : "po";
  const meta =
    kind === "casebook"
      ? caseBookMeta(text)
      : { vendor: "Your PO", week: null, zones: null, delivery: "As typed on the PO" };
  const drafts = kind === "casebook" ? parseCaseBook(text) : parseOrder(text, unit);
  const lines = drafts.map((d) => scoreLine(d, kind === "casebook" ? "cadKg" : unit));
  const scored = lines.filter((l) => l.cmd && l.quoteCadKg != null);
  const skipped = lines.filter((l) => !l.cmd || l.quoteCadKg == null);
  const overpayCad = scored.reduce((s, l) => s + Math.max(l.overpayCad || 0, 0), 0);
  const saveIfMidCad = scored.reduce((s, l) => {
    if (l.overpayCad != null && l.overpayCad > 0) return s + l.overpayCad;
    return s;
  }, 0);
  const kg = scored.reduce((s, l) => s + (l.qtyKg || 0), 0);
  const open = [...scored]
    .filter((l) => l.move === "counter" || l.move === "walk")
    .sort((a, b) => (b.overpayCad || 0) - (a.overpayCad || 0));
  const hold = scored.filter((l) => l.move === "hold");
  const lock = scored.filter((l) => l.move === "lock");
  const walk = scored.filter((l) => l.move === "walk");
  const rollups = rollupCrops(scored);
  const tapeAsOf = marketFile.snapshot?.find((s) => s.centre === "Vancouver")?.asof || marketFile.generated || null;
  const thesis = thesisFor(kind, meta.vendor, scored, rollups, open[0], tapeAsOf, meta.week);
  return {
    lines,
    scored,
    skipped,
    overpayCad,
    saveIfMidCad,
    kg,
    open,
    hold,
    lock,
    walk,
    thesis,
    kind,
    vendor: meta.vendor,
    week: meta.week,
    tapeAsOf,
    rollups,
    zones: meta.zones,
    delivery: meta.delivery,
  };
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
}

function rollupCrops(scored: ScoredLine[]): CropRollup[] {
  const by = new Map<string, ScoredLine[]>();
  for (const l of scored) {
    if (!l.cmd) continue;
    const arr = by.get(l.cmd) || [];
    arr.push(l);
    by.set(l.cmd, arr);
  }
  const out: CropRollup[] = [];
  for (const [cmd, rows] of by) {
    const conv = rows
      .filter((r) => !r.organic && r.quoteCadKg != null && !premiumSpec(r))
      .map((r) => r.quoteCadKg as number);
    const all = rows.filter((r) => r.quoteCadKg != null).map((r) => r.quoteCadKg as number);
    const wholesale = rows[0]?.wholesale ?? null;
    const medConv = median(conv);
    const med = medConv ?? median(all);
    const ratio = med != null && wholesale ? med / wholesale : null;
    let move: BargainMove = "unknown";
    if (ratio != null) {
      if (ratio <= 1.08) move = "hold";
      else if (ratio <= 1.32) move = "lock";
      else if (ratio <= 1.65) move = "counter";
      else move = "walk";
    }
    out.push({
      cmd,
      n: rows.length,
      nOrg: rows.filter((r) => r.organic).length,
      nConv: conv.length,
      medianCadKg: med ?? 0,
      medianConv: medConv,
      wholesale,
      farm: (rows.find((r) => !r.organic) || rows[0])?.farm ?? null,
      ratio,
      move,
      yoy: (rows.find((r) => !r.organic) || rows[0])?.yoy ?? null,
      seasonal: SEASONAL.has(cmd),
    });
  }
  return out.sort((a, b) => (b.ratio || 0) - (a.ratio || 0));
}

function premiumSpec(r: ScoredLine): boolean {
  const t = `${r.label || ""} ${r.raw}`;
  return /cherry|grape-clam|grape clam|cocktail|heirloom|on the vine|fingerling|little trio|purely purple/i.test(t);
}

function isStale(week: string | null, tapeAsOf: string | null): boolean {
  if (!week || !tapeAsOf) return false;
  const end = week.split("–")[1] || week.split("-").pop();
  if (!end) return false;
  const m = end.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return false;
  const weekEnd = Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  const tape = Date.parse(tapeAsOf);
  if (!Number.isFinite(tape) || !Number.isFinite(weekEnd)) return false;
  return tape - weekEnd > 21 * 86400000;
}

function thesisFor(
  kind: "po" | "casebook",
  vendor: string,
  scored: ScoredLine[],
  rollups: CropRollup[],
  first: ScoredLine | undefined,
  tapeAsOf: string | null,
  week: string | null,
): string {
  if (!scored.length) {
    return kind === "casebook"
      ? "Paste a distributor case book (FreshPoint OP3511-style). We convert case $ to CAD/kg and bench Vancouver."
      : "Paste crop, price, kilos, vendor. One line per item.";
  }
  if (kind === "casebook") {
    const storage = rollups.filter((r) => !r.seasonal && r.ratio != null);
    const med = median(storage.map((r) => r.ratio as number));
    const worst = storage[0] || rollups[0];
    const stale = isStale(week, tapeAsOf)
      ? "This book is expired versus the tape we have — do not bargain today’s load from it. "
      : "";
    const cal = week && tapeAsOf ? ` Book week ${week}. Public tape ${tapeAsOf}. Seasonal lines (lettuce, berries, stone fruit) are a different market.` : "";
    const band =
      med == null
        ? "Not enough overlapping prints."
        : med <= 1.2
          ? `Tight book — conventional median ${med.toFixed(2)}× the Vancouver terminal. Delivery is in the number; this is a good distributor.`
          : med <= 1.5
            ? `Ordinary foodservice markup — conventional median ${med.toFixed(2)}× Vancouver. Fair for a house that delivers and invoices.`
            : `Rich vs the terminal — conventional median ${med.toFixed(2)}× Vancouver. Open on ${worst?.cmd}.`;
    return `${stale}${vendor}. ${band}${cal}`;
  }
  if (first) {
    return `Open with ${first.cmd}. You are over the Vancouver mid on that line${
      first.overpayCad != null && first.overpayCad > 0
        ? ` — about $${first.overpayCad.toFixed(0)} on the kilos you typed`
        : ""
    }. Hold every line already under the public ask. Do not name the tape on those.`;
  }
  return "Nothing on this PO is rich vs the Vancouver mid. Lock the prints that sit near it. Do not shop the tape out loud.";
}

export function scriptFor(
  line: ScoredLine,
  cad: (n: number | null | undefined) => string,
): string {
  const name = line.label || line.cmd || line.unknown || "this item";
  const vendor = line.vendor || "the vendor";
  if (line.move === "unknown" || line.quoteCadKg == null) {
    return `${name}: no public print on this desk. Ask packed vs field, origin, and pack size before you bid.`;
  }
  if (line.channel === "distributor") {
    const pack = line.pack ? ` Pack ${line.pack}.` : "";
    const case$ = line.casePrice != null ? ` Case $${line.casePrice.toFixed(2)}.` : "";
    if (line.move === "hold") {
      return `${name} at ${cad(line.quoteCadKg)}/kg is at or under the Vancouver terminal (${cad(line.wholesale)}). Keep the line. Do not tell ${vendor} what the file says.${pack}${case$}`;
    }
    if (line.move === "lock") {
      return `${name} at ${cad(line.quoteCadKg)}/kg is a normal distributor step over ${cad(line.wholesale)}. Lock the print.${pack}${case$}`;
    }
    if (line.move === "walk") {
      return `${name}: ${cad(line.quoteCadKg)}/kg vs terminal ${cad(line.wholesale)} (${line.vsWholesalePct != null ? `${line.vsWholesalePct.toFixed(0)}% over` : "rich"}). Even for a house that delivers, this is rich. Bid ${cad(line.counterCadKg)}/kg or change pack/origin.${pack}${case$}`;
    }
    return `${name}: terminal mid ${cad(line.wholesale)}. Distributor ask ${cad(line.quoteCadKg)}/kg. I will take ${cad(line.counterCadKg)}/kg on this spec (about 1.25× the public ask), or name the extra in dollars.${pack}${case$}`;
  }
  if (line.move === "hold") {
    return `${name} at ${cad(line.quoteCadKg)} is under the Vancouver mid (${cad(line.wholesale)}). Reorder at this print. Do not tell ${vendor} what the file says.`;
  }
  if (line.move === "lock") {
    const run =
      line.yoy != null && line.yoy > 25
        ? ` Tape is +${line.yoy.toFixed(0)}% YoY — lock four weeks before it walks.`
        : " Ask for a four-week hold at this number.";
    return `${name} at ${cad(line.quoteCadKg)} is inside the fair band vs ${cad(line.wholesale)}.${run}`;
  }
  const counter = cad(line.counterCadKg);
  const origin = line.origins ? ` Mix this week: ${line.origins}.` : "";
  const yoy =
    line.yoy != null
      ? ` Vancouver ${line.yoy > 0 ? "+" : ""}${line.yoy.toFixed(0)}% YoY.`
      : "";
  if (line.move === "walk") {
    return `${name}: you are at ${cad(line.quoteCadKg)} vs Vancouver mid ${cad(line.wholesale)} (${line.vsWholesalePct != null ? `+${line.vsWholesalePct.toFixed(0)}%` : "rich"}). Bid ${counter} and wait. If they cannot meet it, change origin or pack.${origin}${yoy}`;
  }
  return `${name}: public Vancouver mid is ${cad(line.wholesale)}. ${vendor} is at ${cad(line.quoteCadKg)}. I will take ${counter} on this spec, or name the extra (variety, pack, freight) in dollars. Farm last month ${cad(line.farm)}.${origin}${yoy}`;
}

export function bookScript(
  plan: BookPlan,
  cad: (n: number | null | undefined) => string,
): string {
  if (plan.kind === "casebook") {
    const bits: string[] = [
      `${plan.vendor} vs AAFC Vancouver terminal. Distributor fair band is about 1.15–1.50× the public ask — delivery and credit sit on top of the terminal.`,
      plan.week ? `Book week ${plan.week}.` : "",
      plan.tapeAsOf ? `Public tape ${plan.tapeAsOf}. Seasonal crops are a different market.` : "",
      plan.thesis,
      "STORAGE / YEAR-ROUND",
    ];
    for (const r of plan.rollups.filter((x) => !x.seasonal)) {
      bits.push(
        `· ${r.cmd}: book ${cad(r.medianCadKg)} vs mid ${cad(r.wholesale)} = ${r.ratio != null ? r.ratio.toFixed(2) : "—"}× · ${MOVE_LABEL[r.move]} · ${r.nConv} conventional SKU${r.nOrg ? `, ${r.nOrg} organic` : ""}`,
      );
    }
    const seasonal = plan.rollups.filter((x) => x.seasonal);
    if (seasonal.length) {
      bits.push("SEASONAL — treat as noisy");
      for (const r of seasonal) {
        bits.push(
          `· ${r.cmd}: ${cad(r.medianCadKg)} vs ${cad(r.wholesale)} = ${r.ratio != null ? r.ratio.toFixed(2) : "—"}×`,
        );
      }
    }
    return bits.filter(Boolean).join("\n");
  }
  const bits: string[] = [
    "Public tape vs this PO — not the vendor’s invoice. Freight and spec still exist.",
    plan.thesis,
  ];
  if (plan.open.length) {
    bits.push("OPEN");
    for (const l of plan.open.slice(0, 4)) bits.push("· " + scriptFor(l, cad));
  }
  if (plan.lock.length) {
    bits.push("LOCK");
    for (const l of plan.lock) bits.push("· " + scriptFor(l, cad));
  }
  if (plan.hold.length) {
    bits.push("HOLD — do not name the tape");
    for (const l of plan.hold) bits.push("· " + scriptFor(l, cad));
  }
  return bits.join("\n");
}

export const MOVE_LABEL: Record<BargainMove, string> = {
  hold: "Hold",
  lock: "Lock the print",
  counter: "Counter to the mid",
  walk: "Walk or change origin",
  unknown: "No public print",
};
