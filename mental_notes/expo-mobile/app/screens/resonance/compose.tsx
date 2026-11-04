import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { errorMessage } from "../../../src/api/client";
import { resonanceApi } from "../../../src/api/resonance";
import type { SafetyLevel } from "../../../src/api/reflection";
import { SupportCard } from "../../../src/components/SupportCard";
import { colors, common } from "../../../src/theme/styles";

const MAX = 1000;

const GUIDELINES = [
  "Be kind. Share your own experience, not advice about medication or diagnoses.",
  "No links, emails or phone numbers.",
  "Resonance is peer support. It is not therapy and not for emergencies.",
  "Choose whether your post uses a random name or your profile username. Posts that several people report are hidden.",
];

export default function Compose() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    held: boolean;
    safety: SafetyLevel;
  } | null>(null);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await resonanceApi.create(trimmed, anonymous);
      if (res.held || res.safety !== "none") {
        setResult({ held: !!res.held, safety: res.safety });
      } else {
        router.back();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <ScrollView
        style={common.screen}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={{ color: colors.ink, fontSize: 16, lineHeight: 23 }}>
          {result.held
            ? "Your post was not shared with the community. You can write it again at any time. Support is below."
            : "Your post is shared."}
        </Text>
        <SupportCard
          level={result.safety}
          onContinue={() => router.back()}
          continueLabel="Back to Resonance"
        />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: colors.brandSoft,
            borderRadius: 16,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.ink, fontWeight: "700" }}>
            Community guidelines
          </Text>
          {GUIDELINES.map((line) => (
            <Text key={line} style={{ color: colors.ink, lineHeight: 21 }}>
              {"\u2022"} {line}
            </Text>
          ))}
        </View>

        <Text style={[common.label, { marginTop: 20 }]}>
          What is on your mind?
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            padding: 14,
            backgroundColor: colors.paper,
            borderRadius: 14,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: colors.ink, fontWeight: "600" }}>
              Post anonymously
            </Text>
            <Text style={{ color: colors.muted, marginTop: 3 }}>
              {anonymous
                ? "Your post will use a random name."
                : "Your profile username or name will be shown."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Post anonymously"
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: colors.line, true: colors.brandSoft }}
            thumbColor={anonymous ? colors.brand : colors.paper}
          />
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write here"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={MAX}
          textAlignVertical="top"
          style={[common.input, { minHeight: 150 }]}
        />
        <Text
          style={{ color: colors.muted, alignSelf: "flex-end", marginTop: 6 }}
        >
          {text.length}/{MAX}
        </Text>

        {!!error && (
          <Text style={[common.error, { marginTop: 10 }]}>{error}</Text>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={busy || !text.trim()}
          style={[
            common.button,
            { marginTop: 16, opacity: busy || !text.trim() ? 0.5 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.paper} />
          ) : (
            <Text style={common.buttonText}>
              {anonymous ? "Share anonymously" : "Share with my name"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
