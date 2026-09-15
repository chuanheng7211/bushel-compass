import { catalog, cropPrints } from "./catalog";
import { FX, seriesFor } from "./compass";
import { marketFile, nassFarm, processFile } from "./data";
import type { Compare, CompareHit } from "./desk-filter";

export function deskFx(): number {
  return nassFarm.fxUsdCad || marketFile.fxUsdCad || processFile.fxUsdCad || FX;
}

export function processCadKg(cmd: string): { cadKg: number; label: string } | null {
  const crop = processFile.crops[cmd];
  if (!crop) return null;
  for (const f of crop.forms) {
    if (f.kind === "fresh") continue;
    if (f.nass) {
      const last = processFile.series[f.nass]?.latest;
      if (last) return { cadKg: last.cadKg, label: f.label };
    }
  }
  return null;
}

function farmYoy(cmd: string): number | null {
  const item = catalog.find((c) => c.label === cmd);
  const monthly = item?.nass ? nassFarm.series[item.nass]?.monthly : undefined;
  if (!monthly || monthly.length < 13) return null;
  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 13];
  if (!prev?.cadKg) return null;
  return ((last.cadKg - prev.cadKg) / prev.cadKg) * 100;
}

function yoyFromWeekly(cmd: string): number | null {
  const s = seriesFor(marketFile, cmd);
  if (s.length < 2) return null;
  const last = s[s.length - 1];
  const target = Date.parse(last.d) - 365 * 86400000;
  if (!Number.isFinite(target) || !last.p50) return null;
  let best = s[0];
  let bestDiff = Math.abs(Date.parse(s[0].d) - target);
  for (const p of s) {
    const d = Math.abs(Date.parse(p.d) - target);
    if (d < bestDiff) {
      best = p;
      bestDiff = d;
    }
  }
  if (bestDiff > 45 * 86400000 || !best.p50) return null;
  return ((last.p50 - best.p50) / best.p50) * 100;
}

export function compareHit(
  cmd: string,
  currentCadKg: number | null | undefined,
  compare: Compare,
  layer?: string,
): CompareHit | null {
  if (compare === "off" || currentCadKg == null) return null;
  const prints = cropPrints(cmd);
  const tapeOk = !layer || layer === "wholesale" || layer === "farm";
  if (compare === "wow") {
    if (!tapeOk) {
      return { label: "vs last week", pct: null, cadKgAbs: null, note: "No weekly tape for this form" };
    }
    const pct = prints.wow ?? null;
    const base = prints.wholesale ?? currentCadKg;
    if (pct == null) {
      return { label: "vs last week", pct: null, cadKgAbs: null, note: "No weekly wholesale print" };
    }
    const prev = base / (1 + pct / 100);
    return {
      label: "vs last week",
      pct,
      cadKgAbs: base - prev,
      note: "AAFC week on week",
    };
  }
  if (compare === "yoy") {
    if (!tapeOk) {
      return {
        label: "farm vs year",
        pct: farmYoy(cmd),
        cadKgAbs: null,
        note: "Farm series YoY — not this form",
      };
    }
    const pct = prints.yoy ?? yoyFromWeekly(cmd) ?? farmYoy(cmd);
    const base = prints.wholesale ?? currentCadKg;
    if (pct == null) {
      return { label: "vs last year", pct: null, cadKgAbs: null, note: "No year-ago print" };
    }
    const prev = base / (1 + pct / 100);
    return {
      label: "vs last year",
      pct,
      cadKgAbs: base - prev,
      note: prints.yoy != null ? "AAFC wholesale YoY" : "USDA farm YoY",
    };
  }
  if (compare === "farm") {
    const farm = prints.farm;
    if (farm == null) {
      return { label: "vs farm-gate", pct: null, cadKgAbs: null, note: "No NASS farm series" };
    }
    return {
      label: "vs farm-gate",
      pct: ((currentCadKg - farm) / farm) * 100,
      cadKgAbs: currentCadKg - farm,
      note: "USDA NASS prices received",
    };
  }
  const proc = processCadKg(cmd);
  if (!proc) {
    return { label: "vs process", pct: null, cadKgAbs: null, note: "No processing print" };
  }
  return {
    label: `vs ${proc.label}`,
    pct: ((currentCadKg - proc.cadKg) / proc.cadKg) * 100,
    cadKgAbs: currentCadKg - proc.cadKg,
    note: "USDA processing / dry",
  };
}
