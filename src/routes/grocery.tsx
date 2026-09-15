import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GroceryDesk } from "@/components/grocery-desk";
import { StoryDesk } from "@/components/story-desk";
import { Freshness } from "@/components/freshness";
import { SiteHeader } from "@/components/site-header";
import { toCadKg } from "@/lib/compass";
import { useDeskMoney } from "@/lib/desk-money";
import { groceryCatalog, groceryGaps, type BannerId } from "@/lib/grocery";
import { ANGLES, type AngleId } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/grocery")({ component: GroceryPage });

function GroceryPage() {
  const crops = useMemo(() => groceryCatalog(), []);
  const gaps = useMemo(() => groceryGaps(6), []);
  const [cmd, setCmd] = useState("Apples");
  const [ticket, setTicket] = useState("");
  const [store, setStore] = useState("");
  const [banner, setBanner] = useState<BannerId>("discount");
  const [angle, setAngle] = useState<AngleId>("markup");
  const { cad, unit, fx } = useDeskMoney();
  const ticketN = Number(ticket);
  const ticketCad =
    ticket.trim() && Number.isFinite(ticketN) && ticketN > 0 ? toCadKg(ticketN, unit, fx) : null;
  const cmdSafe = crops.includes(cmd) ? cmd : crops[0] || "Apples";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Shelf ticket vs warehouse / grocery / farm stand — and a post you can copy." />

      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          The ticket on the shelf is not the farm.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Type the price you saw. We bench it against public farm-gate, Vancouver wholesale, the BLS grocery average, and typical GTA store-format markups. Shoppers see where the deal is. Owners see a pricing window. Then copy a caption for Instagram or 小红书.
        </p>
        <div className="mt-2">
          <Freshness />
        </div>
      </section>

      <section className="px-4 pt-5 sm:px-9">
        <h2 className="font-display text-xl">Fattest grocery vs the grower</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Conventional shelf (or BLS) divided by USDA farm-gate. A high multiple is margin, shrink, and sometimes process-grade farm stock — not a flyer.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {gaps.map((g) => {
            const on = g.cmd === cmdSafe;
            return (
              <li key={g.cmd}>
                <button
                  type="button"
                  onClick={() => setCmd(g.cmd)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-3 text-left",
                    on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                  )}
                >
                  <span className="font-medium">{g.cmd}</span>
                  <span className={cn("text-sm tabular-nums", on ? "opacity-80" : "text-rich")}>
                    {g.multiple.toFixed(1)}× farm
                  </span>
                  <span className={cn("text-xs", on ? "opacity-70" : "text-ink-soft")}>
                    {cad(g.farm)} → {cad(g.shelf)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 pt-5 sm:px-9">
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max flex-nowrap gap-2">
          {crops.map((label) => {
            const on = label === cmdSafe;
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
        </div>
      </section>

      <section className="px-4 py-6 sm:px-9">
        <GroceryDesk
          cmd={cmdSafe}
          ticket={ticket}
          store={store}
          banner={banner}
          onTicket={setTicket}
          onStore={setStore}
          onBanner={setBanner}
        />
      </section>

      <section className="border-t border-line px-4 py-6 sm:px-9">
        <h2 className="font-display text-2xl">Posts you can actually make</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Each card loads the caption desk. English for Instagram, Chinese for 小红书. Same numbers, two audiences.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {ANGLES.map((a) => {
            const on = a.id === angle;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setAngle(a.id)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start rounded-xl border p-4 text-left",
                    on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                  )}
                >
                  <span className="text-xs uppercase tracking-wide opacity-70">{a.label}</span>
                  <span className="mt-1 font-display text-lg leading-tight">{a.play}</span>
                  <span className={cn("mt-2 text-sm", on ? "opacity-80" : "text-ink-soft")}>{a.job}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <StoryDesk
            cmd={cmdSafe}
            ticketCadKg={ticketCad}
            store={store}
            banner={banner}
            angle={angle}
            onAngle={setAngle}
          />
        </div>
      </section>
    </div>
  );
}
