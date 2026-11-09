import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { useAuth, Role } from "../../../src/auth/AuthContext";
import { adminApi, Person } from "../../../src/api/admin";
import { errorMessage } from "../../../src/api/client";
import { formatDate } from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

const ROLES: Role[] = ["user", "moderator", "admin"];

function PersonCard({
  p,
  isSelf,
  onDone,
}: {
  p: Person;
  isSelf: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(p.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminApi.setRole(p._id, role, password);
      setOpen(false);
      setPassword("");
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={common.card}>
      <Text style={{ color: colors.ink, fontWeight: "600", fontSize: 16 }}>
        {p.name}
        {isSelf ? " (you)" : ""}
      </Text>
      <Text style={{ color: colors.muted, marginTop: 2 }}>{p.email}</Text>
      <Text style={{ color: colors.brand, marginTop: 6 }}>Role: {p.role}</Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
        {p.emailVerified ? "Email verified" : "Email not verified"} · Joined{" "}
        {formatDate(p.createdAt)}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
        {p.lastLoginAt
          ? `Last login ${formatDate(p.lastLoginAt)}`
          : "No login recorded yet"}
      </Text>

      {!isSelf && !open && (
        <Pressable onPress={() => setOpen(true)} style={{ marginTop: 12 }}>
          <Text style={common.link}>Change role</Text>
        </Pressable>
      )}

      {open && (
        <View style={{ marginTop: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {ROLES.map((r) => {
              const active = r === role;
              return (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={{
                    borderWidth: 1,
                    borderColor: active ? colors.brand : colors.line,
                    backgroundColor: active ? colors.brandSoft : colors.paper,
                    borderRadius: 999,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{ color: active ? colors.brandDark : colors.ink }}
                  >
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={common.label}>Your password, to confirm</Text>
          <TextInput
            accessibilityLabel="Your password"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            style={common.input}
          />
          {!!error && <Text style={common.error}>{error}</Text>}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              disabled={busy || role === p.role || !password}
              onPress={save}
              style={[common.button, { paddingVertical: 10 }]}
            >
              <Text style={common.buttonText}>
                {busy ? "Saving..." : "Confirm"}
              </Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => {
                setOpen(false);
                setRole(p.role);
                setPassword("");
                setError("");
              }}
              style={{ justifyContent: "center" }}
            >
              <Text style={{ color: colors.muted }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function PeopleContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [rows, setRows] = useState<Person[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback((term: string) => {
    setError("");
    adminApi
      .people(term)
      .then(setRows)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(applied);
    }, [load, applied]),
  );

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Link href="/screens/admin" style={common.link}>
        ‹ Back
      </Link>
      <Text style={[common.title, { marginTop: 23 }]}>Accounts</Text>
      <Text style={common.subtitle}>
        Newest first, 30 at a time. Search by name or email.
      </Text>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        <TextInput
          accessibilityLabel="Search accounts"
          autoCapitalize="none"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setApplied(query.trim())}
          placeholder="Search"
          style={[common.input, { flex: 1 }]}
        />
        <Pressable
          onPress={() => setApplied(query.trim())}
          style={[common.button, { paddingHorizontal: 16 }]}
        >
          <Text style={common.buttonText}>Search</Text>
        </Pressable>
      </View>

      {!!error && (
        <Text style={[common.error, { marginTop: 14 }]}>{error}</Text>
      )}
      {!rows && !error && (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
      )}
      {rows && rows.length === 0 && (
        <Text style={[common.subtitle, { marginTop: 24 }]}>
          No accounts found.
        </Text>
      )}
      {rows?.map((p) => (
        <PersonCard
          key={p._id}
          p={p}
          isSelf={p._id === user?.id}
          onDone={() => load(applied)}
        />
      ))}
    </ScrollView>
  );
}

export default function PeopleScreen() {
  return (
    <RequireAuth>
      <RequireStaff adminOnly>
        <PeopleContent />
      </RequireStaff>
    </RequireAuth>
  );
}
