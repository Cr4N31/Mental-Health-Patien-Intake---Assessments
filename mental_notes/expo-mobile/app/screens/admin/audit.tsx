import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { adminApi, AuditRow } from "../../../src/api/admin";
import { errorMessage } from "../../../src/api/client";
import { formatDate } from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

function AuditContent() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminApi
      .audit()
      .then(setRows)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useFocusEffect(load);

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      <BackLink href="/screens/admin" />
      <Text style={[common.title, { marginTop: 23 }]}>Activity log</Text>
      <Text style={common.subtitle}>The last 50 moderation actions.</Text>
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
