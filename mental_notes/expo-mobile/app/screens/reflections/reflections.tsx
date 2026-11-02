import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { MoodCheckIn } from "../../../src/components/MoodCheckin";
import { reflectionsApi } from "../../../src/api/reflection";
import { errorMessage } from "../../../src/api/client";
import { moodLabel, ReflectionInsights } from "../../../src/lib/reflections";
import { colors, common } from "../../../src/theme/styles";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexBasis: "45%",
        flexGrow: 1,
        minWidth: 120,
        minHeight: 82,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: colors.brandSoft,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          maxWidth: "100%",
          color: colors.ink,
          fontSize: 22,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: colors.muted,
          fontSize: 12,
          marginTop: 4,
          textAlign: "center",
        }}
      >
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
      <BackLink href="/screens/home" />
      <Text style={[common.title, { marginTop: 18 }]}>Reflections</Text>
      <Text style={common.subtitle}>
        A quiet place to notice how you are doing.
      </Text>

      <MoodCheckIn onSaved={loadInsights} />

      <View style={common.card}>
        <Text
          style={{
            color: colors.brandDark,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
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
          style={{
            color: colors.brandDark,
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
          }}
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
          <Text style={[common.subtitle, { textAlign: "center" }]}>
            Your weekly summary will appear here after your first check-in.
          </Text>
        )}
        {insights && !empty && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 16,
              gap: 10,
            }}
          >
            <Stat label="Check-ins" value={String(insights.checkInCount)} />
            <Stat label="journal Entries" value={String(insights.entryCount)} />
            <Stat
              label={
                insights.averageMood
                  ? moodLabel(Math.round(insights.averageMood))
                  : "average mood"
              }
              value={insights.averageMood ? String(insights.averageMood) : "-"}
            />
            <Stat label="Most felt" value={insights.topEmotion ?? "-"} />
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
