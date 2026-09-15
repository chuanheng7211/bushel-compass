import type { ReactNode } from "react";
import { ArrowLeftRight, CalendarRange, Scale } from "lucide-react";
import {
  COMPARE_OPTS,
  PERIOD_OPTS,
  UNIT_OPTS,
  compareShort,
  periodShort,
  unitTag,
  type Compare,
  type Period,
} from "@/lib/desk-filter";
import { useDesk } from "@/lib/desk-store";
import type { Unit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DeskFilter() {
  const period = useDesk((s) => s.period);
  const compare = useDesk((s) => s.compare);
  const unit = useDesk((s) => s.unit);
  const setPeriod = useDesk((s) => s.setPeriod);
  const setCompare = useDesk((s) => s.setCompare);
  const setUnit = useDesk((s) => s.setUnit);

  return (
    <div className="px-4 py-2 sm:px-9">
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <MobileSelect
          label="Period"
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          opts={PERIOD_OPTS}
        />
        <MobileSelect
          label="Compare"
          value={compare}
          onChange={(v) => setCompare(v as Compare)}
          opts={COMPARE_OPTS}
        />
        <MobileSelect
          label="Unit"
          value={unit}
          onChange={(v) => setUnit(v as Unit)}
          opts={UNIT_OPTS}
        />
      </div>

      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
        <ChipRow icon={CalendarRange} label="Period">
          {PERIOD_OPTS.map((o) => (
            <Chip key={o.id} on={period === o.id} onClick={() => setPeriod(o.id)} title={o.hint}>
              {o.label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow icon={ArrowLeftRight} label="Compare">
          {COMPARE_OPTS.map((o) => (
            <Chip key={o.id} on={compare === o.id} onClick={() => setCompare(o.id)} title={o.hint}>
              {o.label}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow icon={Scale} label="Unit">
          {UNIT_OPTS.map((o) => (
            <Chip key={o.id} on={unit === o.id} onClick={() => setUnit(o.id)} title={o.hint}>
              {o.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        {periodShort(period)} · {compareShort(compare)} · {unitTag(unit)}. Listed names on Markets stay in their pit unit.
      </p>
    </div>
  );
}

function ChipRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarRange;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-lg border px-3 text-sm transition-colors duration-150",
        on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
      )}
    >
      {children}
    </button>
  );
}

function MobileSelect({
  label,
  value,
  onChange,
  opts,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opts: { id: string; label: string }[];
}) {
  return (
    <label className="block min-w-0 text-xs font-medium uppercase tracking-wide text-ink-soft">
      {label}
      <select
        className="mt-1 min-h-11 w-full rounded-lg border border-line bg-cream px-2 text-sm font-normal normal-case tracking-normal text-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
