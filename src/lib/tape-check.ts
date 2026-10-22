import tapeJson from "@/data/tape-check.json";

export type TapeCrop = {
  cmd: string;
  seasonal: boolean;
  n: number;
  dest: number | null;
  destAsOf: string | null;
  ratio: number | null;
  ratioAugust: number | null;
  apeDest: number | null;
  inBand: number;
};

export type TapeCheckFile = {
  generated: string;
  heldOut: string;
  destWeek: string;
  destSource: string;
  matchedCrops: number;
  matchedSkus: number;
  medianRatio: number;
  mapeDest: number;
  mapeFair125: number;
  mapeAugustTape: number;
  shareInDistributorBand: number;
  shareInDestSpread: number;
  lesson: string;
  crops: TapeCrop[];
};

export const tapeCheck = tapeJson as TapeCheckFile;

export function tapeCrop(cmd: string): TapeCrop | undefined {
  return tapeCheck.crops.find((c) => c.cmd === cmd);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
