import { cropPrints } from "./catalog";
import { fmt } from "./compass";
import { marketFile, marketsFile, nassFarm, processFile } from "./data";
import type { ProcessCrop, ProcessPt, SubForm } from "./types";

export type Print = {
  cadKg: number;
  usdLb?: number;
  asof: string;
  source: string;
  lag: string;
  layer: string;
};

export type ChainStep = {
  n: string;
  t: string;
  v: number | null;
  note: string;
  asof?: string;
  modeled?: boolean;
};

export function cropSubs(cmd: string): ProcessCrop {
  return processFile.crops[cmd] || processFile.defaultCrop;
}

export function formById(cmd: string, id: string): SubForm | undefined {
  return cropSubs(cmd).forms.find((f) => f.id === id);
}

export function nassPt(id?: string): ProcessPt | null {
  if (!id) return null;
  return processFile.series[id]?.latest || null;
}

export function blsPt(id?: string): ProcessPt | null {
  if (!id) return null;
  return processFile.bls[id]?.latest || null;
}

export function printForForm(cmd: string, form: SubForm): Print | null {
  if (form.kind === "fresh" || form.tape === "fresh") {
    const p = cropPrints(cmd);
    const snap = (marketFile.snapshot || []).find((s) => s.centre === "Vancouver" && s.cmd === cmd);
    if (p.wholesale != null) {
      return {
        cadKg: p.wholesale,
        asof: snap?.asof || marketFile.generated || "—",
        source: "AAFC Vancouver wholesale ask",
        lag: "weekly",
        layer: "wholesale",
      };
    }
    if (p.farm != null) {
      const last = p.nass ? nassFarm.series[p.nass]?.latest : null;
      return {
        cadKg: p.farm,
        usdLb: last?.usdLb,
        asof: last?.d?.slice(0, 7) || nassFarm.generated || "—",
        source: "USDA NASS farm-gate",
        lag: "monthly",
        layer: "farm",
      };
    }
    return null;
  }
  if (form.nass) {
    const s = processFile.series[form.nass];
    const last = s?.latest;
    if (last) {
      const monthly = s.freq === "MONTHLY";
      return {
        cadKg: last.cadKg,
        usdLb: last.usdLb,
        asof: monthly ? last.d.slice(0, 7) : String(last.y),
        source: monthly ? "USDA NASS (monthly processing / dry)" : "USDA NASS processing (marketing year)",
        lag: monthly ? "monthly" : "marketing year",
        layer: "process-farm",
      };
    }
  }
  if (form.bls) {
    const s = processFile.bls[form.bls];
    const last = s?.latest;
    if (last) {
      return {
        cadKg: last.cadKg,
        usdLb: last.usdLb,
        asof: last.d.slice(0, 7),
        source: `BLS ${s.label}`,
        lag: "monthly grocery average",
        layer: "retail",
      };
    }
  }
  return null;
}

export function futuresNote(symbols?: string[]) {
  if (!symbols?.length) return [];
  return symbols.map((sym) => {
    const n = marketsFile.universe.find((u) => u.symbol === sym);
    return {
      symbol: sym,
      name: n?.name || sym,
      price: n?.price ?? null,
      chgPct: n?.chgPct ?? null,
      means: n?.means || "",
    };
  });
}

export function freshLadder(cmd: string): ChainStep[] {
  const p = cropPrints(cmd);
  const snap = (marketFile.snapshot || []).find((s) => s.centre === "Vancouver" && s.cmd === cmd);
  const farm = p.farm ?? null;
  const farmAs = p.nass ? nassFarm.series[p.nass]?.latest?.d?.slice(0, 7) : undefined;
  const fobPublic = snap?.fobCadKg ?? null;
  const fob = fobPublic ?? (farm != null ? farm * 1.35 : null);
  const landed = fob != null ? fob + 0.3 : null;
  const wholesale = snap?.p50 ?? null;
  const retail = snap?.blsCadKg ?? snap?.estRetail ?? blsPt(blsKeyFor(cmd))?.cadKg ?? null;
  const retailNote = snap?.blsCadKg != null
    ? "BLS on the AAFC file"
    : snap?.estRetail != null
      ? "estimated from markup"
      : "BLS grocery average when printed";
  return [
    { n: "1", t: "Farm (fresh)", v: farm, note: "USDA NASS monthly, all grades", asof: farmAs, modeled: false },
    { n: "2", t: "Packed FOB", v: fob, note: fobPublic != null ? "AAFC-implied FOB" : "model ~1.35× farm", asof: snap?.asof, modeled: fobPublic == null },
    { n: "3", t: "Landed GTA", v: landed, note: "FOB + ~$0.30/kg reefer (model)", modeled: true },
    { n: "4", t: "Wholesale ask", v: wholesale, note: "AAFC Vancouver — current public destination print", asof: snap?.asof, modeled: false },
    { n: "5", t: "Retail", v: retail, note: retailNote, asof: snap?.asof, modeled: snap?.blsCadKg == null && snap?.estRetail != null },
  ];
}

export function blsKeyFor(cmd: string): string | undefined {
  const map: Record<string, string> = {
    Apples: "apples_retail",
    Bananas: "bananas_retail",
    Oranges: "oranges_retail",
    Potatoes: "potatoes_retail",
    Lettuce: "lettuce_retail",
    Tomatoes: "tomatoes_retail",
    Strawberries: "berries_retail",
    Beans: "beans_dry_retail",
    "Sweet Corn": "corn_canned_retail",
  };
  return map[cmd];
}

export function money(n: number | null | undefined) {
  return n == null ? "—" : `$${fmt(n)}`;
}
