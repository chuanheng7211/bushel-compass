import { FX, fmt, fromCadKg, toCadKg, unitShort } from "./compass";
import { compareShort, periodShort } from "./desk-filter";
import { useDesk } from "./desk-store";
import type { Unit } from "./types";

export function convertTypedPrice(value: string, from: Unit, to: Unit, fx = FX): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return value;
  const cad = toCadKg(n, from, fx);
  if (cad == null) return value;
  return fromCadKg(cad, to, fx).toFixed(2);
}

export function useDeskMoney() {
  const period = useDesk((s) => s.period);
  const compare = useDesk((s) => s.compare);
  const unit = useDesk((s) => s.unit);
  const fx = FX;
  function cad(n: number | null | undefined, d = 2) {
    if (n == null || Number.isNaN(n)) return "—";
    return `$${fmt(fromCadKg(n, unit, fx), d)}`;
  }
  function num(n: number) {
    return Number(fromCadKg(n, unit, fx).toFixed(2));
  }
  return {
    period,
    compare,
    unit,
    fx,
    cad,
    num,
    tag: unitShort(unit),
    periodLabel: periodShort(period),
    compareLabel: compareShort(compare),
  };
}
