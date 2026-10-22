import { StyleSheet } from "react-native";

export const colors = {
  background: "#f7f8f5",
  paper: "#ffffff",
  ink: "#172b26",
  muted: "#64736d",
  brand: "#1c7662",
  brandDark: "#155746",
  brandSoft: "#dff1e9",
  accent: "#eab676",
  line: "#e0e7e3",
  risk: "#a33e3e",
  riskSoft: "#f8e9e7",
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 36 },
  title: { color: colors.ink, fontSize: 32, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "600", marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.paper, paddingHorizontal: 15, paddingVertical: 13, color: colors.ink, fontSize: 16 },
  button: { alignItems: "center", justifyContent: "center", backgroundColor: colors.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  buttonText: { color: colors.paper, fontWeight: "700", fontSize: 16 },
  link: { color: colors.brand, textDecorationLine: "underline", fontSize: 15 },
  error: { backgroundColor: colors.riskSoft, color: colors.risk, padding: 12, borderRadius: 8 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 14 },
});
