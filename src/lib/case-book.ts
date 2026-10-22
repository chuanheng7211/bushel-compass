import { matchCmd } from "./crop-match";
import { wholesaleFor } from "./compass";
import { marketFile } from "./data";
import type { OrderDraft } from "./order-book";

const LB = 0.453592;
const OZ = 0.0283495;
const G = 0.001;
const PT = 0.312;

/** Typical destination carton when the book only prints a count. */
const CARTON_KG: Record<string, number> = {
  Apples: 18.14,
  Pears: 18.14,
  Oranges: 16.33,
  Lemons: 16.33,
  Limes: 18.14,
  Avocados: 11.34,
  Bananas: 18.14,
  "Grapes (Table)": 8.16,
  Strawberries: 3.63,
  Blueberries: 3.63,
  Raspberries: 2.04,
  Broccoli: 9.07,
  Lettuce: 18.14,
  Celery: 22.68,
  Carrots: 22.68,
  Onions: 22.68,
  Potatoes: 22.68,
  Cabbage: 22.68,
  Tomatoes: 11.34,
  Peppers: 11.34,
  Cucumbers: 11.34,
  Asparagus: 4.99,
  Beans: 12.7,
  Melons: 18.14,
  Watermelon: 22.68,
  Peaches: 11.34,
  Nectarines: 11.34,
  Plums: 9.07,
  "Kiwi Fruit": 9.0,
  Mangoes: 4.0,
  Mushrooms: 2.27,
  Garlic: 13.61,
  "Ginger Root": 13.61,
  Spinach: 9.07,
  Cauliflower: 13.61,
  Beets: 11.34,
  Radishes: 4.54,
  Zucchini: 11.34,
  "Sweet Corn": 18.14,
  Cherries: 7.26,
  Pineapples: 18.14,
};

const ORIGIN = /^(WASH|NZ|MEXICO|CALIF|BC|GUATEMALA|ECUADOR|PERU|CHILE|GREECE|C\.RICA|MOROCCO|CHINA|HAWAII|COLOMBIA|VIETNAM|TURKEY|CANADA|ARIZONA|FLORIDA|GEORGIA|AB|US|WA|CA|CDN|KOREA|ARGENTINA|COSTA RICA|MEX|BC\/CALIF|BC\/MEX|CHINA\/KOREA|KOREA\/CHINA|US\/CA|--)$/i;

const SKIP_HEAD =
  /^(CROUTON|DRESSING|BAGS|JUICE|NOODLE|DIP |GLAZE|WRAP|TAPE|TWIST|RUBBER|NETTING|FORTUNE|SOY|SPRING ROLL|FREEZER|STORM |PALLET|PRODUCE PAK|PRODUCE TAPE|BERRY PAK|WRAPPING|STANDARD NET|FORTUNE|PACKING|GROCERY|FROZEN)/i;

export const SEASONAL = new Set([
  "Strawberries",
  "Blueberries",
  "Raspberries",
  "Lettuce",
  "Asparagus",
  "Peaches",
  "Nectarines",
  "Cherries",
  "Sweet Corn",
  "Melons",
  "Watermelon",
  "Plums",
  "Beans",
  "Corn",
]);

export function isCaseBook(text: string): boolean {
  if (/FRESHPOINT|OP3511|PRICE LIST/i.test(text)) return true;
  return (text.match(/^\s*\d{5,6}\s+[A-Z]/gm) || []).length >= 8;
}

export function caseBookMeta(text: string): {
  vendor: string;
  week: string | null;
  zones: string | null;
  delivery: string;
} {
  const vendor = /FRESHPOINT/i.test(text)
    ? "FreshPoint Vancouver"
    : /PRICE LIST/i.test(text)
      ? "Distributor case book"
      : "Case book";
  const w = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*Thru\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const z = text.match(/ZONEs do I use for prices[^:]*:\s*([0-9 and]+)/i);
  const zones = z ? z[1].replace(/\s+/g, " ").trim() : null;
  const delivery = /FRESHPOINT/i.test(text)
    ? `Delivered Vancouver${zones ? ` · zones ${zones}` : ""}`
    : "As typed on the PO";
  return { vendor, week: w ? `${w[1]} – ${w[2]}` : null, zones, delivery };
}

function kgFromSize(size: string, cmd: string | null, desc: string): number | null {
  const inDesc = desc.match(/\((\d+(?:\.\d+)?)\s*KG\)/i);
  if (inDesc) return Number(inDesc[1]);
  const s = size.toUpperCase().replace(/\s+/g, " ").trim();
  if (!s || /^CASE$/.test(s) || /PER\s+BIN/.test(s) || /PER\s+CS/.test(s) || /ROLL/.test(s)) {
    return cmd ? CARTON_KG[cmd] ?? medianTapeKg(cmd) : null;
  }
  if (/PER\s+LB/.test(s)) return LB;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*X\s*(\d+(?:\.\d+)?)\s*(G|GM)$/)))
    return Number(m[1]) * Number(m[2]) * G;
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(G|GM)$/)))
    return Number(m[1]) * Number(m[2]) * G;
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(LBS?|#)$/)))
    return Number(m[1]) * Number(m[2]) * LB;
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*(OZ|O)$/)))
    return Number(m[1]) * Number(m[2]) * OZ;
  if ((m = s.match(/^(\d+)\s*\/\s*1\s*PT/)) || (m = s.match(/^(\d+)\s*PINTS?$/)))
    return Number(m[1]) * PT;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(LBS?|#)$/))) return Number(m[1]) * LB;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*KG$/))) return Number(m[1]);
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)\s*PK$/))) {
    return cmd ? CARTON_KG[cmd] ?? null : null;
  }
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+(?:\.\d+)?)$/))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (b >= 4 && b <= 20 && a <= 30) return a * b * OZ;
  }
  return cmd ? CARTON_KG[cmd] ?? medianTapeKg(cmd) : null;
}

function medianTapeKg(cmd: string): number | null {
  const snap = wholesaleFor(marketFile, cmd);
  const kgs = (snap?.quotes || []).map((q) => q.kg).filter((k): k is number => !!k && k > 0);
  if (!kgs.length) return CARTON_KG[cmd] ?? null;
  kgs.sort((a, b) => a - b);
  return kgs[Math.floor(kgs.length / 2)] ?? null;
}

const SIZE_TAIL =
  /(\d+\s*X\s*\d+(?:\.\d+)?\s*(?:G|GM)|\d+\s*\/\s*\d+(?:\.\d+)?\s*(?:LBS?|#|OZ|O|KG|G|GM|CT|PCS|PK|PT)|(?:\d+(?:\.\d+)?)\s*(?:LBS?|#|KG)|(?:\d+\s*PINTS?)|(?:\d+\/\d+'S)|(?:\d+'S)|(?:\d+\/LGR)|(?:\d+\s*CT)|(?:PER\s+BIN)|(?:PER\s+CTN)|(?:PER\s+LB)|(?:PER\s+CS)|(?:\d+\/\d+(?:\.\d+)?)|(?:CASE))\s*$/i;

export function parseCaseBook(text: string): OrderDraft[] {
  const meta = caseBookMeta(text);
  const out: OrderDraft[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const m = raw.match(/^\s*(\d{5,6})\s+(.+?)\s+(\d+\.\d{2})\s*$/);
    if (!m) continue;
    const sku = m[1];
    const body = m[2].trim();
    const casePrice = Number(m[3]);
    if (SKIP_HEAD.test(body)) continue;
    const sm = body.search(SIZE_TAIL);
    const size = sm >= 0 ? body.slice(sm).trim() : "";
    let rest = sm >= 0 ? body.slice(0, sm).trim() : body;
    const bits = rest.split(/\s{2,}/).filter(Boolean);
    let origin = "";
    if (bits.length >= 2 && ORIGIN.test(bits[bits.length - 1].replace(/\.$/, ""))) {
      origin = bits.pop() || "";
      rest = bits.join(" ");
    } else {
      const toks = rest.split(/\s+/);
      const last = toks[toks.length - 1] || "";
      if (ORIGIN.test(last)) {
        origin = toks.pop() || "";
        rest = toks.join(" ");
      }
    }
    const desc = rest.replace(/\s+/g, " ").trim();
    if (!desc || SKIP_HEAD.test(desc)) continue;
    const words = desc.split(/[\s,/]+/);
    const two = words.slice(0, 2).join(" ");
    const cmd = matchCmd(two) || matchCmd(words[0] || "") || matchCmd(desc);
    const organic = /organic|\borg\b/i.test(desc);
    const kg = kgFromSize(size, cmd, desc);
    const cadKg = kg && kg > 0.2 ? casePrice / kg : null;
    if (cadKg == null) {
      out.push({
        raw,
        cmd,
        unknown: cmd ? null : desc.slice(0, 40),
        price: null,
        qtyKg: kg,
        vendor: `${meta.vendor}${origin ? ` · ${origin}` : ""}`,
        basis: "wholesale",
        sku,
        pack: size || desc,
        organic,
        channel: "distributor",
        casePrice,
        label: desc,
      });
      continue;
    }
    out.push({
      raw,
      cmd,
      unknown: cmd ? null : desc.slice(0, 40),
      price: cadKg,
      qtyKg: kg,
      vendor: `${meta.vendor}${origin ? ` · ${origin}` : ""}`,
      basis: "wholesale",
      sku,
      pack: size || "carton",
      organic,
      channel: "distributor",
      casePrice,
      label: desc,
    });
  }
  return out;
}
