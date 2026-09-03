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
import type { ForecastPt, WeekPt } from "@/lib/types";

export function OutlookChart({
  hist,
  forecast,
  quote,
}: {
  hist: WeekPt[];
  forecast: ForecastPt[];
  quote?: number;
}) {
  const past = hist.slice(-26).map((h) => ({
    d: h.d.slice(5),
    ask: h.p50,
    quote,
  }));
  const fut = forecast.map((f) => ({
    d: f.d.slice(5),
    mid: f.p,
    lo: f.lo,
    hi: f.hi,
    quote,
  }));
  const data = [...past, ...fut];
  if (!data.length) {
    return <p className="text-sm text-ink-soft">No weekly wholesale series for this city and item.</p>;
  }
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="d" tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }} minTickGap={22} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-ink-soft)" }}
            tickFormatter={(v: number) => `$${v}`}
            width={44}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(2)}/kg`, ""]}
            contentStyle={{
              background: "var(--color-cream)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="ask" name="Weekly ask" stroke="var(--color-ink)" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="mid" name="8-week outlook" stroke="var(--color-rust)" strokeWidth={1.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="lo" name="Outlook low" stroke="var(--color-ink-soft)" strokeDasharray="3 3" strokeWidth={1} dot={false} connectNulls />
          <Line type="monotone" dataKey="hi" name="Outlook high" stroke="var(--color-ink-soft)" strokeDasharray="3 3" strokeWidth={1} dot={false} connectNulls />
          {quote != null ? (
            <Line type="monotone" dataKey="quote" name="Your quote" stroke="var(--color-moss)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
