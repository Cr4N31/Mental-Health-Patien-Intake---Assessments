import { useState } from "react";
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

const ranges = [
  ["1h", "1 hour"],
  ["5h", "5 hours"],
  ["24h", "24 hours"],
  ["3m", "3 months"],
  ["12m", "12 months"],
];

function tickLabel(value, range) {
  const date = new Date(value);
  if (range === "1h" || range === "5h") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (range === "24h") return date.toLocaleTimeString([], { hour: "numeric" });
  if (range === "12m") return date.toLocaleDateString([], { month: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AdminTrendChart({
  title,
  description,
  buckets,
  range,
  onRangeChange,
  series,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const active = buckets[activeIndex];

  return (
    <section className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-dark">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {ranges.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => {
                setActiveIndex(-1);
                onRangeChange(value);
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                range === value
                  ? "border-brand-dark bg-brand-dark text-white"
                  : "border-line text-ink hover:bg-page"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {buckets.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">No data for this period.</p>
      ) : (
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={buckets}
              margin={{ top: 8, right: 12, bottom: 4, left: -12 }}
              onMouseMove={(event) => {
                if (typeof event.activeTooltipIndex === "number") {
                  setActiveIndex(event.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <CartesianGrid stroke="#cfdad6" strokeDasharray="3 4" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => tickLabel(value, range)}
                minTickGap={24}
                tick={{ fill: "#5b706b", fontSize: 12 }}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#5b706b", fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                contentStyle={{ borderColor: "#cfdad6", borderRadius: 8 }}
              />
              <Legend />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.label}
                  stroke={item.color}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {active && (
        <p className="mt-1 text-xs text-muted">
          {new Date(active.date).toLocaleString()}
        </p>
      )}
    </section>
  );
}
