import { useEffect, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import api, { errorMessage } from "../../src/api/client";
import { FORM_INFO, FORM_TYPES, FormType } from "../../src/lib/assessmentInfo";
import { colors, common } from "../../src/theme/styles";

type Form = { title: string; stem: string; options: { value: number; label: string }[]; items: string[] };

function AssessmentContent() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>(); const type = rawType as FormType;
  const router = useRouter(); const [form, setForm] = useState<Form | null>(null); const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0); const [started, setStarted] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!FORM_TYPES.includes(type)) { setError("Unknown questionnaire."); return; }
    api.get<Form>(`/assessments/forms/${type}`).then((res) => { setForm(res.data); setAnswers(new Array(res.data.items.length).fill(-1)); }).catch((err) => setError(errorMessage(err)));
  }, [type]);
  async function submit() {
    setError(""); setBusy(true);
    try {
      const res = await api.post<{ assessment: { _id: string }; change: number | null }>("/assessments", { type, answers });
      router.replace({ pathname: "/results/[id]", params: { id: res.data.assessment._id, change: res.data.change === null ? "first" : String(res.data.change) } });
    } catch (err) { setError(errorMessage(err)); setBusy(false); }
  }
  if (error && !form) return <View style={[common.screen, { padding: 24, justifyContent: "center" }]}><Text accessibilityRole="alert" style={common.error}>{error}</Text><Link href="/screens/reflections/dashboard" style={[common.link, { marginTop: 20 }]}>Back to dashboard</Link></View>;
  if (!form) return <View style={[common.screen, { justifyContent: "center" }]}><ActivityIndicator color={colors.brand} /></View>;
  const info = FORM_INFO[type]; const total = form.items.length; const last = index === total - 1;
  return <ScrollView style={common.screen} contentContainerStyle={{ padding: 22, paddingTop: 32, paddingBottom: 46 }}>
    {!started ? <>
      <Text style={common.title}>{info.name}: {info.topic}</Text>
      <Text style={[common.subtitle, { fontSize: 18, lineHeight: 28, marginTop: 18 }]}>{info.questions} short questions. It takes about 2 minutes.</Text>
      <Text style={[common.subtitle, { fontSize: 17, lineHeight: 26, marginTop: 12 }]}>There are no right or wrong answers. Choose the option that fits you best. Your answers are saved to your private history.</Text>
      <Pressable accessibilityRole="button" onPress={() => setStarted(true)} style={[common.button, { marginTop: 28 }]}><Text style={common.buttonText}>Start</Text></Pressable>
      <Link href="/screens/reflections/dashboard" style={[common.link, { marginTop: 22 }]}>Cancel</Link>
    </> : <>
      <Text style={{ color: colors.muted }}>Question {index + 1} of {total}</Text>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: index + 1 }} style={{ height: 7, backgroundColor: colors.line, borderRadius: 5, marginTop: 10, overflow: "hidden" }}><View style={{ height: 7, width: `${((index + 1) / total) * 100}%`, backgroundColor: colors.brand }} /></View>
      <Text style={[common.subtitle, { marginTop: 26, fontSize: 14 }]}>{form.stem}</Text>
      <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "700", lineHeight: 31, marginTop: 9 }}>{form.items[index]}</Text>
      <View style={{ gap: 10, marginTop: 22 }}>{form.options.map((option) => {
        const selected = answers[index] === option.value;
        return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setAnswers((old) => old.map((value, i) => i === index ? option.value : value))} style={{ borderWidth: 1, borderColor: selected ? colors.brand : colors.line, borderRadius: 9, paddingHorizontal: 15, paddingVertical: 14, backgroundColor: selected ? "#e8f1ed" : colors.paper }}><Text style={{ color: selected ? colors.brandDark : colors.ink, fontSize: 16, fontWeight: selected ? "600" : "400" }}>{option.label}</Text></Pressable>;
      })}</View>
      {!!error && <Text accessibilityRole="alert" style={[common.error, { marginTop: 15 }]}>{error}</Text>}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
        <Pressable accessibilityRole="button" disabled={index === 0 || busy} onPress={() => setIndex((value) => value - 1)} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, opacity: index === 0 || busy ? 0.45 : 1 }}><Text style={{ color: colors.ink }}>Back</Text></Pressable>
        {last ? <Pressable accessibilityRole="button" disabled={answers[index] < 0 || busy} onPress={submit} style={[common.button, { paddingVertical: 12, opacity: answers[index] < 0 || busy ? 0.55 : 1 }]}>{busy ? <ActivityIndicator color={colors.paper} /> : <Text style={common.buttonText}>See my result</Text>}</Pressable> : <Pressable accessibilityRole="button" disabled={answers[index] < 0} onPress={() => setIndex((value) => value + 1)} style={[common.button, { paddingVertical: 12, opacity: answers[index] < 0 ? 0.55 : 1 }]}><Text style={common.buttonText}>Next</Text></Pressable>}
      </View>
    </>}
  </ScrollView>;
}

export default function AssessmentScreen() { return <RequireAuth><AssessmentContent /></RequireAuth>; }
