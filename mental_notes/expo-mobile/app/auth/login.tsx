import { useState } from "react";
import { Link, Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import api, { errorMessage } from "../../src/api/client";
import { colors, common } from "../../src/theme/styles";

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!loading && user) return <Redirect href="/screens/reflections/dashboard" />;

  async function submit() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/screens/reflections/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setBusy(true);
    try {
      const result = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setNotice(result.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={common.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", maxWidth: 460, alignSelf: "center" }}>
          <Text style={common.title}>Mental Notes</Text>
          <Text style={common.subtitle}>Log in to your account.</Text>
          <View style={{ marginTop: 30, gap: 17 }}>
            <View>
              <Text style={common.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={common.input}
              />
            </View>
            <View>
              <Text style={common.label}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={submit}
                returnKeyType="go"
                style={common.input}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={requestPasswordReset}
              disabled={busy}
              style={{ alignSelf: "flex-end", paddingVertical: 4 }}
            >
              <Text style={common.link}>Forgot password?</Text>
            </Pressable>
            {!!error && (
              <Text accessibilityRole="alert" style={common.error}>
                {error}
              </Text>
            )}
            {!!notice && (
              <Text
                accessibilityRole="alert"
                style={[
                  common.error,
                  { color: colors.brandDark, backgroundColor: "#e8f1ed" },
                ]}
              >
                {notice}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={submit}
              disabled={busy || !email || !password}
              style={[
                common.button,
                (busy || !email || !password) && { opacity: 0.6 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={common.buttonText}>Log in</Text>
              )}
            </Pressable>
          </View>
          <View
            style={{
              marginTop: 24,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <Text style={{ color: colors.muted }}>No account yet?</Text>
            <Link href="/auth/signup" style={common.link}>
              Create an account
            </Link>
          </View>
          <Link href="/" style={[common.link, { marginTop: 26 }]}>
            Back to home
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
