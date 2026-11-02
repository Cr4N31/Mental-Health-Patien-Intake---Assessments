import { useState } from "react";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../src/components/RequireAuth";
import { FadeIn } from "../../src/components/FadeIn";
import { useAuth } from "../../src/auth/AuthContext";
import api, { errorMessage } from "../../src/api/client";
import { colors, common } from "../../src/theme/styles";

function ProfileRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        minHeight: 68,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.brandSoft,
        }}
      >
        <Ionicons name={icon} size={19} color={colors.brandDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </View>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const initials =
    user?.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  async function resend() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/resend-verification");
      setMessage(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
    >
      <FadeIn>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={[common.title, { fontSize: 26 }]}>My profile</Text>
            <Text style={[common.subtitle, { marginTop: 3 }]}>
              Your account, all in one place.
            </Text>
          </View>
          <Link href="/screens/account" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 15,
                backgroundColor: pressed ? colors.brandSoft : colors.paper,
                borderWidth: 1,
                borderColor: colors.line,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.94 : 1 }],
              })}
            >
              <Ionicons name="settings-outline" size={20} color={colors.brandDark} />
            </Pressable>
          </Link>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
            marginTop: 16,
            backgroundColor: colors.brandSoft,
            borderRadius: 24,
          }}
        >
          <View
            style={{
              width: 82,
              height: 82,
              borderRadius: 41,
              backgroundColor: colors.brandDark,
              borderWidth: 4,
              borderColor: colors.paper,
              alignItems: "center",
              justifyContent: "center",
              elevation: 3,
            }}
          >
            <Text style={{ color: colors.paper, fontSize: 27, fontWeight: "700" }}>
              {initials}
            </Text>
          </View>
          <Text
            style={{
              color: colors.ink,
              fontSize: 22,
              fontWeight: "700",
              marginTop: 12,
            }}
          >
            {user?.name}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            {user?.email}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: colors.paper,
            }}
          >
            <Ionicons
              name={user?.emailVerified ? "checkmark-circle" : "time-outline"}
              size={15}
              color={user?.emailVerified ? colors.brandDark : colors.muted}
            />
            <Text
              style={{
                color: user?.emailVerified ? colors.brandDark : colors.muted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {user?.emailVerified ? "Email verified" : "Verify your email"}
            </Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={150}>
        <View style={[common.card, { padding: 16, marginTop: 18 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}>
              Account details
            </Text>
            <Link href="/screens/account" asChild>
              <Pressable accessibilityRole="button" hitSlop={8}>
                <Text style={{ color: colors.brandDark, fontWeight: "600" }}>
                  Settings
                </Text>
              </Pressable>
            </Link>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 13,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              gap: 12,
            }}
          >
            <Ionicons name="mail-outline" size={19} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>EMAIL</Text>
              <Text style={{ color: colors.ink, fontSize: 14, marginTop: 3 }}>
                {user?.email}
              </Text>
            </View>
          </View>
          {!user?.emailVerified && (
            <Pressable
              accessibilityRole="button"
              onPress={resend}
              disabled={busy}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                borderRadius: 10,
                backgroundColor: pressed ? colors.brandSoft : colors.paper,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 12,
                paddingVertical: 9,
                opacity: busy ? 0.6 : 1,
              })}
            >
              <Text style={{ color: colors.brandDark, fontWeight: "600" }}>
                {busy ? "Sending…" : "Resend verification"}
              </Text>
            </Pressable>
          )}
          {!!message && (
            <Text style={{ color: colors.brandDark, fontSize: 13, marginTop: 10 }}>
              {message}
            </Text>
          )}
          {!!error && (
            <Text accessibilityRole="alert" style={[common.error, { marginTop: 10 }]}>
              {error}
            </Text>
          )}
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <View style={[common.card, { padding: 16 }]}>
          <Text
            style={{
              color: colors.ink,
              fontSize: 17,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            Your space
          </Text>
          <Link href="/screens/reflections/dashboard" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                backgroundColor: pressed ? colors.brandSoft : "transparent",
                borderRadius: 12,
                paddingHorizontal: 6,
              })}
            >
              <ProfileRow
                icon="pulse-outline"
                title="Check-in history"
                subtitle="Review your recent check-ins"
              />
            </Pressable>
          </Link>
          <Link href="/journal" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                backgroundColor: pressed ? colors.brandSoft : "transparent",
                borderRadius: 12,
                paddingHorizontal: 6,
              })}
            >
              <ProfileRow
                icon="book-outline"
                title="Journal"
                subtitle="Your private reflections"
              />
            </Pressable>
          </Link>
          <Link href="/screens/allies/requests" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.brandSoft : "transparent",
                borderRadius: 12,
                paddingHorizontal: 6,
              })}
            >
              <ProfileRow
                icon="people-outline"
                title="Ally requests"
                subtitle="See your professional support requests"
              />
            </Pressable>
          </Link>
        </View>
      </FadeIn>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
