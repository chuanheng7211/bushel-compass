import { createFileRoute } from "@tanstack/react-router";
import { Freshness } from "@/components/freshness";
import { OrderDesk } from "@/components/order-desk";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/order")({
  component: OrderPage,
});

function OrderPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <SiteHeader kicker="Public dest vs a held-out delivered book. The raw list is not on this site." />
      <section className="px-4 pt-6 sm:px-9">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          How accurate is the public tape?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Same-week Vancouver dest vs a delivered foodservice book, 3–9 May 2026. We keep crop ratios, not SKUs. Item uses farm, dest, grocery, and listed names. Paste stays in this session.
        </p>
        <div className="mt-2">
          <Freshness />
        </div>
      </section>
      <section className="px-4 py-6 sm:px-9">
        <OrderDesk />
      </section>
    </div>
  );
}
