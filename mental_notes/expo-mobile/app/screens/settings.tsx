import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { RequireAuth } from "../../src/components/RequireAuth";
import { useAuth } from "../../src/auth/AuthContext";
import api, { errorMessage } from "../../src/api/client";
import { colors, common } from "../../src/theme/styles";

function SettingsContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [confirmResults, setConfirmResults] = useState(false);
  const [resultsBusy, setResultsBusy] = useState(false);
  const [resultsMsg, setResultsMsg] = useState("");
  const [resultsError, setResultsError] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  async function deleteResults() {
    setResultsError("");
    setResultsMsg("");
    setResultsBusy(true);
    try {
      const res = await api.delete<{ deleted: number }>("/assessments");
      setResultsMsg(
        `Deleted ${res.data.deleted} ${res.data.deleted === 1 ? "result" : "results"}.`,
      );
      setConfirmResults(false);
    } catch (err) {
      setResultsError(errorMessage(err));
    } finally {
      setResultsBusy(false);
    }
  }
  async function deleteAccount() {
    setAccountError("");
    setAccountBusy(true);
    try {
      await api.delete("/auth/account", { data: { password } });
      await logout();
      router.replace("/");
    } catch (err) {
      setAccountError(errorMessage(err));
      setAccountBusy(false);
    }
  }
  function confirmDeleteAccount() {
    if (!password) {
      setAccountError("Enter your password to continue.");
      return;
    }
    Alert.alert(
      "Permanently delete account?",
      "Your account and all results will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            void deleteAccount();
          },
        },
      ],
    );
  }
  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      <Link href="/screens/reflections/dashboard" style={common.link}>
        ‹ Back to dashboard
      </Link>
      <Text style={[common.title, { marginTop: 23 }]}>Settings</Text>
      <View style={[common.card, { marginTop: 22 }]}>
        <Text
          style={{ color: colors.brandDark, fontSize: 21, fontWeight: "700" }}
        >
          Your account
        </Text>
        <Text style={{ color: colors.ink, fontSize: 16, marginTop: 14 }}>
          {user?.name}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>{user?.email}</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>
          {user?.emailVerified ? "Email verified" : "Email not verified yet"}
        </Text>
        <Link href="/screens/profile" style={[common.link, { marginTop: 15 }]}>
          View profile
        </Link>
      </View>
      <View style={common.card}>
        <Text
          style={{ color: colors.brandDark, fontSize: 21, fontWeight: "700" }}
        >
          Delete my results
        </Text>
        <Text style={[common.subtitle, { fontSize: 15 }]}>
          Permanently deletes every PHQ-9 and GAD-7 result saved to your
          account. Your account stays open. This cannot be undone.
        </Text>
        {!!resultsMsg && (
          <Text style={{ color: colors.brand, marginTop: 13 }}>
            {resultsMsg}
          </Text>
        )}
        {!!resultsError && (
          <Text
            accessibilityRole="alert"
            style={[common.error, { marginTop: 13 }]}
          >
            {resultsError}
          </Text>
        )}
        {!confirmResults ? (
          <Pressable
            onPress={() => setConfirmResults(true)}
            style={{
              borderColor: colors.risk,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              alignSelf: "flex-start",
              marginTop: 16,
            }}
          >
            <Text style={{ color: colors.risk, fontWeight: "600" }}>
              Delete my results
            </Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: 17 }}>
            <Text style={{ color: colors.ink, fontWeight: "600" }}>
              Delete all results?
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
              <Pressable
                disabled={resultsBusy}
                onPress={deleteResults}
                style={[
                  common.button,
                  { backgroundColor: colors.risk, paddingVertical: 11 },
                ]}
              >
                <Text style={common.buttonText}>
                  {resultsBusy ? "Deleting…" : "Yes, delete"}
                </Text>
              </Pressable>
              <Pressable
                disabled={resultsBusy}
                onPress={() => setConfirmResults(false)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.ink }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <View style={[common.card, { borderColor: colors.risk }]}>
        <Text style={{ color: colors.risk, fontSize: 21, fontWeight: "700" }}>
          Delete my account
        </Text>
        <Text style={common.subtitle}>
          Permanently deletes your account and all of your results. This cannot
          be undone.
        </Text>
        {!showAccount ? (
          <Pressable
            onPress={() => setShowAccount(true)}
            style={{
              borderColor: colors.risk,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              alignSelf: "flex-start",
              marginTop: 16,
            }}
          >
            <Text style={{ color: colors.risk, fontWeight: "600" }}>
              Delete my account
            </Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: 17, gap: 11 }}>
            <Text style={common.label}>Enter your password to confirm</Text>
            <TextInput
              accessibilityLabel="Password confirmation"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              style={common.input}
            />
            {!!accountError && (
              <Text accessibilityRole="alert" style={common.error}>
                {accountError}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 4,
              }}
            >
              <Pressable
                disabled={accountBusy}
                onPress={confirmDeleteAccount}
                style={[common.button, { backgroundColor: colors.risk }]}
              >
                <Text style={common.buttonText}>
                  {accountBusy ? "Deleting…" : "Permanently delete account"}
                </Text>
              </Pressable>
              <Pressable
                disabled={accountBusy}
                onPress={() => {
                  setShowAccount(false);
                  setPassword("");
                  setAccountError("");
                }}
                style={{
                  borderColor: colors.line,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.ink }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function SettingsScreen() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
