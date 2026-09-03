import { marketFile, nassFarm, worldFile } from "@/lib/data";

export function Freshness() {
  const fao = (worldFile as { generated?: string; latest?: { d?: string } }).latest?.d
    || (worldFile as { generated?: string }).generated;
  const bits = [
    nassFarm.generated ? `NASS ${nassFarm.generated}` : null,
    marketFile.generated ? `AAFC ${marketFile.generated}` : null,
    fao ? `FAO ${String(fao).slice(0, 7)}` : null,
  ].filter(Boolean);
  return (
    <p className="text-xs text-ink-soft">
      Public files on this desk: {bits.join(" · ")}. Weekly job rewrites them. Not a cleared trade.
    </p>
  );
}
