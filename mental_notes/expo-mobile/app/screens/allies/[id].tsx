import { useEffect, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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
import { RequireAuth } from "../../../src/components/RequireAuth";
import { SupportCard } from "../../../src/components/SupportCard";
import { alliesApi, Professional } from "../../../src/api/allies";
import type { SafetyLevel } from "../../../src/api/reflection";
import { errorMessage } from "../../../src/api/client";
import { colors, common } from "../../../src/theme/styles";

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.ink, marginTop: 2, lineHeight: 22 }}>
        {value}
      </Text>
    </View>
  );
}

function ProfileContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pro, setPro] = useState<Professional | null>(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [safety, setSafety] = useState<SafetyLevel>("none");

  useEffect(() => {
    if (!id) return;
    alliesApi
      .get(id)
      .then(setPro)
      .catch((err) => setLoadError(errorMessage(err)));
  }, [id]);

  async function send() {
    if (!id) return;
    if (!message.trim()) {
      setError("Tell the professional a little about what you need.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await alliesApi.request(id, {
        message: message.trim(),
        preferredTime: preferredTime.trim(),
      });
      setSafety(result.safety ?? "none");
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={common.screen}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 28,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Link href="/screens/allies" style={common.link}>
          Back
        </Link>

        {!!loadError && (
          <Text
            accessibilityRole="alert"
            style={[common.error, { marginTop: 18 }]}
          >
            {loadError}
          </Text>
        )}
        {!pro && !loadError && (
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.brand} />
        )}

        {pro && (
          <>
            {pro.isSample && (
              <View
                style={[
                  common.card,
                  {
                    backgroundColor: colors.riskSoft,
                    borderColor: colors.riskSoft,
                  },
                ]}
              >
                <Text style={{ color: colors.risk, fontWeight: "700" }}>
                  Sample profile
                </Text>
                <Text
                  style={{ color: colors.ink, marginTop: 4, lineHeight: 22 }}
                >
                  This is made-up test data, not a real professional. Nothing
                  you send here reaches a real person.
                </Text>
              </View>
            )}

            <Text style={[common.title, { marginTop: 18 }]}>{pro.name}</Text>
            <Text style={common.subtitle}>{pro.title}</Text>

            <View style={common.card}>
              {!!pro.bio && (
                <Text style={{ color: colors.ink, lineHeight: 23 }}>
                  {pro.bio}
                </Text>
              )}
              <Row label="Focus areas" value={pro.specializations.join(", ")} />
              <Row label="Languages" value={pro.languages.join(", ")} />
              <Row label="Format" value={pro.formats.join(", ")} />
              <Row label="Location" value={pro.location} />
              <Row label="Availability" value={pro.availabilityNote} />
              <Row label="Price" value={pro.priceNote} />
            </View>

            {sent ? (
              <View>
                <SupportCard level={safety} />
                <View style={common.card}>
                  <Text
                    style={{
                      color: colors.brandDark,
                      fontSize: 20,
                      fontWeight: "700",
                    }}
                  >
                    Request sent
                  </Text>
                  <Text style={common.subtitle}>
                    {pro.isSample
                      ? "This is a sample profile, so nothing was sent to a real person."
                      : "The professional will reply to you by email."}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/screens/allies/requests")}
                    style={{ marginTop: 14 }}
                  >
                    <Text style={common.link}>View my requests</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={common.card}>
                <Text
                  style={{
                    color: colors.brandDark,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Send a request
                </Text>
                <Text style={common.subtitle}>
                  Your name, email and message will be shared with this
                  professional so they can reply to you.
                </Text>

                <Text style={[common.label, { marginTop: 16 }]}>
                  What would you like help with?
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="A few sentences are enough"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={1000}
                  style={[
                    common.input,
                    { minHeight: 110, textAlignVertical: "top" },
                  ]}
                />

                <Text style={[common.label, { marginTop: 16 }]}>
                  Preferred time (optional)
                </Text>
                <TextInput
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                  placeholder="For example, weekday evenings"
                  placeholderTextColor={colors.muted}
                  maxLength={200}
                  style={common.input}
                />

                {!!error && (
                  <Text
                    accessibilityRole="alert"
                    style={[common.error, { marginTop: 14 }]}
                  >
                    {error}
                  </Text>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={send}
                  style={[
                    common.button,
                    { marginTop: 18, opacity: busy ? 0.7 : 1 },
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.paper} />
                  ) : (
                    <Text style={common.buttonText}>Send request</Text>
                  )}
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
