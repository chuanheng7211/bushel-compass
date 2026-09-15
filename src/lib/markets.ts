import { marketsFile } from "./data";
import type { CropTapeMap, ListedName } from "./types";

export function listedBySymbol(): Map<string, ListedName> {
  return new Map(marketsFile.universe.map((n) => [n.symbol, n]));
}

export function cropTapeFor(label: string): CropTapeMap {
  return marketsFile.crops[label] || marketsFile.defaultCrop;
}

export function namesForCrop(label: string): ListedName[] {
  const tape = cropTapeFor(label);
  const by = listedBySymbol();
  return tape.tickers.map((s) => by.get(s)).filter((n): n is ListedName => Boolean(n));
}

export function fmtPx(n: ListedName): string {
  if (n.price == null) return "—";
  if (n.symbol === "OJ=F") return `${n.price.toFixed(2)} ¢/lb`;
  const abs = Math.abs(n.price);
  const digits = n.role === "fx" || abs < 2 ? 4 : 2;
  const unit = n.currency && n.currency !== "USD" && n.currency !== "USX" ? ` ${n.currency}` : "";
  return `${n.price.toFixed(digits)}${unit}`;
}

export function fmtChg(n: number | null | undefined, suffix = "%"): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}${suffix}`;
}

export function chgTone(n: number | null | undefined): string {
  if (n == null || n === 0) return "text-ink-soft";
  return n > 0 ? "text-moss" : "text-rust";
}
