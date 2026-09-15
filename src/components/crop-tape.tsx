import { Link } from "@tanstack/react-router";
import { cropTapeFor, fmtChg, fmtPx, namesForCrop, chgTone } from "@/lib/markets";
import { cn } from "@/lib/utils";

export function CropTape({ crop }: { crop: string }) {
  const tape = cropTapeFor(crop);
  const names = namesForCrop(crop);
  if (!names.length) return null;

  return (
    <section className="rounded-xl border border-line bg-cream p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Listed weather · {crop}</h2>
        <Link
          to="/markets"
          search={{ crop }}
          className="text-sm text-rust no-underline hover:underline"
        >
          Full tape
        </Link>
      </div>
      <p className="mt-1 text-xs text-ink-soft">{tape.read}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {names.map((n) => (
          <li key={n.symbol} className="rounded-lg border border-line px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium">{n.symbol}</span>
              <span className={cn("text-xs tabular-nums", chgTone(n.chgPct))}>{fmtChg(n.chgPct)}</span>
            </div>
            <div className="font-display text-lg leading-tight tabular-nums">{fmtPx(n)}</div>
            <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{n.means}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
