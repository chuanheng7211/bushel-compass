import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OriginMap } from "@/components/origin-map";
import { SiteHeader } from "@/components/site-header";
import { wholesaleFor } from "@/lib/compass";
import { fullPlaybooks } from "@/lib/catalog";
import { marketFile } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/origins")({ component: OriginsPage });

function OriginsPage() {
  const playAll = fullPlaybooks();
  const crops = useMemo(
    () =>
      Object.keys(playAll.commodities)
        .filter((k) => (playAll.commodities[k].origins || []).length > 0)
        .sort(),
    [playAll],
  );
  const [cmd, setCmd] = useState("Apples");
  const play = playAll.commodities[cmd];
  const snap = useMemo(() => wholesaleFor(marketFile, cmd), [cmd]);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Where the raw is grown, and how the country of origin walks into the GTA." />
      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          The crop does not sit still.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Play the year. The rail is who is in season; the hatch is a handoff. Color is country. Ring size is this week’s AAFC mix. Weather here is the climate clock of the belt — a freeze in a live district, not an FAO index.
        </p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {crops.map((label) => {
            const on = cmd === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setCmd(label)}
                className={cn(
                  "min-h-11 shrink-0 rounded-xl border px-3 py-2 text-sm",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>
      <section className="px-4 py-4 pb-16 sm:px-9">
        <OriginMap cmd={cmd} play={play} snap={snap} />
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <Note
            t="North America truck"
            d="Washington apples, Salinas lettuce, Idaho potatoes, Ontario greenhouse. Four to five days of reefer. This is the default GTA lane."
          />
          <Note
            t="Mexico / desert winter"
            d="When the north freezes, the window jumps to Sinaloa, Baja, Yuma, Florida. Same SKU name, different plant, different farm print."
          />
          <Note
            t="Counter-season boat"
            d="Chile, Peru, New Zealand, Ecuador. Two to three weeks on the water. The importer already ate duty, inspection, and arrival quality. Do not compare their FOB to a Yakima carton."
          />
        </div>
      </section>
    </div>
  );
}

function Note({ t, d }: { t: string; d: string }) {
  return (
    <div className="rounded-xl border border-line bg-cream p-4">
      <h2 className="font-display text-lg">{t}</h2>
      <p className="mt-2 text-sm text-ink-soft">{d}</p>
    </div>
  );
}
