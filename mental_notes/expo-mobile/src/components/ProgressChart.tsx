import { Fragment, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { formatDate, FORM_INFO, FORM_TYPES, FormType, severityLabel } from "../lib/assessmentInfo";
import { colors, common } from "../theme/styles";

type Assessment = { _id: string; type: FormType; totalScore: number; severity: string; completedAt: string };
type Point = { id: string; type: FormType; x: number; y: number; score: number; date: string; severity: string };

const SERIES: Record<FormType, string> = { PHQ9: colors.brand, GAD7: "#b7791f" };
const MAX_SCORE = 27;
const HEIGHT = 228;
const PAD = { top: 15, right: 12, bottom: 38, left: 35 };
const shortDate = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function ProgressChart({ items }: { items: Assessment[] }) {
  const [type, setType] = useState<FormType>("PHQ9");
  const [compare, setCompare] = useState(false);
  const [width, setWidth] = useState(0);
  const visible = compare ? FORM_TYPES : [type];
  const rows = useMemo(() => items
    .map((item) => ({ ...item, timestamp: new Date(item.completedAt).getTime() }))
    .sort((a, b) => a.timestamp - b.timestamp), [items]);
  const data = rows.filter((row) => visible.includes(row.type));
  const chartWidth = Math.max(width, 1);
  const innerWidth = Math.max(chartWidth - PAD.left - PAD.right, 1);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const min = data.length ? data[0].timestamp : 0;
  const max = data.length ? data[data.length - 1].timestamp : 0;
  const points: Point[] = data.map((row, index) => ({
    id: row._id,
    type: row.type,
    x: PAD.left + (max === min ? innerWidth / 2 : ((row.timestamp - min) / (max - min)) * innerWidth),
    y: PAD.top + innerHeight - (row.totalScore / MAX_SCORE) * innerHeight,
    score: row.totalScore,
    date: row.completedAt,
    severity: row.severity,
  }));
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const selectedLabel = compare ? "PHQ-9 and GAD-7" : FORM_INFO[type].name;

  return <View style={[common.card, { marginTop: 26 }]}>
    <Text style={{ color: colors.brandDark, fontSize: 22, fontWeight: "700" }}>Your progress</Text>
    <Text style={[common.subtitle, { fontSize: 14 }]}>A lower score means fewer symptoms.</Text>
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
      {FORM_TYPES.map((formType) => {
        const selected = !compare && type === formType;
        return <Pressable key={formType} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: compare }} disabled={compare} onPress={() => setType(formType)} style={{ borderWidth: 1, borderColor: selected ? colors.brand : colors.line, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: selected ? colors.brand : colors.paper, opacity: compare ? 0.55 : 1 }}>
          <Text style={{ color: selected ? colors.paper : colors.ink, fontSize: 14 }}>{FORM_INFO[formType].name}</Text>
        </Pressable>;
      })}
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: compare }} onPress={() => setCompare((value) => !value)} style={{ marginLeft: "auto", borderWidth: 1, borderColor: compare ? colors.brand : colors.line, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: compare ? colors.brand : colors.paper }}>
        <Text style={{ color: compare ? colors.paper : colors.ink, fontSize: 13 }}>Compare both</Text>
      </Pressable>
    </View>

    {data.length === 0 ? <Text style={[common.subtitle, { marginTop: 26 }]}>{compare ? "No results yet. Take a check-in to start your chart." : `No ${FORM_INFO[type].name} results yet. Take a check-in to start your chart.`}</Text> : <View onLayout={onLayout} style={{ height: HEIGHT, marginTop: 12 }} accessibilityRole="image" accessibilityLabel={`Line chart of your ${selectedLabel} scores over time`}>
      {width > 0 && <Svg width={chartWidth} height={HEIGHT}>
        {[0, 5, 10, 15, 20, 25].map((value) => {
          const y = PAD.top + innerHeight - (value / MAX_SCORE) * innerHeight;
          return <Fragment key={`tick-${value}`}>
            <Line x1={PAD.left} y1={y} x2={chartWidth - PAD.right} y2={y} stroke={colors.line} strokeDasharray="3 4" />
            <SvgText x={PAD.left - 8} y={y + 4} fontSize="10" fill={colors.muted} textAnchor="end">{value}</SvgText>
          </Fragment>;
        })}
        {visible.map((formType) => {
          const seriesPoints = points.filter((point) => point.type === formType);
          const path = seriesPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
          return <Fragment key={formType}>
            {seriesPoints.length > 1 && <Path d={path} fill="none" stroke={SERIES[formType]} strokeWidth="2.5" strokeDasharray={compare && formType === "GAD7" ? "6 4" : undefined} />}
            {seriesPoints.map((point) => <Circle key={point.id} cx={point.x} cy={point.y} r="5" fill={colors.paper} stroke={SERIES[formType]} strokeWidth="2.5" />)}
          </Fragment>;
        })}
        {points.length === 1 && <SvgText x={chartWidth / 2} y={points[0].y - 12} fontSize="12" fill={colors.ink} textAnchor="middle">{points[0].score} / {FORM_INFO[points[0].type].max} · {severityLabel(points[0].severity)}</SvgText>}
        {[...new Map(points.map((point) => [point.date, point])).values()].filter((_, index, all) => index === 0 || index === all.length - 1 || (all.length > 3 && index === Math.floor((all.length - 1) / 2))).map((point, index, labels) => <SvgText key={point.id} x={labels.length === 1 ? chartWidth / 2 : point.x} y={HEIGHT - 12} fontSize="10" fill={colors.muted} textAnchor={index === 0 && labels.length > 1 ? "start" : index === labels.length - 1 && labels.length > 1 ? "end" : "middle"}>{shortDate(point.date)}</SvgText>)}
      </Svg>}
    </View>}
    {data.length > 0 && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 8 }}>
      {visible.map((formType) => <View key={formType} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SERIES[formType] }} /><Text style={{ color: colors.muted, fontSize: 13 }}>{FORM_INFO[formType].name} ({FORM_INFO[formType].max})</Text></View>)}
    </View>}
    {data.length === 1 && <Text style={[common.subtitle, { fontSize: 14, marginTop: 8 }]}>Take another check-in to see a trend.</Text>}
  </View>;
}
