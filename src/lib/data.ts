import layersJson from "@/data/layers.json";
import marketJson from "@/data/market.json";
import marketsJson from "@/data/markets.json";
import nassJson from "@/data/nass_farm.json";
import playJson from "@/data/playbooks.json";
import processJson from "@/data/process.json";
import worldJson from "@/data/world.json";
import type { LayersFile, MarketFile, MarketsFile, NassFile, Playbooks, ProcessFile } from "./types";

export const playbooks = playJson as unknown as Playbooks;
export const nassFarm = nassJson as unknown as NassFile;
export const marketFile = marketJson as unknown as MarketFile;
export const layersFile = layersJson as unknown as LayersFile;
export const worldFile = worldJson as Record<string, unknown>;
export const marketsFile = marketsJson as unknown as MarketsFile;
export const processFile = processJson as unknown as ProcessFile;
