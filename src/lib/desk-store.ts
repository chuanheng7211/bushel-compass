import { create } from "zustand";
import type { Compare, Period } from "./desk-filter";
import type { Unit } from "./types";

type DeskState = {
  period: Period;
  compare: Compare;
  unit: Unit;
  setPeriod: (period: Period) => void;
  setCompare: (compare: Compare) => void;
  setUnit: (unit: Unit) => void;
};

export const useDesk = create<DeskState>((set) => ({
  period: "12m",
  compare: "yoy",
  unit: "cadKg",
  setPeriod: (period) => set({ period }),
  setCompare: (compare) => set({ compare }),
  setUnit: (unit) => set({ unit }),
}));
