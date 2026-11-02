import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { adminApi, ConsultRow } from "../../../src/api/admin";
import { errorMessage } from "../../../src/api/client";
import { formatDate } from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

function ConsultsContent() {
  const [rows, setRows] = useState<ConsultRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminApi
      .consults()
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
      <Text style={[common.title, { marginTop: 23 }]}>Consult requests</Text>
      <Text style={common.subtitle}>
        Names and messages are private, so only the basics show here.
      </Text>
      {!!error && (
        <Text style={[common.error, { marginTop: 14 }]}>{error}</Text>
      )}
      {!rows && !error && (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
      )}
      {rows && rows.length === 0 && (
        <Text style={[common.subtitle, { marginTop: 24 }]}>
          No requests yet.
        </Text>
      )}
      {rows?.map((r) => (
        <View key={r._id} style={common.card}>
          <Text style={{ color: colors.ink, fontWeight: "600" }}>
            {r.professional}
          </Text>
          <Text style={{ color: colors.brand, marginTop: 4 }}>{r.status}</Text>
          {!!r.preferredTime && (
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Preferred time: {r.preferredTime}
            </Text>
          )}
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
            {formatDate(r.createdAt)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function ConsultsScreen() {
  return (
    <RequireAuth>
      <RequireStaff adminOnly>
        <ConsultsContent />
      </RequireStaff>
    </RequireAuth>
  );
}
