import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../src/components/RequireAuth";
import { MoodCheckIn } from "../src/components/MoodCheckin";
import { reflectionsApi } from "../src/api/reflection";
import { errorMessage } from "../src/api/client";
import { moodLabel, ReflectionInsights } from "../src/lib/reflections";
import { colors, common } from "../src/theme/styles";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "700" }}>
        {value}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function ReflectionsContent() {
  const [insights, setInsights] = useState<ReflectionInsights | null>(null);
  const [error, setError] = useState("");

  const loadInsights = useCallback(() => {
    reflectionsApi
      .insights()
      .then(setInsights)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const empty =
    insights && insights.checkInCount === 0 && insights.entryCount === 0;

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Link href="/dashboard" style={common.link}>
        Back
      </Link>
      <Text style={[common.title, { marginTop: 18 }]}>Reflections</Text>
      <Text style={common.subtitle}>
        A quiet place to notice how you are doing.
      </Text>

      <MoodCheckIn onSaved={loadInsights} />

      <View style={common.card}>
        <Text
          style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}
        >
          Journal
        </Text>
        <Text style={common.subtitle}>
          Write about your day, with or without a prompt.
        </Text>
        <Link href="/journal" style={[common.link, { marginTop: 14 }]}>
          Open journal
        </Link>
      </View>

      <View style={common.card}>
        <Text
          style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}
        >
          This week
        </Text>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={[common.error, { marginTop: 12 }]}
          >
            {error}
          </Text>
        )}
        {!insights && !error && (
          <ActivityIndicator style={{ marginTop: 16 }} color={colors.brand} />
        )}
        {empty && (
          <Text style={common.subtitle}>
            Your weekly summary will appear here after your first check-in.
          </Text>
        )}
        {insights && !empty && (
          <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
            <Stat label="check-ins" value={String(insights.checkInCount)} />
            <Stat label="entries" value={String(insights.entryCount)} />
            <Stat
              label={
                insights.averageMood
                  ? moodLabel(Math.round(insights.averageMood))
                  : "average mood"
              }
              value={insights.averageMood ? String(insights.averageMood) : "-"}
            />
            <Stat label="most felt" value={insights.topEmotion ?? "-"} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function ReflectionsScreen() {
  return (
    <RequireAuth>
      <ReflectionsContent />
    </RequireAuth>
  );
}
