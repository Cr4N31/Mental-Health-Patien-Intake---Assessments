import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import {
  alliesApi,
  ConsultRequest,
  ConsultStatus,
} from "../../../src/api/allies";
import { errorMessage } from "../../../src/api/client";
import { shortDate } from "../../../src/lib/reflections";
import { colors, common } from "../../../src/theme/styles";

const STATUS_LABEL: Record<ConsultStatus, string> = {
  pending: "Sent, waiting for a reply",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
};

function RequestsContent() {
  const [items, setItems] = useState<ConsultRequest[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    alliesApi
      .mine()
      .then(setItems)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useFocusEffect(load);

  function confirmCancel(id: string) {
    Alert.alert(
      "Cancel this request?",
      "The professional may already have received it.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: async () => {
            try {
              await alliesApi.cancel(id);
              load();
            } catch (err) {
              setError(errorMessage(err));
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        paddingBottom: 48,
      }}
    >
      <Link href="/screens/allies/index" style={common.link}>
        Back
      </Link>
      <Text style={[common.title, { marginTop: 18 }]}>My requests</Text>

      {!!error && (
        <Text
          accessibilityRole="alert"
          style={[common.error, { marginTop: 18 }]}
        >
          {error}
        </Text>
      )}
      {!items && !error && (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.brand} />
      )}

      {items && items.length === 0 && (
        <View style={common.card}>
          <Text
            style={{ color: colors.brandDark, fontSize: 18, fontWeight: "700" }}
          >
            No requests yet
          </Text>
          <Text style={common.subtitle}>
            When you contact a professional, your requests will show up here.
          </Text>
        </View>
      )}

      {items?.map((item) => (
        <View key={item._id} style={common.card}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {shortDate(item.createdAt)}
          </Text>
          <Text
            style={{
              color: colors.ink,
              fontSize: 18,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            {item.professional?.name ?? "Professional no longer listed"}
          </Text>
          {!!item.professional?.isSample && (
            <Text style={{ color: colors.risk, fontSize: 12, marginTop: 2 }}>
              Sample profile
            </Text>
          )}
          <Text style={{ color: colors.brand, marginTop: 8 }}>
            {STATUS_LABEL[item.status]}
          </Text>
          <Text
            style={{ color: colors.muted, lineHeight: 21, marginTop: 8 }}
            numberOfLines={3}
          >
            {item.message}
          </Text>
          {item.status === "pending" && (
            <Pressable
              accessibilityRole="button"
              onPress={() => confirmCancel(item._id)}
              style={{ marginTop: 12 }}
            >
              <Text
                style={{ color: colors.risk, textDecorationLine: "underline" }}
              >
                Cancel request
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export default function RequestsScreen() {
  return (
    <RequireAuth>
      <RequestsContent />
    </RequireAuth>
  );
}
