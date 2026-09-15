import { fmt, fromCadKg } from "@/lib/compass";
import { compareHit, deskFx } from "@/lib/desk-compare";
import { fmtPct } from "@/lib/desk-filter";
import { useDesk } from "@/lib/desk-store";
import { cn } from "@/lib/utils";

export function DeltaLine({
  cmd,
  currentCadKg,
  layer,
  compact,
}: {
  cmd: string;
  currentCadKg: number | null | undefined;
  layer?: string;
  compact?: boolean;
}) {
  const compare = useDesk((s) => s.compare);
  const unit = useDesk((s) => s.unit);
  const hit = compareHit(cmd, currentCadKg, compare, layer);
  if (!hit) return null;
  const up = (hit.pct || 0) > 0;
  const abs =
    hit.cadKgAbs == null
      ? null
      : `${hit.cadKgAbs > 0 ? "+" : "−"}$${fmt(fromCadKg(Math.abs(hit.cadKgAbs), unit, deskFx()))}`;
  return (
    <p
      className={cn(
        "tabular-nums",
        compact ? "text-xs" : "text-sm",
        hit.pct == null ? "text-ink-soft" : up ? "text-rich" : "text-moss",
      )}
    >
      {fmtPct(hit.pct)} {hit.label}
      {!compact && abs ? ` · ${abs}` : ""}
      {compact ? null : <span className="ml-1 font-sans font-normal text-ink-soft">· {hit.note}</span>}
    </p>
  );
}
