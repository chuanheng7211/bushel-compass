import amsJson from "@/data/ams.json";
import { wholesaleFor } from "./compass";
import { marketFile } from "./data";

export type AmsPt = {
  d: string;
  midUsd: number;
  cadKg: number;
  rpm: number | null;
  avail: number | null;
};

export type AmsLane = {
  cmd: string;
  origin: string;
  dest: string;
  commodity: string;
  asof: string;
  midUsd: number;
  rpm: number | null;
  avail: number | null;
  cadKg: number;
  payloadKg: number;
  n: number;
  series: AmsPt[];
};

export type AmsFile = {
  generated?: string;
  source?: string;
  note?: string;
  payloadLb?: number;
  fx?: number;
  lanes: Record<string, AmsLane>;
};

export const amsFile = amsJson as unknown as AmsFile;

export function amsLane(cmd: string): AmsLane | null {
  return amsFile.lanes[cmd] || null;
}

/** Dest minus AMS truck. Upper bound on origin FOB — not a reported FOB. */
export function impliedFob(cmd: string): {
  dest: number | null;
  truck: number | null;
  fob: number | null;
  asof: string | null;
  lane: AmsLane | null;
} {
  const lane = amsLane(cmd);
  const dest = wholesaleFor(marketFile, cmd)?.p50 ?? null;
  const truck = lane?.cadKg ?? null;
  const fob = dest != null && truck != null ? dest - truck : null;
  return { dest, truck, fob, asof: lane?.asof ?? null, lane };
}

export function availLabel(n: number | null | undefined): string {
  if (n == null) return "availability not coded";
  if (n <= 2) return "truck loose";
  if (n === 3) return "truck adequate";
  return "truck tight";
}
