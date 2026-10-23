import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { reflectionsApi } from "../api/reflection";
import { errorMessage } from "../api/client";
import { EMOTIONS, MOODS, Mood } from "../lib/reflections";
import { colors, common } from "../theme/styles";

type Props = { onSaved?: (mood: Mood) => void };

export function MoodCheckIn({ onSaved }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function toggleEmotion(emotion: string) {
    setEmotions((current) =>
      current.includes(emotion)
        ? current.filter((item) => item !== emotion)
        : current.length < 3
          ? [...current, emotion]
          : current,
    );
  }

  async function save() {
    if (score === null) {
      setError("Choose how you are feeling first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // A safety check on the note will plug in here before saving.
      const mood = await reflectionsApi.createMood({
        score,
        emotions,
        note: note.trim(),
      });
      setSaved(true);
      onSaved?.(mood);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setScore(null);
    setEmotions([]);
    setNote("");
    setSaved(false);
    setError("");
  }

  if (saved) {
    return (
      <View style={common.card}>
        <Text
          style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}
        >
          Check-in saved
        </Text>
        <Text style={common.subtitle}>
          Thanks for taking a moment for yourself. Hard days count too.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={reset}
          style={{ marginTop: 14 }}
        >
          <Text style={common.link}>Check in again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={common.card}>
      <Text
        style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}
      >
        How are you feeling?
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        {MOODS.map((mood) => {
          const selected = score === mood.score;
          return (
            <Pressable
              key={mood.score}
              accessibilityRole="button"
              accessibilityLabel={mood.label}
              accessibilityState={{ selected }}
              onPress={() => setScore(mood.score)}
              style={{
                flex: 1,
                marginHorizontal: 3,
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: selected ? colors.brand : colors.line,
                backgroundColor: selected ? colors.brandSoft : colors.paper,
              }}
            >
              <Text style={{ fontSize: 26, color: colors.ink }}>
                {mood.icon}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: selected ? colors.brandDark : colors.muted,
                  marginTop: 4,
                }}
              >
                {mood.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[common.label, { marginTop: 20 }]}>
        What is behind it? Pick up to 3.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {EMOTIONS.map((emotion) => {
          const selected = emotions.includes(emotion);
          return (
            <Pressable
              key={emotion}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => toggleEmotion(emotion)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: selected ? colors.brand : colors.line,
                backgroundColor: selected ? colors.brandSoft : colors.paper,
              }}
            >
              <Text
                style={{
                  color: selected ? colors.brandDark : colors.ink,
                  fontSize: 14,
                }}
              >
                {emotion}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[common.label, { marginTop: 20 }]}>
        Anything to add? (optional)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="A few words about today"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={500}
        style={[common.input, { minHeight: 80, textAlignVertical: "top" }]}
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
        onPress={save}
        style={[common.button, { marginTop: 18, opacity: busy ? 0.7 : 1 }]}
      >
        {busy ? (
          <ActivityIndicator color={colors.paper} />
        ) : (
          <Text style={common.buttonText}>Save check-in</Text>
        )}
      </Pressable>
    </View>
  );
}
