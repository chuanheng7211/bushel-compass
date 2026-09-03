import { Link } from "@tanstack/react-router";

export function SiteHeader({ kicker }: { kicker?: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-9">
      <Link to="/" className="flex items-center gap-3 text-ink no-underline">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-display text-lg text-paper">
          B
        </span>
        <span>
          <span className="block font-display text-xl leading-tight">Bushel Compass</span>
          <span className="block text-sm text-ink-soft">
            {kicker || "Quote → farm gate → FOB → freight → market"}
          </span>
        </span>
      </Link>
      <nav className="flex max-w-full flex-wrap gap-2">
        <Link
          to="/"
          className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-medium text-ink no-underline sm:px-4 sm:text-sm"
          activeProps={{ className: "rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper no-underline sm:px-4 sm:text-sm" }}
        >
          Compass
        </Link>
        <Link
          to="/origins"
          className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-medium text-ink no-underline sm:px-4 sm:text-sm"
          activeProps={{ className: "rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper no-underline sm:px-4 sm:text-sm" }}
        >
          Source map
        </Link>
        <Link
          to="/board"
          className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-medium text-ink no-underline sm:px-4 sm:text-sm"
          activeProps={{ className: "rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper no-underline sm:px-4 sm:text-sm" }}
        >
          Dashboard
        </Link>
        <Link
          to="/world"
          className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-medium text-ink no-underline sm:px-4 sm:text-sm"
          activeProps={{ className: "rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper no-underline sm:px-4 sm:text-sm" }}
        >
          World
        </Link>
        <Link
          to="/industry"
          className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-medium text-ink no-underline sm:px-4 sm:text-sm"
          activeProps={{ className: "rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper no-underline sm:px-4 sm:text-sm" }}
        >
          Industry brief
        </Link>
      </nav>
    </header>
  );
}
