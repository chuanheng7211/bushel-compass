import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { sliceByPeriod } from "@/lib/desk-filter";
import { useDeskMoney } from "@/lib/desk-money";
import type { MonthlyPt } from "@/lib/types";

export function HistoryChart({
  hist,
  quoteCadKg,
}: {
  hist: MonthlyPt[];
  quoteCadKg: number;
}) {
  const { period, num, tag, periodLabel } = useDeskMoney();
  const recent = sliceByPeriod(hist, period, 12).map((h) => ({
    m: h.d.slice(0, 7),
    farm: num(h.cadKg),
    quote: num(quoteCadKg),
  }));
  if (!recent.length) {
    return <p className="text-sm text-ink-soft">No NASS history for this series.</p>;
  }
  return (
    <div>
      <p className="mb-1 text-xs text-ink-soft">Farm gate · {periodLabel} · {tag}</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={recent} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} minTickGap={28} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
              tickFormatter={(v: number) => `$${v}`}
              width={48}
            />
            <Tooltip
              formatter={(v) => [`$${Number(v).toFixed(2)} ${tag}`, ""]}
              contentStyle={{
                background: "var(--color-cream)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="farm"
              name={`Farm gate ${tag}`}
              stroke="var(--color-ink)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="quote"
              name="Your quote"
              stroke="var(--color-rust)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
