import { useEffect, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { SupportCard } from "../../src/components/SupportCard";
import { reflectionsApi, SafetyLevel } from "../../src/api/reflection";
import { errorMessage } from "../../src/api/client";
import { JOURNAL_PROMPTS } from "../../src/lib/reflections";
import { colors, common } from "../../src/theme/styles";

function EditorContent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const editing = !!id;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [safety, setSafety] = useState<SafetyLevel>("none");

  useEffect(() => {
    if (!id) return;
    reflectionsApi
      .entry(id)
      .then((entry) => {
        setTitle(entry.title);
        setBody(entry.body);
        setPrompt(entry.prompt);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!body.trim()) {
      setError("Write a few words before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const input = { title: title.trim(), body: body.trim(), prompt };
      const saved = id
        ? await reflectionsApi.updateEntry(id, input)
        : await reflectionsApi.createEntry(input);
      const level = saved.safety ?? "none";
      if (level !== "none") {
        // The entry is saved. Show support before leaving the screen.
        setSafety(level);
        setBusy(false);
        return;
      }
      router.back();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert("Delete this entry?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await reflectionsApi.deleteEntry(id);
            router.back();
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (safety !== "none") {
    return (
      <ScrollView
        style={common.screen}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 28,
          paddingBottom: 48,
        }}
      >
        <Text style={common.title}>Entry saved</Text>
        <SupportCard
          level={safety}
          onContinue={() => router.back()}
          continueLabel="Back to journal"
        />
      </ScrollView>
    );
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
        <Link href="/journal" style={common.link}>
          Back
        </Link>
        <Text style={[common.title, { marginTop: 18 }]}>
          {editing ? "Edit entry" : "New entry"}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={colors.brand} />
        ) : (
          <>
            {!prompt && !editing && (
              <View style={{ marginTop: 16 }}>
                <Text style={common.label}>Need a starting point?</Text>
                {JOURNAL_PROMPTS.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    onPress={() => setPrompt(item)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: colors.paper,
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: colors.ink, lineHeight: 21 }}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {!!prompt && (
              <View
                style={[
                  common.card,
                  {
                    backgroundColor: colors.brandSoft,
                    borderColor: colors.brandSoft,
                  },
                ]}
              >
                <Text style={{ color: colors.brandDark, lineHeight: 22 }}>
                  {prompt}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPrompt("")}
                  style={{ marginTop: 8 }}
                >
                  <Text style={common.link}>Remove prompt</Text>
                </Pressable>
              </View>
            )}

            <Text style={[common.label, { marginTop: 18 }]}>
              Title (optional)
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="A few words"
              placeholderTextColor={colors.muted}
              maxLength={120}
              style={common.input}
            />

            <Text style={[common.label, { marginTop: 18 }]}>
              What is on your mind?
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write freely"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={10000}
              style={[
                common.input,
                { minHeight: 220, textAlignVertical: "top" },
              ]}
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
              style={[
                common.button,
                { marginTop: 18, opacity: busy ? 0.7 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={common.buttonText}>Save entry</Text>
              )}
            </Pressable>

            {editing && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={confirmDelete}
                style={{ marginTop: 18, alignItems: "center" }}
              >
                <Text
                  style={{
                    color: colors.risk,
                    textDecorationLine: "underline",
                  }}
                >
                  Delete entry
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function JournalEditorScreen() {
  return (
    <RequireAuth>
      <EditorContent />
    </RequireAuth>
  );
}
