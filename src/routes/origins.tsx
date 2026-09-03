import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { OriginMap } from "@/components/origin-map";
import { CropGrid } from "@/components/crop-grid";
import { SiteHeader } from "@/components/site-header";
import { wholesaleFor } from "@/lib/compass";
import { fullPlaybooks } from "@/lib/catalog";
import { marketFile } from "@/lib/data";

export const Route = createFileRoute("/origins")({ component: OriginsPage });

function OriginsPage() {
  const playAll = fullPlaybooks();
  const [cmd, setCmd] = useState("Apples");
  const play = playAll.commodities[cmd];
  const snap = useMemo(() => wholesaleFor(marketFile, cmd), [cmd]);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Where the raw is grown, and how it migrates into the GTA." />
      <section className="flex flex-wrap items-end justify-between gap-4 px-4 pt-6 sm:px-9">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">
            The crop does not sit still.
          </h1>
          <p className="mt-2 max-w-prose text-sm text-ink-soft">
            Ontario supply is a moving window. Drag the month. Solid arcs are reefer trucks; dashed arcs are boats. Ring size follows this week’s AAFC origin mix when we have it.
          </p>
        </div>
        <div className="mt-4">
          <CropGrid value={cmd} onChange={setCmd} />
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
            d="Chile, Peru, New Zealand. Two to three weeks on the water. The importer already ate duty, inspection, and arrival quality. Do not compare their FOB to a Yakima carton."
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
