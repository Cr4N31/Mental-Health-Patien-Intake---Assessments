import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { alliesApi, Filters, Professional } from "../../../src/api/allies";
import { errorMessage } from "../../../src/api/client";
import { colors, common } from "../../../src/theme/styles";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: selected ? colors.brand : colors.line,
        backgroundColor: selected ? colors.brandSoft : colors.paper,
      }}
    >
      <Text
        style={{
          color: selected ? colors.brandDark : colors.ink,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AlliesContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters | null>(null);
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [items, setItems] = useState<Professional[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    alliesApi
      .filters()
      .then(setFilters)
      .catch(() => setFilters({ specializations: [], languages: [] }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError("");
    alliesApi
      .list(specialization ? { specialization } : undefined)
      .then((data) => !cancelled && setItems(data))
      .catch((err) => {
        console.log(
          "allies error:",
          err?.message,
          err?.response?.status,
          err?.config?.baseURL,
          err?.config?.url,
        );
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [specialization]);

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        paddingBottom: 48,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Link href="/screens/reflections/dashboard" style={common.link}>
          Back
        </Link>
        <Link href="/screens/allies/requests" style={common.link}>
          My requests
        </Link>
      </View>
      <Text style={[common.title, { marginTop: 18 }]}>Talk to someone</Text>
      <Text style={common.subtitle}>
        Browse professionals and send a request. You choose who to contact.
      </Text>

      {!!filters && filters.specializations.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 18,
          }}
        >
          <Chip
            label="All"
            selected={specialization === null}
            onPress={() => setSpecialization(null)}
          />
          {filters.specializations.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={specialization === item}
              onPress={() =>
                setSpecialization(specialization === item ? null : item)
              }
            />
          ))}
        </View>
      )}

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
            No professionals found
          </Text>
          <Text style={common.subtitle}>
            Try another topic, or check back soon as more professionals join.
          </Text>
        </View>
      )}

      {items?.map((pro) => (
        <Pressable
          key={pro._id}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/screens/allies/[id]",
              params: { id: pro._id },
            })
          }
          style={common.card}
        >
          {pro.isSample && (
            <Text
              style={{
                color: colors.risk,
                fontSize: 12,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              SAMPLE PROFILE, NOT A REAL PERSON
            </Text>
          )}
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>
            {pro.name}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 2 }}>{pro.title}</Text>
          {!!pro.specializations.length && (
            <Text style={{ color: colors.brand, marginTop: 10 }}>
              {pro.specializations.join(" · ")}
            </Text>
          )}
          {!!pro.availabilityNote && (
            <Text style={{ color: colors.muted, marginTop: 6, fontSize: 13 }}>
              {pro.availabilityNote}
            </Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function AlliesScreen() {
  return (
    <RequireAuth>
      <AlliesContent />
    </RequireAuth>
  );
}
