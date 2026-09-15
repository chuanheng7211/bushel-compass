import { Pause, Play } from "lucide-react";
import {
  COUNTRY_FILL,
  MONTH_LABELS,
  beltRows,
  calendarCountries,
  clockByMonth,
  countryOfPlace,
  districtMix,
  handoffStory,
  handoffWindows,
  tapeVsClock,
  type Lane,
} from "@/lib/origin-geo";
import type { MarketSnap } from "@/lib/types";
import { cn } from "@/lib/utils";

export function YearRail({
  lanes,
  month,
  onMonth,
  playing,
  onPlay,
  picked,
  onPick,
  cmd,
}: {
  lanes: Lane[];
  month: number;
  onMonth: (m: number) => void;
  playing: boolean;
  onPlay: () => void;
  picked?: string | null;
  onPick?: (id: string | null) => void;
  cmd: string;
}) {
  const rows = beltRows(lanes);
  const handoffs = handoffWindows(rows);
  const overlap = new Set(handoffs.flatMap((h) => h.months));
  const story = handoffStory(rows, month, cmd);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg">Year clock — who hands off to whom</h3>
          <p className="text-xs text-ink-soft">
            Fill is in-season. Hatch months are overlap. Play the year to watch the country change.
          </p>
        </div>
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-ink bg-ink px-3 text-sm text-paper"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause the year" : "Play the year"}
        </button>
      </div>

      <p className="mt-3 rounded-xl border border-line bg-cream px-3 py-2 text-sm" aria-live="polite">
        <b>{story.title}.</b> {story.text}
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-cream">
        <div className="min-w-[720px] p-3">
          <div
            className="grid gap-y-1"
            style={{ gridTemplateColumns: "9rem repeat(12, minmax(0, 1fr))" }}
          >
            <div />
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1;
              const on = m === month;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onMonth(m)}
                  className={cn(
                    "min-h-11 rounded-md text-center text-xs font-medium",
                    on ? "bg-ink text-paper" : overlap.has(m) ? "bg-warn-soft text-warn" : "text-ink-soft",
                  )}
                >
                  {label}
                </button>
              );
            })}
            {rows.map((row) => {
              const pickedOn = picked === row.id;
              return (
                <Row
                  key={`${row.id}-${row.process ? "p" : "f"}`}
                  row={row}
                  month={month}
                  overlap={overlap}
                  picked={pickedOn}
                  onMonth={onMonth}
                  onPick={() => onPick?.(pickedOn ? null : row.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  row,
  month,
  overlap,
  picked,
  onMonth,
  onPick,
}: {
  row: ReturnType<typeof beltRows>[number];
  month: number;
  overlap: Set<number>;
  picked: boolean;
  onMonth: (m: number) => void;
  onPick: () => void;
}) {
  const { code } = countryOfPlace(row);
  const fill = COUNTRY_FILL[code] || "var(--color-land)";
  return (
    <>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "truncate pr-2 text-left text-xs",
          picked ? "font-medium text-ink" : "text-ink-soft",
        )}
      >
        {row.label}
        {row.process ? <span className="ml-1 text-ink-soft">· plant</span> : null}
      </button>
      {MONTH_LABELS.map((_, i) => {
        const m = i + 1;
        const on = row.months.includes(m) && !row.process;
        const plant = row.process && row.months.includes(m);
        const here = m === month;
        const hand = on && overlap.has(m);
        return (
          <button
            key={m}
            type="button"
            onClick={() => onMonth(m)}
            aria-label={`${row.label} ${MONTH_LABELS[i]}`}
            className={cn("h-8 rounded-sm border border-transparent", here && "ring-1 ring-ink")}
            style={{
              background: plant
                ? "var(--color-line)"
                : on
                  ? fill
                  : "transparent",
              opacity: on ? (hand ? 0.7 : picked || row.live ? 1 : 0.85) : 0.12,
              backgroundImage: hand
                ? "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,253,248,0.45) 3px, rgba(255,253,248,0.45) 6px)"
                : undefined,
            }}
          />
        );
      })}
    </>
  );
}

export function CountryClock({ lanes, month, onMonth }: { lanes: Lane[]; month: number; onMonth: (m: number) => void }) {
  const rows = beltRows(lanes);
  const clock = clockByMonth(rows);
  const max = Math.max(1, ...clock.map((c) => c.total));
  const codes = [...new Set(clock.flatMap((c) => Object.keys(c.by)))];
  return (
    <div>
      <h3 className="font-display text-lg">How the country of origin walks</h3>
      <p className="text-xs text-ink-soft">
        Each column is the in-season belt that month. Height is how many named districts are on. Color is country.
      </p>
      <div className="mt-3 flex items-end gap-1">
        {clock.map((c) => {
          const here = c.m === month;
          return (
            <button
              key={c.m}
              type="button"
              onClick={() => onMonth(c.m)}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col justify-end rounded-md",
                here ? "ring-1 ring-ink" : "",
              )}
              aria-label={`${c.label} origin mix`}
            >
              <div className="flex h-28 w-full flex-col-reverse overflow-hidden rounded-sm">
                {codes.map((code) => {
                  const n = c.by[code] || 0;
                  if (!n) return null;
                  return (
                    <div
                      key={code}
                      style={{
                        height: `${(n / max) * 100}%`,
                        background: COUNTRY_FILL[code] || "var(--color-land)",
                      }}
                      title={`${c.label} ${code}: ${n}`}
                    />
                  );
                })}
              </div>
              <span className={cn("mt-1 text-center text-xs", here ? "font-medium text-ink" : "text-ink-soft")}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
        {codes.map((code) => (
          <li key={code} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ background: COUNTRY_FILL[code] || "var(--color-land)" }}
            />
            {code}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OriginMix({
  lanes,
  month,
  snap,
}: {
  lanes: Lane[];
  month: number;
  snap: MarketSnap | null;
}) {
  const rows = beltRows(lanes);
  const tape = districtMix(snap);
  const cal = calendarCountries(rows, month);
  const vs = tapeVsClock(lanes, month, snap);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <article className="rounded-xl border border-line bg-cream p-4">
        <h3 className="font-display text-lg">This week’s AAFC mix</h3>
        <p className="text-xs text-ink-soft">
          Destination quotes, not FOB. {snap?.asof ? `Week of ${snap.asof}.` : "No sheet this week."}
        </p>
        {tape.length ? (
          <ul className="mt-3 space-y-2">
            {tape.map((t) => (
              <li key={t.code}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{t.district || t.code}</span>
                  <span className="tabular-nums text-ink-soft">{Math.round(t.share * 100)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: `${Math.max(4, t.share * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No origin mix on this week’s city sheet.</p>
        )}
      </article>
      <article className="rounded-xl border border-line bg-cream p-4">
        <h3 className="font-display text-lg">Calendar this month</h3>
        <p className="text-xs text-ink-soft">Who the seasonal clock says should be shipping.</p>
        {cal.length ? (
          <ul className="mt-3 space-y-2">
            {cal.map((t) => (
              <li key={t.code}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span>{t.name}</span>
                  <span className="tabular-nums text-ink-soft">{t.n} district{t.n === 1 ? "" : "s"}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, t.share * 100)}%`,
                      background: COUNTRY_FILL[t.code] || "var(--color-ink)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No fresh window stored for this month.</p>
        )}
        <p className="mt-3 text-sm text-ink-soft">{vs.note}</p>
      </article>
    </div>
  );
}
