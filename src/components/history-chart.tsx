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
import type { MonthlyPt } from "@/lib/types";

export function HistoryChart({
  hist,
  quoteCadKg,
}: {
  hist: MonthlyPt[];
  quoteCadKg: number;
}) {
  const recent = hist.slice(-60).map((h) => ({
    m: h.d.slice(0, 7),
    farm: Number(h.cadKg.toFixed(2)),
    quote: Number(quoteCadKg.toFixed(2)),
  }));
  if (!recent.length) {
    return <p className="text-sm text-ink-soft">No NASS history for this series.</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={recent} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#ddd6c8" vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#5c655e" }} minTickGap={28} />
          <YAxis
            tick={{ fontSize: 11, fill: "#5c655e" }}
            tickFormatter={(v: number) => `$${v}`}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(2)}/kg`, ""]}
            contentStyle={{
              background: "#fffdf8",
              border: "1px solid #ddd6c8",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="farm"
            name="Farm gate CAD/kg"
            stroke="#14201a"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="quote"
            name="Your quote"
            stroke="#c45c26"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
