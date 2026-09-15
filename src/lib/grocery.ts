import { catalog, cropPrints } from "./catalog";
import { movers, wholesaleFor } from "./compass";
import { marketFile } from "./data";
import { blsKeyFor, blsPt } from "./substitutes";

export type BannerId = "warehouse" | "discount" | "conventional" | "premium" | "farmstand";

export type Banner = {
  id: BannerId;
  label: string;
  examples: string;
  markup: number;
  from: "wholesale" | "farm";
  note: string;
};

export const BANNERS: Banner[] = [
  {
    id: "warehouse",
    label: "Warehouse club",
    examples: "Costco, Wholesale Club",
    markup: 1.28,
    from: "wholesale",
    note: "Thin markup on a big pack. Best typical per-kilo for a shopper.",
  },
  {
    id: "discount",
    label: "Discount grocery",
    examples: "No Frills, Food Basics, Walmart",
    markup: 1.55,
    from: "wholesale",
    note: "Hard discounter. Volume, not service.",
  },
  {
    id: "conventional",
    label: "Conventional grocery",
    examples: "Loblaws, Sobeys, Metro",
    markup: 1.85,
    from: "wholesale",
    note: "Uses the AAFC file’s estimated retail when it prints.",
  },
  {
    id: "premium",
    label: "Premium / specialty",
    examples: "Whole Foods, Pusateri’s, McEwan",
    markup: 2.45,
    from: "wholesale",
    note: "Service, spec, and shrink. Not a deal print.",
  },
  {
    id: "farmstand",
    label: "Farm stand / DTC",
    examples: "market stall, CSA, roadside",
    markup: 1.4,
    from: "farm",
    note: "Grower keeps pack plus a thin retail. Should sit under conventional.",
  },
];

const STORE_HINTS: { re: RegExp; banner: BannerId }[] = [
  { re: /costco|wholesale club/i, banner: "warehouse" },
  { re: /no frills|food basics|walmart|freshco|giant tiger/i, banner: "discount" },
  { re: /loblaw|superstore|sobeys|safeway|metro|farm boy|independent city/i, banner: "conventional" },
  { re: /whole foods|pusater|mcewan|organic|specialty|pusateri's/i, banner: "premium" },
  { re: /farm|stall|csa|roadside|farmer|market stall/i, banner: "farmstand" },
];

export function hintBanner(store: string): BannerId | null {
  const t = store.trim();
  if (!t) return null;
  for (const h of STORE_HINTS) if (h.re.test(t)) return h.banner;
  return null;
}

export type GroceryPrints = {
  cmd: string;
  farm: number | null;
  wholesale: number | null;
  bls: number | null;
  blsAsOf: string | null;
  blsLabel: string | null;
  conventional: number | null;
  snapAsOf: string | null;
  markupFile: number | null;
  wow: number | null;
  yoy: number | null;
  origins: string;
};

export function groceryPrints(cmd: string): GroceryPrints {
  const p = cropPrints(cmd);
  const snap = wholesaleFor(marketFile, cmd);
  const wholesale = snap?.p50 ?? p.wholesale ?? null;
  const blsSeries = blsPt(blsKeyFor(cmd));
  const bls = blsSeries?.cadKg ?? snap?.blsCadKg ?? null;
  const fileMarkup = snap?.markup ?? 1.85;
  const conventional =
    snap?.estRetail ?? (wholesale != null ? wholesale * fileMarkup : bls);
  const origins = (snap?.origins || [])
    .slice(0, 3)
    .map(([code, n]) => `${code} ${n}`)
    .join(" · ");
  return {
    cmd,
    farm: p.farm ?? null,
    wholesale,
    bls,
    blsAsOf: blsSeries?.d?.slice(0, 7) ?? null,
    blsLabel: blsKeyFor(cmd) ? "BLS grocery average" : snap?.blsCadKg != null ? "Grocery print on the AAFC file" : null,
    conventional,
    snapAsOf: snap?.asof ?? null,
    markupFile: snap?.markup ?? null,
    wow: snap?.wow ?? null,
    yoy: snap?.yoy ?? null,
    origins,
  };
}

export type ShelfBand = Banner & {
  cadKg: number | null;
  modeled: boolean;
  how: string;
};

export function shelfBands(cmd: string): ShelfBand[] {
  const g = groceryPrints(cmd);
  return BANNERS.map((b) => {
    if (b.id === "farmstand") {
      if (g.farm != null) {
        return { ...b, cadKg: g.farm * b.markup, modeled: true, how: `farm × ${b.markup}` };
      }
      if (g.wholesale != null) {
        return { ...b, cadKg: g.wholesale * 0.95, modeled: true, how: "under wholesale (no farm print)" };
      }
      return { ...b, cadKg: null, modeled: true, how: "need a farm or wholesale print" };
    }
    if (b.id === "conventional" && g.conventional != null) {
      const fromFile = g.markupFile != null && g.wholesale != null;
      return {
        ...b,
        cadKg: g.conventional,
        modeled: !fromFile,
        how: fromFile ? `file retail (×${g.markupFile})` : g.wholesale != null ? `ask × ${b.markup}` : "from BLS",
      };
    }
    if (g.wholesale != null) {
      return { ...b, cadKg: g.wholesale * b.markup, modeled: true, how: `ask × ${b.markup}` };
    }
    if (g.conventional != null) {
      return {
        ...b,
        cadKg: g.conventional * (b.markup / 1.85),
        modeled: true,
        how: `scaled from grocery (×${b.markup})`,
      };
    }
    return { ...b, cadKg: null, modeled: true, how: "no wholesale or grocery print" };
  });
}

export type TicketRead = {
  ticket: number;
  closest: ShelfBand;
  vsBls: number | null;
  vsWarehouse: number | null;
  vsFarm: number | null;
  vsWholesale: number | null;
  multipleOfFarm: number | null;
  cls: "great" | "good" | "fair" | "rich";
  title: string;
  note: string;
  saveCadKg: number | null;
};

export function compareTicket(cmd: string, ticketCadKg: number, prefer?: BannerId | null): TicketRead | null {
  if (!Number.isFinite(ticketCadKg) || ticketCadKg <= 0) return null;
  const g = groceryPrints(cmd);
  const bands = shelfBands(cmd).filter((b) => b.cadKg != null) as (ShelfBand & { cadKg: number })[];
  if (!bands.length) return null;
  const closest =
    (prefer && bands.find((b) => b.id === prefer)) ||
    [...bands].sort((a, b) => Math.abs(a.cadKg - ticketCadKg) - Math.abs(b.cadKg - ticketCadKg))[0];
  const warehouse = bands.find((b) => b.id === "warehouse");
  const vsBls = g.bls != null ? ticketCadKg / g.bls - 1 : null;
  const vsWarehouse = warehouse ? ticketCadKg / warehouse.cadKg - 1 : null;
  const vsFarm = g.farm != null ? ticketCadKg / g.farm - 1 : null;
  const vsWholesale = g.wholesale != null ? ticketCadKg / g.wholesale - 1 : null;
  const multipleOfFarm = g.farm != null ? ticketCadKg / g.farm : null;
  const saveCadKg = warehouse && ticketCadKg > warehouse.cadKg ? ticketCadKg - warehouse.cadKg : null;

  let cls: TicketRead["cls"] = "fair";
  let title = "Ordinary grocery";
  let note = "Inside the conventional band. Not a steal, not a luxury markup.";
  const conv = bands.find((b) => b.id === "conventional");
  const disc = bands.find((b) => b.id === "discount");
  const prem = bands.find((b) => b.id === "premium");
  if (warehouse && ticketCadKg <= warehouse.cadKg * 1.03) {
    cls = "great";
    title = "Club-like ticket";
    note = "At or under the warehouse band. This is how you buy produce by the kilo.";
  } else if (disc && ticketCadKg <= disc.cadKg * 1.03) {
    cls = "good";
    title = "Discounter ticket";
    note = "Hard-discounter territory. A fair B2C print if the pack is ordinary.";
  } else if (g.bls != null && ticketCadKg <= g.bls * 0.95) {
    cls = "good";
    title = "Beating the grocery average";
    note = "Under BLS. A deal print for a conventional pack.";
  } else if (g.bls != null && ticketCadKg <= g.bls * 1.05) {
    cls = "good";
    title = "At the public grocery average";
    note = "In line with BLS. You are not funding a specialty markup.";
  } else if (conv && ticketCadKg <= conv.cadKg * 1.08) {
    cls = "fair";
    title = "Ordinary grocery";
    note = "Typical conventional shelf after shrink and store labor.";
  } else if (prem && ticketCadKg <= prem.cadKg * 1.05) {
    cls = "rich";
    title = "Premium ticket";
    note = "You are paying specialty. Fine for spec; a poor way to buy bulk kilos.";
  } else {
    cls = "rich";
    title = "Rich vs every modeled banner";
    note = "Above the premium band. Check pack size, organic spec, or walk.";
  }

  return {
    ticket: ticketCadKg,
    closest,
    vsBls,
    vsWarehouse,
    vsFarm,
    vsWholesale,
    multipleOfFarm,
    cls,
    title,
    note,
    saveCadKg,
  };
}

export type OwnerRow = {
  id: BannerId;
  label: string;
  shelf: number;
  retailerMargin: number | null;
  retailerPct: number | null;
  growerMargin: number | null;
  growerPct: number | null;
};

export type OwnerBench = {
  costFarm: number | null;
  costPacked: number | null;
  costWholesale: number | null;
  dtcLo: number | null;
  dtcTarget: number | null;
  dtcHi: number | null;
  rows: OwnerRow[];
  impliedCost: number | null;
  impliedBanner: BannerId | null;
  retailerRule: string;
  growerRule: string;
};

export function ownerBench(cmd: string, ticketCadKg?: number | null, banner?: BannerId | null): OwnerBench {
  const g = groceryPrints(cmd);
  const bands = shelfBands(cmd);
  const packed = g.farm != null ? g.farm * 1.15 : null;
  const discount = bands.find((b) => b.id === "discount")?.cadKg ?? null;
  const dtcLo = g.farm != null ? g.farm * 1.25 : g.wholesale != null ? g.wholesale * 0.9 : null;
  const dtcTarget = bands.find((b) => b.id === "farmstand")?.cadKg ?? null;
  const dtcHi = discount;
  const rows: OwnerRow[] = bands
    .filter((b) => b.cadKg != null)
    .map((b) => {
      const shelf = b.cadKg as number;
      const retailerMargin = b.id === "farmstand" || g.wholesale == null ? null : shelf - g.wholesale;
      const retailerPct = retailerMargin != null && g.wholesale != null && g.wholesale > 0 ? retailerMargin / g.wholesale : null;
      const growerCost = packed ?? g.farm;
      const growerMargin = growerCost != null ? shelf - growerCost : null;
      const growerPct = growerCost != null && growerCost > 0 ? growerMargin! / growerCost : null;
      return {
        id: b.id,
        label: b.label,
        shelf,
        retailerMargin,
        retailerPct,
        growerMargin,
        growerPct,
      };
    });
  const b = BANNERS.find((x) => x.id === banner) || BANNERS[2];
  const impliedCost = ticketCadKg != null && ticketCadKg > 0 ? ticketCadKg / b.markup : null;
  const retailerRule =
    g.wholesale != null
      ? `Retailer: land near the destination ask, then price discount for volume, conventional for the everyday shelf, and do not clear above premium without a spec story.`
      : `Retailer: no public wholesale on this item. Use BLS as the grocery tape and keep a thin markup off your landed cost.`;
  const growerRule =
    dtcLo != null && dtcHi != null
      ? `Grower DTC: floor covers pick and pack, target is the farm-stand band, ceiling is discount grocery. Above conventional you lose to the banner; below warehouse you donate margin.`
      : `Grower DTC: no farm print. Stay under the conventional grocery band so the stall still looks like a deal.`;
  return {
    costFarm: g.farm,
    costPacked: packed,
    costWholesale: g.wholesale,
    dtcLo,
    dtcTarget,
    dtcHi,
    rows,
    impliedCost,
    impliedBanner: banner ?? null,
    retailerRule,
    growerRule,
  };
}

export function shopperTips(cmd: string, ticketCadKg?: number | null, store?: string): string[] {
  const g = groceryPrints(cmd);
  const bands = shelfBands(cmd);
  const warehouse = bands.find((b) => b.id === "warehouse");
  const farmstand = bands.find((b) => b.id === "farmstand");
  const tips: string[] = [];
  if (ticketCadKg != null && warehouse?.cadKg != null && ticketCadKg > warehouse.cadKg * 1.12) {
    const save = ticketCadKg - warehouse.cadKg;
    tips.push(
      `Warehouse club band is $${warehouse.cadKg.toFixed(2)}/kg. Same crop, bigger pack — about $${save.toFixed(2)}/kg less than the ticket you typed.`,
    );
  }
  if (farmstand?.cadKg != null && (ticketCadKg == null || ticketCadKg > farmstand.cadKg * 1.1)) {
    tips.push(
      `Farm stand modeled at $${farmstand.cadKg.toFixed(2)}/kg. In a live local window, skip the banner and buy the stall.`,
    );
  }
  if (g.yoy != null) {
    tips.push(
      g.yoy > 8
        ? `Vancouver wholesale is up ${g.yoy.toFixed(1)}% vs last year. A high shelf ticket may be the crop, not just the store.`
        : g.yoy < -8
          ? `Vancouver wholesale is down ${Math.abs(g.yoy).toFixed(1)}% vs last year. If the shelf did not come down, you are paying last year’s markup.`
          : `Vancouver wholesale is ${g.yoy > 0 ? "up" : "down"} ${Math.abs(g.yoy).toFixed(1)}% vs last year — a quiet tape. Shop format, not panic.`,
    );
  }
  if (g.bls != null && ticketCadKg != null && ticketCadKg < g.bls * 0.95) {
    tips.push(`You are beating the BLS grocery average ($${g.bls.toFixed(2)}/kg). Keep the receipt — this is a deal print, not a flyer.`);
  }
  if (g.origins) {
    tips.push(`This week’s Vancouver mix: ${g.origins}. Origin walks. A Chilean boat week is not a Washington storage week.`);
  }
  if (store?.trim()) {
    const hint = hintBanner(store);
    if (hint) {
      const band = bands.find((b) => b.id === hint);
      if (band?.cadKg != null) {
        tips.push(
          `${store.trim()} reads as ${band.label.toLowerCase()}. Modeled shelf ${band.cadKg.toFixed(2)} CAD/kg (${band.how}).`,
        );
      }
    }
  }
  if (!tips.length) {
    tips.push("Type the ticket you actually saw. We bench it against public farm, wholesale, and grocery averages — not a flyer scrape.");
  }
  return tips.slice(0, 4);
}

export type GroceryGap = {
  cmd: string;
  farm: number;
  shelf: number;
  multiple: number;
  shelfHow: string;
};

export function groceryGaps(n = 8): GroceryGap[] {
  const rows: GroceryGap[] = [];
  for (const c of catalog) {
    const g = groceryPrints(c.label);
    if (g.farm == null || g.farm <= 0) continue;
    const shelf = g.conventional ?? g.bls;
    if (shelf == null) continue;
    rows.push({
      cmd: c.label,
      farm: g.farm,
      shelf,
      multiple: shelf / g.farm,
      shelfHow: g.conventional != null ? "conventional / BLS" : "BLS",
    });
  }
  return rows.sort((a, b) => b.multiple - a.multiple).slice(0, n);
}

export function groceryCatalog(): string[] {
  return catalog
    .filter((c) => {
      const p = cropPrints(c.label);
      return p.farm != null || p.wholesale != null || blsPt(blsKeyFor(c.label)) != null;
    })
    .map((c) => c.label);
}

export function topMoverCmd(fallback = "Apples"): string {
  const rows = movers(marketFile, "Vancouver", 1);
  return rows[0]?.cmd || fallback;
}
