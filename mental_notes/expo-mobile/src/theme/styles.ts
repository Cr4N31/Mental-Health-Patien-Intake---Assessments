import { StyleSheet } from "react-native";

export const colors = {
  background: "#F7FAF8",
  paper: "#ffffff",
  ink: "#183125",
  muted: "#64736D",
  brand: "#37A955",
  brandDark: "#1E7B3B",
  brandSoft: "#E8F5EC",
  accent: "#8A9B8F",
  line: "#E1E9E3",
  risk: "#a33e3e",
  riskSoft: "#f8e9e7",
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 36 },
  title: { color: colors.ink, fontSize: 32, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "600", marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.paper, paddingHorizontal: 15, paddingVertical: 13, color: colors.ink, fontSize: 16 },
  button: { alignItems: "center", justifyContent: "center", backgroundColor: colors.brandDark, borderRadius: 10, minHeight: 48, paddingVertical: 12, paddingHorizontal: 16 },
  buttonText: { color: colors.paper, fontWeight: "700", fontSize: 16 },
  link: { color: colors.brandDark, textDecorationLine: "underline", fontSize: 15 },
  error: { backgroundColor: colors.riskSoft, color: colors.risk, padding: 12, borderRadius: 8 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 14 },
});
