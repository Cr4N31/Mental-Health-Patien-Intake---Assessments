import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { errorMessage } from "../../src/api/client";
import { colors, common } from "../../src/theme/styles";

export default function StaffSignIn() {
  const { staffLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await staffLogin(email.trim(), password);
      router.replace("/screens/admin");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Link href="/auth/login" style={common.link}>
        ‹ Back to sign in
      </Link>
      <Text style={[common.title, { marginTop: 23 }]}>Staff sign in</Text>
      <Text style={common.subtitle}>
        For admins and moderators only. Sessions last 4 hours.
      </Text>

      <View style={{ marginTop: 24, gap: 11 }}>
        <Text style={common.label}>Email</Text>
        <TextInput
          accessibilityLabel="Staff email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={common.input}
        />
        <Text style={common.label}>Password</Text>
        <TextInput
          accessibilityLabel="Staff password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          style={common.input}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={common.error}>
            {error}
          </Text>
        )}
        <Pressable
          disabled={busy || !email || !password}
          onPress={submit}
          style={[common.button, { marginTop: 8 }]}
        >
          <Text style={common.buttonText}>
            {busy ? "Signing in..." : "Sign in"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
