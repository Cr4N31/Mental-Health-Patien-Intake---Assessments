import { StyleSheet } from "react-native";

export const colors = {
  background: "#f8f7f3",
  paper: "#ffffff",
  ink: "#24302d",
  muted: "#68736f",
  brand: "#2f6f62",
  brandDark: "#24574d",
  line: "#dce2de",
  risk: "#a33e3e",
  riskSoft: "#f8e9e7",
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 36 },
  title: { color: colors.brandDark, fontSize: 32, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 8 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "600", marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paper, paddingHorizontal: 13, paddingVertical: 12, color: colors.ink, fontSize: 16 },
  button: { alignItems: "center", justifyContent: "center", backgroundColor: colors.brand, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 },
  buttonText: { color: colors.paper, fontWeight: "700", fontSize: 16 },
  link: { color: colors.brand, textDecorationLine: "underline", fontSize: 15 },
  error: { backgroundColor: colors.riskSoft, color: colors.risk, padding: 12, borderRadius: 8 },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: 12, padding: 18, marginTop: 14 },
});
