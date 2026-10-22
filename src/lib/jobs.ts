import type { BannerId } from "./grocery";
import type { AngleId } from "./stories";

export type JobId = "shopper" | "owner" | "poster" | "buyer";

export type GrocerySearch = {
  cmd?: string;
  angle?: AngleId;
  ticket?: string;
  store?: string;
  banner?: BannerId;
  job?: JobId;
};

export type Job = {
  id: JobId;
  who: string;
  want: string;
  so: string;
  cta: string;
  to: "/grocery" | "/origins";
  search?: GrocerySearch;
};

/** Default ticket used in the shopper story — a real GTA discounter print, not a flyer. */
export const SAMPLE_TICKET: GrocerySearch = {
  cmd: "Apples",
  angle: "banner",
  ticket: "6.49",
  store: "No Frills Queen",
  banner: "discount",
  job: "shopper",
};

export const JOBS: Job[] = [
  {
    id: "shopper",
    who: "Shopper at the till",
    want: "Know if this ticket is a deal before it hits the cart.",
    so: "Bench the shelf against warehouse, discount, BLS, and the farm.",
    cta: "Type a ticket",
    to: "/grocery",
    search: SAMPLE_TICKET,
  },
  {
    id: "owner",
    who: "Stall or independent",
    want: "Price the board without guessing what the banner is taking.",
    so: "Floor, target, ceiling vs public farm and discount grocery.",
    cta: "Open the pricing window",
    to: "/grocery",
    search: { cmd: "Apples", angle: "owner", job: "owner" },
  },
  {
    id: "poster",
    who: "Someone who posts",
    want: "A number-first card for Instagram and 小红书 this week.",
    so: "One crop, one hook, English + 中文, 4:5 download. We do not post for you.",
    cta: "Copy this week’s post",
    to: "/grocery",
    search: { cmd: "Apples", angle: "markup", job: "poster" },
  },
  {
    id: "buyer",
    who: "Buyer or importer",
    want: "See who packed this week and whether the ask is the season.",
    so: "Origin mix on the AAFC tape, year rail, YoY on the carton.",
    cta: "Play the source map",
    to: "/origins",
  },
];

const ANGLES: AngleId[] = ["markup", "origin", "mover", "banner", "owner"];
const BANNERS: BannerId[] = ["warehouse", "discount", "conventional", "premium", "farmstand"];
const JOB_IDS: JobId[] = ["shopper", "owner", "poster", "buyer"];

export function parseGrocerySearch(s: Record<string, unknown>): GrocerySearch {
  const cmd = typeof s.cmd === "string" && s.cmd.trim() ? s.cmd : undefined;
  const ticket = typeof s.ticket === "string" ? s.ticket : undefined;
  const store = typeof s.store === "string" ? s.store : undefined;
  const angle = ANGLES.includes(s.angle as AngleId) ? (s.angle as AngleId) : undefined;
  const banner = BANNERS.includes(s.banner as BannerId) ? (s.banner as BannerId) : undefined;
  const job = JOB_IDS.includes(s.job as JobId) ? (s.job as JobId) : undefined;
  return { cmd, angle, ticket, store, banner, job };
}

export function jobById(id?: JobId | null): Job | undefined {
  return JOBS.find((j) => j.id === id);
}
