import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MONTH_LABELS,
  GTA,
  arcPath,
  lanesFor,
  namedPlace,
  project,
  storyFor,
  type Lane,
} from "@/lib/origin-geo";
import type { CommodityPlay, MarketSnap } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OriginMap({
  cmd,
  play,
  snap,
  originNote,
  compact,
}: {
  cmd: string;
  play: CommodityPlay | null | undefined;
  snap: MarketSnap | null;
  originNote?: string;
  compact?: boolean;
}) {
  const now = new Date().getMonth() + 1;
  const [month, setMonth] = useState(now);
  const lanes = useMemo(() => lanesFor(play, month, snap), [play, month, snap]);
  const named = namedPlace(originNote || "");
  const live = lanes.filter((l) => l.live);
  const dest = project(GTA.lon, GTA.lat);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            {MONTH_LABELS[month - 1]} lanes into the GTA
          </p>
          <p className="mt-1 max-w-prose text-sm text-ink-soft">{storyFor(lanes, month, cmd)}</p>
        </div>
        {!compact ? (
          <p className="text-xs text-ink-soft">Drag the month. Arcs = how the raw actually moves.</p>
        ) : (
          <Link to="/origins" className="text-sm text-rust no-underline">
            Open full source map
          </Link>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper">
        <svg
          viewBox="0 0 1000 520"
          className="h-auto w-full max-h-[420px]"
          role="img"
          aria-label={`Map of ${cmd} origins feeding the GTA in ${MONTH_LABELS[month - 1]}`}
        >
          <rect width="1000" height="520" fill="var(--color-paper)" />
          <Land />
          <text x="48" y="28" fill="var(--color-ink-soft)" fontSize="11">
            Americas — fruit, veg, and the truck
          </text>
          <rect x="848" y="368" width="140" height="132" rx="14" fill="var(--color-cream)" stroke="var(--color-line)" />
          <text x="864" y="388" fill="var(--color-ink-soft)" fontSize="10">
            NZ inset
          </text>

          {lanes.map((l) => (
            <path
              key={`arc-${l.id}-${l.when}`}
              d={arcPath(l)}
              fill="none"
              stroke={l.live ? "var(--color-rust)" : "var(--color-line)"}
              strokeWidth={l.live ? Math.max(1.4, 1.2 + l.mix * 6) : 1}
              strokeDasharray={l.mode === "boat" ? "6 5" : l.live ? undefined : "3 4"}
              opacity={l.live ? 0.85 : 0.35}
            />
          ))}

          {lanes.map((l) => (
            <Mark key={l.id + l.when} lane={l} named={named?.id === l.id} />
          ))}

          <circle cx={dest.x} cy={dest.y} r="8" fill="var(--color-ink)" />
          <text x={dest.x + 12} y={dest.y + 4} fill="var(--color-ink)" fontSize="12" fontWeight="600">
            GTA
          </text>
        </svg>
      </div>

      <div className="mt-3">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-10 text-ink-soft">{MONTH_LABELS[month - 1]}</span>
          <input
            type="range"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-11 flex-1"
            style={{ accentColor: "var(--color-ink)" }}
            aria-label="Month on the source map"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-5 bg-rust" /> in-season truck
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-5 border-t border-dashed border-rust" /> boat / counter-season
          </span>
          <span>Ring size = this week’s AAFC origin mix when we have it.</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Year clock — who is on</p>
        <div className="mt-2 grid grid-cols-6 gap-1 sm:grid-cols-12">
          {MONTH_LABELS.map((label, i) => {
            const m = i + 1;
            const on = lanes.some((l) => l.months.includes(m) && !l.process);
            const active = m === month;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setMonth(m)}
                className={cn(
                  "min-h-11 rounded-lg border px-1 py-2 text-center text-xs",
                  active ? "border-ink bg-ink text-paper" : on ? "border-line bg-cream" : "border-line bg-paper text-ink-soft",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {(live.length ? live : lanes).map((l) => (
          <li key={l.id + l.when} className="rounded-lg border border-line bg-cream p-3">
            <div className="flex items-baseline justify-between gap-2">
              <b className="text-sm">{l.label}</b>
              <span className="text-xs text-ink-soft">
                {l.mode === "boat" ? `${l.daysToGta}d sea` : l.daysToGta <= 1 ? "local" : `${l.daysToGta}d reefer`}
              </span>
            </div>
            <p className="text-xs text-ink-soft">
              {l.when} · {l.live ? "on the map this month" : l.process ? "process, not fresh" : "off-season"}
              {l.mix > 0 ? ` · ${Math.round(l.mix * 100)}% of this week’s AAFC quotes` : ""}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{l.why}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Mark({ lane, named }: { lane: Lane; named: boolean }) {
  const { x, y } = project(lane.lon, lane.lat);
  const r = 4 + (lane.live ? 3 : 0) + lane.mix * 10;
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={lane.live ? "var(--color-rust)" : "var(--color-cream)"}
        stroke={named ? "var(--color-ink)" : "var(--color-ink)"}
        strokeWidth={named ? 2.5 : 1}
        opacity={lane.live ? 1 : 0.55}
      />
      <text x={x + r + 4} y={y + 4} fill="var(--color-ink)" fontSize="11">
        {lane.label}
      </text>
    </g>
  );
}

function Land() {
  return (
    <g fill="var(--color-land)" stroke="var(--color-ink)" strokeOpacity="0.18" strokeWidth="1">
      <path d="M 90 70 C 140 40 220 36 310 48 C 410 62 520 70 600 96 C 650 110 690 150 700 200 C 708 250 680 280 630 286 C 560 294 500 270 430 278 C 370 286 330 320 300 350 C 270 378 220 390 170 370 C 120 350 80 300 70 230 C 62 170 70 110 90 70 Z" />
      <path d="M 300 350 C 330 360 360 390 350 430 C 340 460 300 470 270 450 C 240 430 250 390 270 370 C 280 358 290 352 300 350 Z" />
      <path d="M 350 430 C 372 448 392 472 404 498 C 388 502 366 488 352 464 Z" />
      <path d="M 418 368 C 455 382 488 430 498 490 C 492 545 468 590 442 602 C 416 584 400 530 396 472 C 394 424 400 380 418 368 Z" />
    </g>
  );
}
