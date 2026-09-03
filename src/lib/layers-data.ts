import layersJson from "@/data/layers.json";
import type { LayersFile } from "./types";

export const layersFile = layersJson as unknown as LayersFile;
