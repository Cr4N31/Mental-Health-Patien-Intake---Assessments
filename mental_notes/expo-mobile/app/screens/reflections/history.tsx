import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import api, { errorMessage } from "../../../src/api/client";
import {
  formatDate,
  FORM_INFO,
  FORM_TYPES,
  FormType,
  severityLabel,
} from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

type Assessment = {
  _id: string;
  type: FormType;
  totalScore: number;
  severity: string;
  completedAt: string;
};
type Filter = "ALL" | FormType;

function HistoryContent() {
  const [items, setItems] = useState<Assessment[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    api
      .get<Assessment[]>("/assessments")
      .then((res) => setItems(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);
  const shown = useMemo(
    () =>
      items?.filter((item) => filter === "ALL" || item.type === filter) ?? [],
    [items, filter],
  );
  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 42, flexGrow: 1 }}
      data={shown}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={
        <View>
          <Link href="/screens/reflections/dashboard" style={common.link}>
            ‹ Back to dashboard
          </Link>
          <Text style={[common.title, { marginTop: 23 }]}>Your history</Text>
          <Text style={common.subtitle}>
            Your past screening check-ins, newest first.
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 22,
            }}
          >
            {(["ALL", ...FORM_TYPES] as Filter[]).map((value) => {
              const selected = filter === value;
              const label = value === "ALL" ? "All" : FORM_INFO[value].name;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setFilter(value)}
                  style={{
                    borderColor: selected ? colors.brand : colors.line,
                    borderWidth: 1,
                    borderRadius: 7,
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    backgroundColor: selected ? colors.brand : colors.paper,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.paper : colors.ink,
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={[common.error, { marginTop: 20 }]}
            >
              {error}
            </Text>
          )}
          {!items && !error && (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
          )}
        </View>
      }
      ListEmptyComponent={
        items && !error ? (
          <Text style={[common.subtitle, { marginTop: 20 }]}>
            No results yet.
          </Text>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/results/[id]", params: { id: item._id } })
          }
          style={[
            common.card,
            {
              marginTop: 12,
              padding: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <View>
            <Text
              style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}
            >
              {FORM_INFO[item.type].name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
              {formatDate(item.completedAt)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: colors.ink, fontWeight: "600" }}>
              {item.totalScore} / {FORM_INFO[item.type].max}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {severityLabel(item.severity)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

export default function HistoryScreen() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}
