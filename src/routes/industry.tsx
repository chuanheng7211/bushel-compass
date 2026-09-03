import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { layersFile } from "@/lib/layers-data";

export const Route = createFileRoute("/industry")({ component: Industry });

const HARD = [
  {
    t: "USDA is a lagging average",
    d: "NASS prices received are national, monthly, all grades mashed. AMS terminals are yesterday’s talk. AAFC Vancouver is an asking book, not Toronto cleared trades.",
  },
  {
    t: "The SKU is not the commodity",
    d: "Greenhouse cluster tomatoes, Florida mature-greens, and California paste are three businesses. If the tool says tomatoes $1.34/kg farm and you buy vine-ripe, you will lose money.",
  },
  {
    t: "Credit and law sit outside the chart",
    d: "PACA in the US, CFIA and payment terms in Canada, FSMA 204 lot tracking. A mid-size wholesaler is looking at $50–500k just to stay legal.",
  },
  {
    t: "Owning the middle is getting harder",
    d: "The middle is consolidating. A new firm that tries to be farm + pack + truck + desk + plant copies a 1990s Dole deck the majors are no longer writing.",
  },
  {
    t: "Nobody pays for another USDA wrapper",
    d: "Harman, AgriMarketTracker, ProduceIQ already wrap AMS. The paid job is the decision: is this quote a layer I should rent, or a layer I should staff?",
  },
];

const KEEP = [
  {
    t: "A common language",
    d: "Farm, packed FOB, landed GTA, wholesale ask, retail. Forcing the basis onto every quote is the whole product on day one.",
  },
  {
    t: "A floor the broker does not own",
    d: "Public history is the shape of the year. July strawberries are always a different market than March.",
  },
  {
    t: "A kill-switch for bad integration",
    d: "If the farm-to-wholesale gap, after shrink, takes seven years to pay for a cooler, the tool should say rent.",
  },
  {
    t: "Channel shopping, not patriotism",
    d: "The fair price is the cheapest landed spec that will still pass CFIA — not the story of a single origin.",
  },
  {
    t: "Processed vs fresh as a hard split",
    d: "A juice apple and an extra-fancy Honeycrisp do not share a bench.",
  },
];

function Industry() {
  const layers = layersFile;

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="What this tool can do to the industry — and what it must not pretend to do." />
      <section className="px-4 py-8 sm:px-9">
        <h1 className="max-w-4xl font-display text-4xl leading-tight sm:text-5xl">
          A price site does not vertically integrate produce.
        </h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Vertical integration here means trucks, coolers, credit, and fruit that dies in four days.
          The useful product is a shared ruler so a new desk can see which layer is expensive enough to own, and which layer is a building they should not buy.
        </p>
      </section>
      <section className="grid gap-4 px-4 pb-10 sm:px-9 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-cream p-5">
          <h2 className="font-display text-xl">The uncomfortable parts</h2>
          <div className="mt-3 space-y-3">
            {HARD.map((x) => (
              <div key={x.t} className="rounded-lg border border-line p-3">
                <h3 className="font-medium">{x.t}</h3>
                <p className="text-sm text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-cream p-5">
          <h2 className="font-display text-xl">Where it still earns its keep</h2>
          <div className="mt-3 space-y-3">
            {KEEP.map((x) => (
              <div key={x.t} className="rounded-lg border border-line p-3">
                <h3 className="font-medium">{x.t}</h3>
                <p className="text-sm text-ink-soft">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {layers ? (
        <section className="px-4 pb-10 sm:px-9">
          <h2 className="font-display text-2xl">Who this helps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {layers.whoBenefits.map((w) => (
              <div key={w.who} className="rounded-xl border border-line bg-cream p-4">
                <h3 className="font-medium">{w.who}</h3>
                <p className="text-sm text-ink-soft">{w.get}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">{layers.disclaimer}</p>
        </section>
      ) : null}
      <section className="max-w-3xl px-4 pb-16 sm:px-9">
        <h2 className="font-display text-2xl">How this could actually move the industry</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-ink-soft">
          <li>
            <b className="text-ink">Standardize the quote.</b> Commodity, form, origin, pack, and basis on every number.
          </li>
          <li>
            <b className="text-ink">Publish the stack, not a single market price.</b> Farm / FOB / freight / wholesale / retail.
          </li>
          <li>
            <b className="text-ink">Default to rent.</b> Own a layer only when volume you already sell pays the capex inside a few years.
          </li>
          <li>
            <b className="text-ink">Co-pack before plants. Importer before crossings. Brokered trucks before a fleet.</b>
          </li>
          <li>
            <b className="text-ink">Stay out of the daily print war.</b> AMS and AAFC are the tape. Bushel is the interpretation layer.
          </li>
        </ol>
      </section>
    </div>
  );
}
