import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { reflectionsApi } from "../../src/api/reflection";
import { errorMessage } from "../../src/api/client";
import { JournalEntry, shortDate } from "../../src/lib/reflections";
import { colors, common } from "../../src/theme/styles";

function preview(body: string) {
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      setError("");
      reflectionsApi
        .entries()
        .then(setEntries)
        .catch((err) => setError(errorMessage(err)));
    }, []),
  );

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        paddingBottom: 48,
      }}
    >
      <Link href="/screens/reflections/reflections" style={common.link}>
        Back
      </Link>
      <Text style={[common.title, { marginTop: 18 }]}>Journal</Text>
      <Text style={common.subtitle}>
        Write whatever is on your mind. Only you can see it.
      </Text>
      <Link href="/journal/editor" asChild>
        <Pressable
          accessibilityRole="button"
          style={StyleSheet.flatten([common.button, { marginTop: 18 }])}
        >
          <Text style={common.buttonText}>New entry</Text>
        </Pressable>
      </Link>

      {!!error && (
        <Text
          accessibilityRole="alert"
          style={[common.error, { marginTop: 18 }]}
        >
          {error}
        </Text>
      )}
      {!entries && !error && (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.brand} />
      )}

      {entries && entries.length === 0 && (
        <View style={common.card}>
          <Text
            style={{ color: colors.brandDark, fontSize: 18, fontWeight: "700" }}
          >
            Nothing here yet
          </Text>
          <Text style={common.subtitle}>
            Start with a sentence. You can use a prompt if you are not sure
            where to begin.
          </Text>
        </View>
      )}

      {entries?.map((entry) => (
        <Link
          key={entry._id}
          href={{ pathname: "/journal/editor", params: { id: entry._id } }}
          asChild
        >
          <Pressable accessibilityRole="button" style={common.card}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {shortDate(entry.entryDate)}
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontSize: 18,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {entry.title || "Untitled"}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 21, marginTop: 6 }}>
              {preview(entry.body)}
            </Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

export default function JournalScreen() {
  return (
    <RequireAuth>
      <JournalContent />
    </RequireAuth>
  );
}
