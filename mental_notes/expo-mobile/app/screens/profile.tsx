import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { useAuth } from "../../src/auth/AuthContext";
import api, { errorMessage } from "../../src/api/client";
import { colors, common } from "../../src/theme/styles";

function ProfileContent() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/resend-verification");
      setMessage(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 44 }}
    >
      <Link href="/screens/reflections/dashboard" style={common.link}>
        ‹ Back to dashboard
      </Link>
      <Text style={[common.title, { marginTop: 24 }]}>Profile</Text>
      <Text style={common.subtitle}>Your Mental Notes account details.</Text>
      <View style={[common.card, { marginTop: 24 }]}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>FULL NAME</Text>
        <Text style={{ color: colors.ink, fontSize: 18, marginTop: 5 }}>
          {user?.name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 20 }}>
          EMAIL
        </Text>
        <Text style={{ color: colors.ink, fontSize: 18, marginTop: 5 }}>
          {user?.email}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 20 }}>
          EMAIL STATUS
        </Text>
        <Text
          style={{
            color: user?.emailVerified ? colors.brand : colors.risk,
            fontSize: 16,
            marginTop: 5,
          }}
        >
          {user?.emailVerified ? "Verified" : "Not verified"}
        </Text>
        {!user?.emailVerified && (
          <>
            <Text style={[common.subtitle, { marginTop: 12 }]}>
              Check your inbox for a verification link.
            </Text>
            <Pressable
              onPress={resend}
              disabled={busy}
              style={{ marginTop: 14 }}
            >
              <Text style={common.link}>
                {busy ? "Sending…" : "Resend verification email"}
              </Text>
            </Pressable>
          </>
        )}
        {!!message && (
          <Text style={{ color: colors.brand, marginTop: 12 }}>{message}</Text>
        )}
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={[common.error, { marginTop: 12 }]}
          >
            {error}
          </Text>
        )}
      </View>
      <Link href="/screens/settings" style={[common.link, { marginTop: 24 }]}>
        Account settings
      </Link>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
