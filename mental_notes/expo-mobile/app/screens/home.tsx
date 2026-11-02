import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Linking,
  Pressable,
  Image,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { MoodCheckIn } from "../../src/components/MoodCheckin";
import { useAuth } from "../../src/auth/AuthContext";
import { reflectionsApi } from "../../src/api/reflection";
import { resonanceApi, ResonancePost } from "../../src/api/resonance";
import { moodLabel, ReflectionInsights } from "../../src/lib/reflections";
import { CRISIS_RESOURCES, EMERGENCY_NOTE } from "../../src/config/crisis";
import { colors, common } from "../../src/theme/styles";

function CardTitle({ children }: React.PropsWithChildren) {
  return (
    <Text style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}>
      {children}
    </Text>
  );
}

function weekLine(i: ReflectionInsights | null) {
  if (!i) return "Loading your week...";
  if (i.checkInCount === 0 && i.entryCount === 0) {
    return "Your weekly summary appears after your first check-in.";
  }
  const mood = i.averageMood
    ? ` Average mood: ${moodLabel(Math.round(i.averageMood))}.`
    : "";
  return `This week: ${i.checkInCount} check-ins and ${i.entryCount} journal entries.${mood}`;
}

function HomeContent() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<ReflectionInsights | null>(null);
  const [post, setPost] = useState<ResonancePost | null | undefined>(undefined);

  const load = useCallback(() => {
    reflectionsApi
      .insights()
      .then(setInsights)
      .catch(() => {});
    resonanceApi
      .feed()
      .then((page) => setPost(page.posts[0] ?? null))
      .catch(() => setPost(null));
  }, []);

  useFocusEffect(load);

  const firstName = user?.name?.split(" ")[0];

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../assets/logo_x.png")}
          accessibilityLabel="PranatiX"
          resizeMode="contain"
          style={{ width: 36, height: 36 }}
        />
      </View>

      <Text style={[common.title, { marginTop: 26 }]}>Hello, {firstName}</Text>
      <Text style={common.subtitle}>
        A gentle place to check in with yourself.
      </Text>

      <MoodCheckIn onSaved={load} />

      <View style={common.card}>
        <CardTitle>Reflections</CardTitle>
        <Text style={common.subtitle}>{weekLine(insights)}</Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 18,
            marginTop: 14,
          }}
        >
          <Link href="/journal" style={common.link}>
            Open journal
          </Link>
          <Link href="/screens/reflections/reflections" style={common.link}>
            Weekly summary
          </Link>
          <Link href="/screens/home" style={common.link}>
            Check-ins (PHQ-9, GAD-7)
          </Link>
        </View>
      </View>

      <View style={common.card}>
        <CardTitle>Resonance</CardTitle>
        <Text style={[common.subtitle, { fontSize: 15 }]}>
          An anonymous space to share and be heard.
        </Text>
        {post && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.line,
              marginTop: 14,
              paddingTop: 12,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {post.pseudonym}
            </Text>
            <Text style={{ color: colors.ink, lineHeight: 22, marginTop: 4 }}>
              {post.body.length > 140
                ? `${post.body.slice(0, 140)}...`
                : post.body}
            </Text>
          </View>
        )}
        {post === null && (
          <Text style={[common.subtitle, { fontSize: 15 }]}>
            Nothing here yet. You could be the first to share.
          </Text>
        )}
        <Link
          href="/screens/resonance"
          style={[common.link, { marginTop: 14 }]}
        >
          Open Resonance
        </Link>
      </View>

      <View style={common.card}>
        <CardTitle>Allies</CardTitle>
        <Text style={[common.subtitle, { fontSize: 15 }]}>
          Connect with a professional when you want more support.
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 18,
            marginTop: 14,
          }}
        >
          <Link href="/screens/allies" style={common.link}>
            Find a professional
          </Link>
          <Link href="/screens/allies/requests" style={common.link}>
            My requests
          </Link>
        </View>
      </View>

      <View style={[common.card, { opacity: 0.75 }]}>
        <CardTitle>Echo</CardTitle>
        <Text style={[common.subtitle, { fontSize: 15 }]}>
          Coming soon. A calm space to talk things through.
        </Text>
      </View>

      <View style={[common.card, { backgroundColor: colors.riskSoft }]}>
        <Text style={{ color: colors.risk, fontSize: 18, fontWeight: "700" }}>
          Need to talk to someone now?
        </Text>
        <Text style={{ color: colors.ink, lineHeight: 22, marginTop: 8 }}>
          {EMERGENCY_NOTE}
        </Text>
        {CRISIS_RESOURCES.map((r) => (
          <Pressable
            key={r.label}
            disabled={!r.phone}
            onPress={() =>
              r.phone &&
              void Linking.openURL(`tel:${r.phone.replace(/\s/g, "")}`)
            }
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: colors.ink, fontWeight: "600" }}>
              {r.label}
            </Text>
            {!!r.phone && <Text style={common.link}>Call {r.phone}</Text>}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
