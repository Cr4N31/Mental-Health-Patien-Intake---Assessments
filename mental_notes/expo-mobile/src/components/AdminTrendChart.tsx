import { useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import type {
  AnalyticsBucket,
  AnalyticsRange,
} from "../api/admin";
import { colors, common } from "../theme/styles";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "5h", label: "5h" },
  { value: "24h", label: "24h" },
  { value: "3m", label: "3M" },
  { value: "12m", label: "12M" },
];
const HEIGHT = 210;
const PAD = { top: 16, right: 12, bottom: 34, left: 30 };

export type TrendSeries = {
  key: keyof AnalyticsBucket;
  label: string;
  color: string;
};

function tickLabel(value: string, range: AnalyticsRange) {
  const date = new Date(value);
  if (range === "1h" || range === "5h")
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (range === "24h")
    return date.toLocaleTimeString([], { hour: "numeric" });
  if (range === "12m")
    return date.toLocaleDateString([], { month: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function AdminTrendChart({
  title,
  buckets,
  range,
  onRangeChange,
  series,
  description,
}: {
  title: string;
  buckets: AnalyticsBucket[];
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
  series: TrendSeries[];
  description?: string;
}) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);
  const chartWidth = Math.max(width, 1);
  const innerWidth = Math.max(chartWidth - PAD.left - PAD.right, 1);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxValue = Math.max(
    1,
    ...buckets.flatMap((bucket) => series.map((item) => bucket[item.key] as number)),
  );
  const points = series.map((item) => ({
    ...item,
    coords: buckets.map((bucket, index) => ({
      x:
        PAD.left +
        (buckets.length <= 1 ? innerWidth / 2 : (index / (buckets.length - 1)) * innerWidth),
      y:
        PAD.top +
        innerHeight -
        ((bucket[item.key] as number) / maxValue) * innerHeight,
      value: bucket[item.key] as number,
    })),
  }));
  const labels =
    buckets.length > 0
      ? [...new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])]
      : [];
  const selected = buckets[selectedIndex ?? buckets.length - 1];

  return (
    <View style={common.card}>
      <Text style={{ color: colors.brandDark, fontSize: 19, fontWeight: "700" }}>
        {title}
      </Text>
      {!!description && (
        <Text style={[common.subtitle, { fontSize: 13 }]}>{description}</Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
        {RANGES.map((item) => {
          const active = item.value === range;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setSelectedIndex(null);
                onRangeChange(item.value);
              }}
              style={{
                backgroundColor: active ? colors.brandDark : colors.paper,
                borderColor: active ? colors.brandDark : colors.line,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: active ? colors.paper : colors.ink, fontSize: 13 }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {buckets.length === 0 ? (
        <Text style={[common.subtitle, { marginTop: 18 }]}>No data for this period.</Text>
      ) : (
        <View
          onLayout={onLayout}
          style={{ height: HEIGHT, marginTop: 8 }}
          accessibilityRole="image"
          accessibilityLabel={`${title} over time`}
        >
          {width > 0 && (
            <Svg width={chartWidth} height={HEIGHT}>
              {[0, 0.5, 1].map((fraction) => {
                const y = PAD.top + innerHeight * (1 - fraction);
                return (
                  <Line
                    key={fraction}
                    x1={PAD.left}
                    y1={y}
                    x2={chartWidth - PAD.right}
                    y2={y}
                    stroke={colors.line}
                    strokeDasharray="3 4"
                  />
                );
              })}
              {points.map((item) => {
                const path = item.coords
                  .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
                  .join(" ");
                return (
                  <Path
                    key={item.key}
                    d={path}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="2.5"
                  />
                );
              })}
              {points.map((item) =>
                item.coords.map((point, index) => (
                  <Circle
                    key={`${item.key}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={selectedIndex === index ? 5 : 2}
                    fill={item.color}
                    onPress={() => setSelectedIndex(index)}
                  />
                )),
              )}
              {labels.map((index) => (
                <SvgText
                  key={index}
                  x={
                    index === 0
                      ? PAD.left
                      : index === buckets.length - 1
                        ? chartWidth - PAD.right
                        : PAD.left + innerWidth / 2
                  }
                  y={HEIGHT - 10}
                  fontSize="10"
                  fill={colors.muted}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === buckets.length - 1
                        ? "end"
                        : "middle"
                  }
                >
                  {tickLabel(buckets[index].date, range)}
                </SvgText>
              ))}
            </Svg>
          )}
        </View>
      )}
      {selected && (
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
          {new Date(selected.date).toLocaleString()}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
        {points.map((item) => (
          <View key={item.key} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: item.color }} />
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {item.label}{selected ? `: ${selected[item.key]}` : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
