import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { useAuth } from "../../../src/auth/AuthContext";
import { adminApi, Counts, Stats } from "../../../src/api/admin";
import { errorMessage } from "../../../src/api/client";
import { colors, common } from "../../../src/theme/styles";

const n = (c: Counts, k: string) => c[k] ?? 0;

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: colors.ink }}>{label}</Text>
      <Text style={{ color: colors.muted }}>{value}</Text>
    </View>
  );
}

function Title({ children }: React.PropsWithChildren) {
  return (
    <Text style={{ color: colors.brandDark, fontSize: 20, fontWeight: "700" }}>
      {children}
    </Text>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: "people-outline" | "flag-outline" | "calendar-outline";
}) {
  return (
    <View
      style={[
        common.card,
        { flexBasis: "45%", flexGrow: 1, marginTop: 0, minWidth: 140 },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.brand} />
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 12 }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.ink,
          fontSize: 28,
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function AdminContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!isAdmin) return;
    adminApi
      .stats()
      .then(setStats)
      .catch((e) => setError(errorMessage(e)));
  }, [isAdmin]);

  useFocusEffect(load);

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      <BackLink href="/screens/account" />
      <Text style={[common.title, { marginTop: 23 }]}>
        {isAdmin ? "Admin" : "Moderation"}
      </Text>
      <Text style={common.subtitle}>
        You see content only. Authors stay anonymous.
      </Text>

      {!!error && (
        <Text style={[common.error, { marginTop: 14 }]}>{error}</Text>
      )}

      {isAdmin && stats && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 22,
          }}
        >
          <MetricCard
            label="Registered accounts"
            value={stats.users.total}
            icon="people-outline"
          />
          <MetricCard
            label="Needs review"
            value={stats.needsReview}
            icon="flag-outline"
          />
          <MetricCard
            label="Pending consults"
            value={n(stats.consults, "pending")}
            icon="calendar-outline"
          />
        </View>
      )}

      <View style={[common.card, { marginTop: 22 }]}>
        <Title>Review queue</Title>
        {isAdmin && stats && (
          <Text
            style={{
              color: colors.ink,
              fontSize: 28,
              fontWeight: "700",
              marginTop: 10,
            }}
          >
            {stats.needsReview}
            <Text
              style={{ color: colors.muted, fontSize: 15, fontWeight: "400" }}
            >
              {" "}
              waiting for review
            </Text>
          </Text>
        )}
        <Link
          href="/screens/admin/queue"
          style={[common.link, { marginTop: 14 }]}
        >
          Open review queue
        </Link>
      </View>

      {isAdmin && stats && (
        <>
          <View style={common.card}>
            <Title>People</Title>
            <View style={{ marginTop: 8 }}>
              <Row label="Accounts" value={stats.users.total} />
              <Row
                label="New in the last 7 days"
                value={stats.users.last7Days}
              />
            </View>
          </View>

          <View style={common.card}>
            <Title>Resonance</Title>
            <View style={{ marginTop: 8 }}>
              <Row label="Posts live" value={n(stats.posts, "published")} />
              <Row label="Posts held" value={n(stats.posts, "held")} />
              <Row label="Posts hidden" value={n(stats.posts, "hidden")} />
              <Row
                label="Comments live"
                value={n(stats.comments, "published")}
              />
              <Row label="Comments held" value={n(stats.comments, "held")} />
              <Row
                label="Comments hidden"
                value={n(stats.comments, "hidden")}
              />
            </View>
          </View>

          <View style={common.card}>
            <Title>Consult requests</Title>
            <View style={{ marginTop: 8 }}>
              <Row label="Pending" value={n(stats.consults, "pending")} />
              <Row label="Accepted" value={n(stats.consults, "accepted")} />
              <Row label="Declined" value={n(stats.consults, "declined")} />
              <Row label="Cancelled" value={n(stats.consults, "cancelled")} />
            </View>
            <Link
              href={"/screens/admin/consults"}
              style={[common.link, { marginTop: 10 }]}
            >
              View requests
            </Link>
          </View>

          <View style={common.card}>
            <Title>Activity log</Title>
            <Text style={[common.subtitle, { fontSize: 15 }]}>
              Who approved or deleted what.
            </Text>
            <Link
              href="/screens/admin/audit"
              style={[common.link, { marginTop: 10 }]}
            >
              Open activity log
            </Link>
          </View>
        </>
      )}
    </ScrollView>
  );
}

export default function AdminScreen() {
  return (
    <RequireAuth>
      <RequireStaff>
        <AdminContent />
      </RequireStaff>
    </RequireAuth>
  );
}
