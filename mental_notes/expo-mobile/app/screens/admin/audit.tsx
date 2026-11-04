import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { adminApi, AuditRow } from "../../../src/api/admin";
import type { Analytics, AnalyticsRange } from "../../../src/api/admin";
import { AdminTrendChart } from "../../../src/components/AdminTrendChart";
import { errorMessage } from "../../../src/api/client";
import { formatDate } from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

function AuditContent() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [range, setRange] = useState<AnalyticsRange>("24h");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminApi
      .audit()
      .then(setRows)
      .catch((e) => setError(errorMessage(e)));
    adminApi
      .analytics(range)
      .then(setAnalytics)
      .catch((e) => setError(errorMessage(e)));
  }, [range]);

  useFocusEffect(load);

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      <BackLink href="/screens/admin" />
      <Text style={[common.title, { marginTop: 23 }]}>Activity log</Text>
      <Text style={common.subtitle}>The last 50 moderation actions.</Text>
      {analytics && (
        <AdminTrendChart
          title="Actions over time"
          buckets={analytics.buckets}
          range={range}
          onRangeChange={setRange}
          series={[
            { key: "activity", label: "Actions", color: "#5575A6" },
            { key: "approved", label: "Approved", color: colors.brand },
            { key: "deleted", label: "Deleted", color: colors.risk },
          ]}
        />
      )}
      {!!error && (
        <Text style={[common.error, { marginTop: 14 }]}>{error}</Text>
      )}
      {!rows && !error && (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
      )}
      {rows && rows.length === 0 && (
        <Text style={[common.subtitle, { marginTop: 24 }]}>Nothing yet.</Text>
      )}
      {rows?.map((r) => (
        <View key={r._id} style={common.card}>
          <Text style={{ color: colors.ink }}>
            {r.admin} {r.action === "approve" ? "approved" : "deleted"} a{" "}
            {r.targetType}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
            {formatDate(r.createdAt)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function AuditScreen() {
  return (
    <RequireAuth>
      <RequireStaff adminOnly>
        <AuditContent />
      </RequireStaff>
    </RequireAuth>
  );
}
