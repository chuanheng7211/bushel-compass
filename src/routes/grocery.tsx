import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { GroceryDesk } from "@/components/grocery-desk";
import { JobStrip } from "@/components/job-strip";
import { StoryDesk } from "@/components/story-desk";
import { Freshness } from "@/components/freshness";
import { SiteHeader } from "@/components/site-header";
import { toCadKg } from "@/lib/compass";
import { useDeskMoney } from "@/lib/desk-money";
import { groceryCatalog, groceryGaps, type BannerId } from "@/lib/grocery";
import { parseGrocerySearch, SAMPLE_TICKET, type GrocerySearch } from "@/lib/jobs";
import { ANGLES, type AngleId } from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/grocery")({
  validateSearch: (s: Record<string, unknown>): GrocerySearch => parseGrocerySearch(s),
  component: GroceryPage,
});

function GroceryPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const crops = useMemo(() => groceryCatalog(), []);
  const gaps = useMemo(() => groceryGaps(6), []);
  const cmd = search.cmd && crops.includes(search.cmd) ? search.cmd : crops[0] || "Apples";
  const ticket = search.ticket || "";
  const store = search.store || "";
  const banner: BannerId = search.banner || "discount";
  const angle: AngleId = search.angle || "markup";
  const { cad, unit, fx } = useDeskMoney();
  const ticketN = Number(ticket);
  const ticketCad =
    ticket.trim() && Number.isFinite(ticketN) && ticketN > 0 ? toCadKg(ticketN, unit, fx) : null;
  const weekPost = gaps[0];

  function patch(next: GrocerySearch) {
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Farm · wholesale · BLS grocery · modeled GTA shelf bands." />

      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Farm gate, wholesale, grocery average — one ladder.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          USDA NASS farm, AAFC Vancouver ask, BLS city-average retail, and typical GTA store-format markups on that ask. Type a ticket to bench what you saw. Captions live at the bottom of this page — they are not the tape.
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
            const on = g.cmd === cmd;
            return (
              <li key={g.cmd}>
                <Link
                  to="/grocery"
                  search={(prev) => ({ ...prev, cmd: g.cmd })}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-3 text-left no-underline",
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
                </Link>
              </li>
            );
          })}
        </ul>
        {weekPost ? (
          <p className="mt-3 text-sm text-ink-soft">
            Widest multiple on this file: {weekPost.cmd} {weekPost.multiple.toFixed(1)}× farm ({cad(weekPost.farm)} → {cad(weekPost.shelf)}). A high ratio is margin, shrink, and sometimes process-grade NASS stock — not a flyer.
          </p>
        ) : null}
      </section>

      <section className="px-4 pt-5 sm:px-9">
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max flex-nowrap gap-2">
            {crops.map((label) => {
              const on = label === cmd;
              return (
                <Link
                  key={label}
                  to="/grocery"
                  search={(prev) => ({ ...prev, cmd: label })}
                  className={cn(
                    "min-h-11 shrink-0 rounded-xl border px-3 py-2 text-sm no-underline",
                    on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-9">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => patch(SAMPLE_TICKET)}
            className="min-h-11 rounded-xl border border-line bg-cream px-3 py-2 text-sm"
          >
            Try $6.49 at No Frills Queen
          </button>
          <p className="text-xs text-ink-soft">Prefills a discount ticket so you can see the ladder. Overwrite with what you actually saw.</p>
        </div>
        <GroceryDesk
          cmd={cmd}
          ticket={ticket}
          store={store}
          banner={banner}
          onTicket={(v) => patch({ ticket: v })}
          onStore={(v) => patch({ store: v })}
          onBanner={(v) => patch({ banner: v })}
        />
      </section>

      <section id="post-desk" className="border-t border-line px-4 py-6 sm:px-9">
        <JobStrip active={search.job} kicker="Captions from these prints — not the main desk" />
        <h2 className="mt-6 font-display text-2xl">Posts you can actually make</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Optional. English for Instagram, Chinese for 小红书. Same numbers as the ladder above. The URL holds the crop, ticket, and angle.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {ANGLES.map((a) => {
            const on = a.id === angle;
            return (
              <li key={a.id}>
                <Link
                  to="/grocery"
                  search={(prev) => ({ ...prev, angle: a.id, job: "poster" })}
                  hash="post-desk"
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start rounded-xl border p-4 text-left no-underline",
                    on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                  )}
                >
                  <span className="text-xs uppercase tracking-wide opacity-70">{a.label}</span>
                  <span className="mt-1 font-display text-lg leading-tight">{a.play}</span>
                  <span className={cn("mt-2 text-sm", on ? "opacity-80" : "text-ink-soft")}>{a.job}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <StoryDesk
            cmd={cmd}
            ticketCadKg={ticketCad}
            store={store}
            banner={banner}
            angle={angle}
            onAngle={(id) => patch({ angle: id, job: "poster" })}
          />
        </div>
      </section>
    </div>
  );
}
