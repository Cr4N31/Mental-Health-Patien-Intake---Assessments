import { useMemo, useState } from "react";
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
import {
  FORM_INFO,
  FORM_TYPES,
  severityLabel,
  formatDate,
} from "../lib/assessmentInfo.js";

// Change these colors to match your theme. The second line is also dashed so
// the two can be told apart without relying on color.
const SERIES = {
  PHQ9: { color: "var(--color-brand, #2f6f62)", dash: undefined },
  GAD7: { color: "#b7791f", dash: "6 4" },
};

const TICKS = {
  PHQ9: [0, 5, 10, 15, 20, 27],
  GAD7: [0, 5, 10, 15, 21],
};

const DAY = 24 * 60 * 60 * 1000;

const shortDate = (t) =>
  new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const entries = payload.filter((p) => p.value != null);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2 text-sm shadow">
      <p className="font-medium">{formatDate(row.t)}</p>
      {entries.map((p) => (
        <p key={p.dataKey} className="text-muted">
          {FORM_INFO[p.dataKey].name}: {p.value} / {FORM_INFO[p.dataKey].max}
          {" ("}
          {severityLabel(row[`${p.dataKey}_sev`])}
          {")"}
        </p>
      ))}
    </div>
  );
}

export default function ProgressChart({ items }) {
  const [type, setType] = useState("PHQ9");
  const [compare, setCompare] = useState(false);

  // One row per assessment, oldest first. Each row has a value for its own
  // form only, so both lines can share one time axis.
  const rows = useMemo(
    () =>
      items
        .map((a) => ({
          t: new Date(a.completedAt).getTime(),
          [a.type]: a.totalScore,
          [`${a.type}_sev`]: a.severity,
        }))
        .sort((a, b) => a.t - b.t),
    [items],
  );

  const visible = compare ? FORM_TYPES : [type];
  const data = rows.filter((r) => visible.some((k) => r[k] != null));

  const min = data.length ? data[0].t : Date.now();
  const max = data.length ? data[data.length - 1].t : Date.now();
  const pad = Math.max(DAY, (max - min) * 0.05);
  const xDomain = [min - pad, max + pad];

  const yTicks = compare || type === "PHQ9" ? TICKS.PHQ9 : TICKS.GAD7;
  const yMax = yTicks[yTicks.length - 1];

  const emptyText = compare
    ? "No results yet. Take a check-in to start your chart."
    : `No ${FORM_INFO[type].name} results yet. Take a check-in to start your chart.`;

  return (
    <section className="mt-10 rounded-lg border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">
          Your progress
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label="Questionnaire"
            className={`inline-flex overflow-hidden rounded-md border border-line ${
              compare ? "opacity-50" : ""
            }`}
          >
            {FORM_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                disabled={compare}
                aria-pressed={!compare && type === t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-sm ${
                  !compare && type === t
                    ? "bg-brand text-white"
                    : "bg-paper hover:bg-line/40"
                }`}
              >
                {FORM_INFO[t].name}
              </button>
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => setCompare((c) => !c)}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className={`relative h-6 w-11 rounded-full transition-colors ${
                compare ? "bg-brand" : "bg-line"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  compare ? "left-[22px]" : "left-0.5"
                }`}
              />
            </span>
            Compare both
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted">
        A lower score means fewer symptoms.
        {compare ? " Both questionnaires use the same 0 to 27 scale here." : ""}
      </p>

      {data.length === 0 ? (
        <p className="mt-8 text-muted">{emptyText}</p>
      ) : (
        <div
          role="img"
          aria-label={`Line chart of your ${visible
            .map((k) => FORM_INFO[k].name)
            .join(" and ")} scores over time`}
          className="mt-4 h-72 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-line, #e5e5e5)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={xDomain}
                tickFormatter={shortDate}
                tickCount={5}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              {compare && <Legend verticalAlign="top" height={28} />}
              {visible.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={`${FORM_INFO[k].name} (${FORM_INFO[k].topic})`}
                  stroke={SERIES[k].color}
                  strokeDasharray={SERIES[k].dash}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length === 1 && (
        <p className="mt-2 text-sm text-muted">
          Take another check-in to see a trend.
        </p>
      )}
    </section>
  );
}
