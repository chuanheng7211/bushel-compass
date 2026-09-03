import { marketFile, nassFarm, playbooks } from "./data";
import type { CommodityPlay, Playbooks } from "./types";

/** NASS series id → AAFC / UI label */
export const NASS_LABEL: Record<string, string> = {
  apples_fresh: "Apples",
  strawberries_fresh: "Strawberries",
  grapes_fresh: "Grapes (Table)",
  peaches_fresh: "Peaches",
  pears_fresh: "Pears",
  tomatoes_fresh: "Tomatoes",
  lettuce_head: "Lettuce",
  potatoes_fresh: "Potatoes",
  onions_dry: "Onions",
  broccoli: "Broccoli",
  carrots: "Carrots",
  cauliflower: "Cauliflower",
  celery: "Celery",
  cucumbers: "Cucumbers",
  beans_snap: "Beans",
  asparagus: "Asparagus",
  sweet_corn: "Sweet Corn",
  cantaloupe: "Melons",
};

const EXTRA_ORIGINS: Record<string, CommodityPlay["origins"]> = {
  Peaches: [
    { when: "May–Sep", who: "California / South Carolina / Georgia", why: "US fresh peach window" },
    { when: "Dec–Mar", who: "Chile", why: "counter-season" },
  ],
  Pears: [{ when: "Aug–Apr", who: "Washington / Oregon", why: "storage crop, same desk as apples" }],
  Cauliflower: [
    { when: "Apr–Oct", who: "Salinas–Watsonville", why: "summer brassica" },
    { when: "Nov–Mar", who: "Yuma / Imperial + Arizona", why: "desert winter with lettuce" },
  ],
  Celery: [
    { when: "Apr–Oct", who: "Salinas–Watsonville", why: "Oxnard / Salinas rotation" },
    { when: "Nov–Mar", who: "Yuma / Imperial + Arizona", why: "winter" },
  ],
  Beans: [
    { when: "Apr–Oct", who: "Georgia / Tennessee / Michigan", why: "US snap window" },
    { when: "winter", who: "Florida + Mexico", why: "winter grocery" },
  ],
  Asparagus: [
    { when: "Feb–Jun", who: "California / Washington", why: "US fresh spears" },
    { when: "Aug–Jan", who: "Mexico / Peru", why: "counter-season spears" },
  ],
  "Sweet Corn": [
    { when: "May–Sep", who: "Florida / Georgia then Midwest", why: "the window walks north" },
  ],
  Melons: [
    { when: "May–Oct", who: "California / Arizona", why: "cantaloup NASS series" },
    { when: "winter", who: "Mexico / Central America", why: "import honeydew / cantaloup" },
  ],
};

export type CatalogItem = {
  label: string;
  nass?: string;
  aafc?: boolean;
  group: "nass" | "aafc-only";
};

export function buildCatalog(): CatalogItem[] {
  const items = new Map<string, CatalogItem>();
  for (const [id, series] of Object.entries(nassFarm.series)) {
    const label = NASS_LABEL[id] || series.commodity || id;
    items.set(label, { label, nass: id, aafc: false, group: "nass" });
  }
  const marketCmds = new Set((marketFile.snapshot || []).map((s) => s.cmd));
  for (const cmd of marketCmds) {
    const prev = items.get(cmd);
    if (prev) items.set(cmd, { ...prev, aafc: true });
    else items.set(cmd, { label: cmd, aafc: true, group: "aafc-only" });
  }
  return [...items.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export const catalog = buildCatalog();

export function fullPlaybooks(): Playbooks {
  const commodities: Record<string, CommodityPlay> = { ...playbooks.commodities };
  for (const item of catalog) {
    const existing = commodities[item.label];
    if (existing) {
      if (!existing.nass && item.nass) existing.nass = item.nass;
      continue;
    }
    commodities[item.label] = {
      nass: item.nass,
      aafc: item.label,
      form: ["fresh"],
      origins: EXTRA_ORIGINS[item.label] || [],
      channels: [
        { id: "fob", label: "Origin FOB", use: "AMS shipping-point is what a shipper actually trades." },
        { id: "wholesale", label: "Destination wholesale", use: "AAFC ask if the city prints it." },
      ],
    };
  }
  return { ...playbooks, commodities };
}

export function cropPrints(label: string) {
  const item = catalog.find((c) => c.label === label);
  const farm = item?.nass ? nassFarm.series[item.nass]?.latest?.cadKg : undefined;
  const snap = (marketFile.snapshot || []).find((s) => s.centre === "Vancouver" && s.cmd === label);
  return {
    label,
    nass: item?.nass,
    aafc: item?.aafc,
    group: item?.group,
    farm,
    wholesale: snap?.p50,
    wow: snap?.wow,
    yoy: snap?.yoy,
  };
}
