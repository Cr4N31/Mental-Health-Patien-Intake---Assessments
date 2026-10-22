import { useState } from "react";
import { Link, Redirect, useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { errorMessage } from "../src/api/client";
import { colors, common } from "../src/theme/styles";

const consentCopy = "I understand that Mental Notes stores my answers and results so I can see my history. It is a screening tool, not a diagnosis, and it does not replace advice from a qualified professional.";

export default function SignupScreen() {
  const { user, loading, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  if (!loading && user) return <Redirect href="/dashboard" />;

  async function submit() {
    setError("");
    if (password.length < 10) { setError("Password must be at least 10 characters."); return; }
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    if (!consent) { setError("Please accept the consent statement to continue."); return; }
    setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, consent: true });
      router.replace("/dashboard");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[common.content, { justifyContent: "flex-start" }]} keyboardShouldPersistTaps="handled">
        <View style={{ width: "100%", maxWidth: 460, alignSelf: "center" }}>
          <Text style={common.title}>Create your account</Text>
          <Text style={common.subtitle}>Take private check-ins and track how you are doing over time.</Text>
          <View style={{ marginTop: 26, gap: 16 }}>
            <View><Text style={common.label}>Full name</Text><TextInput accessibilityLabel="Full name" autoComplete="name" value={name} onChangeText={setName} style={common.input} /></View>
            <View><Text style={common.label}>Email</Text><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} style={common.input} /></View>
            <View><Text style={common.label}>Password (at least 10 characters)</Text><TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="new-password" secureTextEntry value={password} onChangeText={setPassword} style={common.input} /></View>
            <View><Text style={common.label}>Confirm password</Text><TextInput accessibilityLabel="Confirm password" autoCapitalize="none" secureTextEntry value={confirm} onChangeText={setConfirm} onSubmitEditing={submit} style={common.input} /></View>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((value) => !value)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 4 }}>
              <View style={{ width: 24, height: 24, borderRadius: 5, borderWidth: 1, borderColor: consent ? colors.brand : colors.line, backgroundColor: consent ? colors.brand : colors.paper, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.paper, fontWeight: "700" }}>{consent ? "✓" : ""}</Text></View>
              <Text style={{ flex: 1, color: colors.muted, lineHeight: 21 }}>{consentCopy}</Text>
            </Pressable>
            {!!error && <Text accessibilityRole="alert" style={common.error}>{error}</Text>}
            <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={[common.button, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.paper} /> : <Text style={common.buttonText}>Create account</Text>}</Pressable>
          </View>
          <View style={{ marginTop: 24, flexDirection: "row", flexWrap: "wrap", gap: 6 }}><Text style={{ color: colors.muted }}>Already have an account?</Text><Link href="/login" style={common.link}>Log in</Link></View>
          <Link href="/" style={[common.link, { marginTop: 26 }]}>Back to home</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
