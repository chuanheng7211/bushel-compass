import type { Unit } from "./types";

export type Period = "latest" | "3m" | "12m" | "5y" | "all";
export type Compare = "off" | "wow" | "yoy" | "farm" | "process";

export const PERIOD_OPTS: { id: Period; label: string; hint: string }[] = [
  { id: "latest", label: "Latest", hint: "Last print, short sparkline" },
  { id: "3m", label: "3 mo", hint: "Last quarter" },
  { id: "12m", label: "12 mo", hint: "Last year of tape" },
  { id: "5y", label: "5 yr", hint: "Five-year farm history" },
  { id: "all", label: "All", hint: "Full public series" },
];

export const COMPARE_OPTS: { id: Compare; label: string; hint: string }[] = [
  { id: "off", label: "Off", hint: "Just the print" },
  { id: "wow", label: "vs week", hint: "Week on week, AAFC" },
  { id: "yoy", label: "vs year", hint: "Versus a year ago" },
  { id: "farm", label: "vs farm", hint: "Versus USDA farm-gate" },
  { id: "process", label: "vs process", hint: "Versus juice / dry / plant" },
];

export const UNIT_OPTS: { id: Unit; label: string; hint: string }[] = [
  { id: "cadKg", label: "CAD/kg", hint: "Canadian dollar per kilogram" },
  { id: "cadLb", label: "CAD/lb", hint: "Canadian dollar per pound" },
  { id: "usdLb", label: "USD/lb", hint: "US dollar per pound" },
  { id: "usdKg", label: "USD/kg", hint: "US dollar per kilogram" },
];

const DAYS: Record<Period, number | null> = {
  latest: 60,
  "3m": 100,
  "12m": 400,
  "5y": 365 * 5 + 40,
  all: null,
};

export function periodShort(period: Period): string {
  return PERIOD_OPTS.find((p) => p.id === period)?.hint || "Last year of tape";
}

export function compareShort(compare: Compare): string {
  return COMPARE_OPTS.find((c) => c.id === compare)?.label || "Off";
}

export function unitTag(unit: Unit): string {
  if (unit === "cadLb") return "CAD/lb";
  if (unit === "usdLb") return "USD/lb";
  if (unit === "usdKg") return "USD/kg";
  return "CAD/kg";
}

export function sliceByPeriod<T extends { d: string }>(
  pts: T[],
  period: Period,
  fallbackN = 12,
): T[] {
  if (!pts.length || period === "all") return pts;
  const days = DAYS[period];
  if (days == null) return pts;
  const last = Date.parse(pts[pts.length - 1].d);
  if (!Number.isFinite(last)) return pts.slice(-fallbackN);
  const cut = last - days * 86400000;
  const sliced = pts.filter((p) => {
    const t = Date.parse(p.d);
    return Number.isFinite(t) ? t >= cut : true;
  });
  return sliced.length ? sliced : pts.slice(-fallbackN);
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export type CompareHit = {
  label: string;
  pct: number | null;
  cadKgAbs: number | null;
  note: string;
};
