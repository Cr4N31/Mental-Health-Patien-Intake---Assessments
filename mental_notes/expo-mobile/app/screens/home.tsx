import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { MoodCheckIn } from "../../src/components/MoodCheckin";
import { FadeIn } from "../../src/components/FadeIn";
import { useAuth } from "../../src/auth/AuthContext";
import { errorMessage } from "../../src/api/client";
import { reflectionsApi } from "../../src/api/reflection";
import { resonanceApi, ResonancePost } from "../../src/api/resonance";
import { moodLabel, ReflectionInsights } from "../../src/lib/reflections";
import { CRISIS_RESOURCES, EMERGENCY_NOTE } from "../../src/config/crisis";
import { BrandLogo } from "../../src/components/BrandLogo";
import { colors, common } from "../../src/theme/styles";

function CardTitle({
  children,
  icon,
}: React.PropsWithChildren<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
}>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.brandSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={19} color={colors.brandDark} />
      </View>
      <Text
        style={{ color: colors.brandDark, fontSize: 19, fontWeight: "700" }}
      >
        {children}
      </Text>
    </View>
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
  const [insightsError, setInsightsError] = useState("");
  const [postError, setPostError] = useState("");

  const load = useCallback(() => {
    setInsightsError("");
    setPostError("");
    reflectionsApi
      .insights()
      .then(setInsights)
      .catch((error) => setInsightsError(errorMessage(error)));
    resonanceApi
      .feed()
      .then((page) => setPost(page.posts[0] ?? null))
      .catch((error) => {
        setPost(null);
        setPostError(errorMessage(error));
      });
  }, []);

  useFocusEffect(load);

  const firstName = user?.name?.split(" ")[0];

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
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
        <BrandLogo />
      </View>

      <FadeIn delay={50}>
        <View
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: 24,
            backgroundColor: colors.brandSoft,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={colors.brandDark}
            />
            <Text
              style={{
                color: colors.brandDark,
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Your wellbeing space
            </Text>
          </View>
          <Text
            style={[
              common.title,
              { fontSize: 29, marginTop: 12, letterSpacing: -0.5 },
            ]}
          >
            Hello, {firstName}
          </Text>
          <Text style={[common.subtitle, { marginTop: 5 }]}>
            A gentle place to check in with yourself.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={110} style={{ marginTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Link href="/screens/reflections/dashboard" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 15,
                backgroundColor: pressed ? colors.brand : colors.brandDark,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Ionicons
                name="pulse-outline"
                size={19}
                color={colors.brandDark}
              />
              <Text style={{ color: colors.brandDark, fontWeight: "700" }}>
                Check in
              </Text>
            </Pressable>
          </Link>
          <Link href="/journal/editor" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 52,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: pressed ? colors.brandSoft : colors.paper,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={colors.brandDark}
              />
              <Text style={{ color: colors.brandDark, fontWeight: "700" }}>
                Write
              </Text>
            </Pressable>
          </Link>
        </View>
      </FadeIn>

      <FadeIn delay={170}>
        <MoodCheckIn onSaved={load} />
      </FadeIn>

      <FadeIn delay={220}>
        <View style={common.card}>
          <CardTitle icon="leaf-outline">Reflections</CardTitle>
          <Text style={common.subtitle}>
            {insightsError ? "Weekly summary unavailable." : weekLine(insights)}
          </Text>
          {!!insightsError && (
            <Text
              accessibilityRole="alert"
              style={[common.error, { marginTop: 8 }]}
            >
              {insightsError}
            </Text>
          )}
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
            <Link href="/screens/reflections/dashboard" style={common.link}>
              Check-ins (PHQ-9, GAD-7)
            </Link>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={290}>
        <View style={common.card}>
          <CardTitle icon="chatbubble-ellipses-outline">Resonance</CardTitle>
          <Text style={[common.subtitle, { fontSize: 15 }]}>
            An anonymous space to share and be heard.
          </Text>
          {post && (
            <Link href={`/screens/resonance/${post._id}`} asChild>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.line,
                  marginTop: 14,
                  paddingTop: 12,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {post.pseudonym}
                  </Text>
                  <Text
                    style={{ color: colors.ink, lineHeight: 22, marginTop: 4 }}
                  >
                    {post.body.length > 140
                      ? `${post.body.slice(0, 140)}...`
                      : post.body}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </Link>
          )}
          {post === null && !postError && (
            <Text style={[common.subtitle, { fontSize: 15 }]}>
              Nothing here yet. You could be the first to share.
            </Text>
          )}
          {!!postError && (
            <Text
              accessibilityRole="alert"
              style={[common.error, { marginTop: 12 }]}
            >
              {postError}
            </Text>
          )}
          <Link
            href="/screens/resonance"
            style={[common.link, { marginTop: 14 }]}
          >
            Open Resonance
          </Link>
        </View>
      </FadeIn>

      <FadeIn delay={360}>
        <View style={common.card}>
          <CardTitle icon="people-outline">Allies</CardTitle>
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
      </FadeIn>

      <FadeIn delay={410}>
        <View style={[common.card, { opacity: 0.75 }]}>
          <CardTitle icon="mic-outline">Echo</CardTitle>
          <Text style={[common.subtitle, { fontSize: 15 }]}>
            Coming soon. A calm space to talk things through.
          </Text>
        </View>
      </FadeIn>

      <FadeIn delay={460}>
        <View style={[common.card, { backgroundColor: colors.riskSoft }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <Ionicons name="heart-outline" size={20} color={colors.risk} />
            <Text
              style={{ color: colors.risk, fontSize: 18, fontWeight: "700" }}
            >
              Need to talk to someone now?
            </Text>
          </View>
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
              style={({ pressed }) => ({
                marginTop: 12,
                padding: 10,
                borderRadius: 10,
                backgroundColor: pressed ? "#F2DAD7" : colors.paper,
                opacity: r.phone ? 1 : 0.7,
              })}
            >
              <Text style={{ color: colors.ink, fontWeight: "600" }}>
                {r.label}
              </Text>
              {!!r.phone && <Text style={common.link}>Call {r.phone}</Text>}
            </Pressable>
          ))}
        </View>
      </FadeIn>
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
