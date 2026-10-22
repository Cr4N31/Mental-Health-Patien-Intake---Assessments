import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import api, { errorMessage } from "../../src/api/client";
import { changeText, formatDate, FORM_INFO, FormType, severityLabel, severityMeaning } from "../../src/lib/assessmentInfo";
import { colors, common } from "../../src/theme/styles";

type Assessment = { _id: string; type: FormType; totalScore: number; severity: string; completedAt: string; riskFlag: boolean };
const HELPLINES = [
  { name: "Emergency services (112)", contact: "112", number: "112", note: "Nigeria's toll-free national emergency number. Rollout across states is still in progress, so it may not connect everywhere." },
  { name: "SURPIN suicide helpline", contact: "0800 078 7746", number: "08000787746", note: "Toll-free, 24 hours. Other lines: 0903 440 0009, 0908 021 7555. Hausa: 0814 224 1007." },
  { name: "She Writes Woman helpline", contact: "0800 800 2000", number: "08008002000", note: "Toll-free, with trained counsellors." },
  { name: "Asido Foundation", contact: "0902 808 0416", number: "09028080416", note: "Call, SMS or WhatsApp. A counsellor calls you back for free." },
];

function ResultContent() {
  const { id, change: rawChange } = useLocalSearchParams<{ id: string; change?: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null); const [error, setError] = useState("");
  useEffect(() => { api.get<Assessment>(`/assessments/${id}`).then((res) => setAssessment(res.data)).catch((err) => setError(errorMessage(err))); }, [id]);
  if (error) return <View style={[common.screen, { padding: 24, justifyContent: "center" }]}><Text accessibilityRole="alert" style={common.error}>{error}</Text><Link href="/dashboard" style={[common.link, { marginTop: 18 }]}>Back to dashboard</Link></View>;
  if (!assessment) return <View style={[common.screen, { justifyContent: "center" }]}><ActivityIndicator color={colors.brand} /></View>;
  const info = FORM_INFO[assessment.type]; const change = rawChange === "first" ? null : rawChange === undefined ? undefined : Number(rawChange);
  return <ScrollView style={common.screen} contentContainerStyle={{ padding: 22, paddingTop: 36, paddingBottom: 46 }}>
    {assessment.riskFlag && <View style={[common.card, { backgroundColor: colors.riskSoft, borderColor: colors.risk, padding: 18, marginTop: 0 }]}>
      <Text style={{ color: colors.risk, fontSize: 22, fontWeight: "700" }}>Thank you for answering honestly</Text>
      <Text style={{ color: colors.ink, lineHeight: 23, marginTop: 12 }}>One of your answers mentions thoughts of harming yourself. You are not alone, and help is available.</Text>
      <Text style={{ color: colors.ink, lineHeight: 23, marginTop: 10 }}>If you think you might act on these thoughts, or you are in danger, contact your local emergency number now or go to the nearest emergency room. If you can, tell someone you trust how you are feeling today.</Text>
      <Text style={{ color: colors.ink, fontWeight: "700", marginTop: 16 }}>Support lines in Nigeria</Text>
      {HELPLINES.map((line) => <View key={line.name} style={{ marginTop: 12 }}><Text style={{ color: colors.ink, fontWeight: "600" }}>{line.name}</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL(`tel:${line.number}`).catch(() => undefined)}><Text style={{ color: colors.brandDark, textDecorationLine: "underline", marginTop: 3 }}>{line.contact}</Text></Pressable><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2 }}>{line.note}</Text></View>)}
    </View>}
    <Text style={[common.subtitle, { marginTop: 24 }]}>{info.name}: {info.topic}. {formatDate(assessment.completedAt)}</Text>
    <Text style={{ color: colors.brandDark, fontSize: 43, fontWeight: "700", marginTop: 3 }}>{assessment.totalScore}<Text style={{ color: colors.muted, fontSize: 21, fontWeight: "400" }}> / {info.max}</Text></Text>
    <Text style={{ color: colors.ink, fontSize: 21, marginTop: 4 }}>{severityLabel(assessment.severity)}</Text>
    <Text style={{ color: colors.ink, fontSize: 17, lineHeight: 26, marginTop: 15 }}>{severityMeaning(assessment.severity)}</Text>
    {change !== undefined && <Text style={[common.subtitle, { marginTop: 10 }]}>{changeText(change)}</Text>}
    <Text style={[common.subtitle, { fontSize: 14, marginTop: 10 }]}>A lower score means fewer symptoms.</Text>
    <View style={[common.card, { backgroundColor: colors.line, marginTop: 20 }]}><Text style={{ color: colors.ink, lineHeight: 21, fontSize: 14 }}>This is a screening result, not a diagnosis. It cannot replace advice from a qualified health professional.</Text></View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 25 }}><Link href="/dashboard" style={common.link}>Back to dashboard</Link><Link href="/history" style={common.link}>View history</Link></View>
  </ScrollView>;
}

export default function ResultScreen() { return <RequireAuth><ResultContent /></RequireAuth>; }
