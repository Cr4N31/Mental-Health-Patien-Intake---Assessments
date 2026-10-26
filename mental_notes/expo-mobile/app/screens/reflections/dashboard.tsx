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
import { useAuth } from "../../../src/auth/AuthContext";
import api, { errorMessage } from "../../../src/api/client";
import {
  changeText,
  formatDate,
  FORM_INFO,
  FORM_TYPES,
  FormType,
  severityLabel,
} from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";
import { ProgressChart } from "../../../src/components/ProgressChart";

type Assessment = {
  _id: string;
  type: FormType;
  totalScore: number;
  severity: string;
  completedAt: string;
};
type Summary = {
  latest: Assessment;
  change: number | null;
  count: number;
} | null;
type DashboardData = Record<FormType, Summary>;

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<Assessment[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get<DashboardData>("/assessments/latest")
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
    api
      .get<Assessment[]>("/assessments", { params: { limit: 100 } })
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]));
  }, []);
  async function signOut() {
    await logout();
    router.replace("/auth/login");
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{ color: colors.brandDark, fontSize: 21, fontWeight: "700" }}
        >
          Mental Notes
        </Text>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Link href="/screens/reflections/reflections" style={common.link}>
            Reflect
          </Link>
          <Link href="/screens/reflections/history" style={common.link}>
            History
          </Link>
          <Link href="/screens/profile" style={common.link}>
            Profile
          </Link>
          <Pressable onPress={signOut}>
            <Text
              style={{ color: colors.muted, textDecorationLine: "underline" }}
            >
              Log out
            </Text>
          </Pressable>
        </View>
      </View>
      {user && !user.emailVerified && (
        <View style={[common.card, { marginTop: 20 }]}>
          <Text style={{ color: colors.ink, lineHeight: 22 }}>
            Please verify your email address. We sent a link to {user.email}.
          </Text>
          <ResendVerification />
        </View>
      )}
      <Text style={[common.title, { marginTop: 34 }]}>
        Hello, {user?.name?.split(" ")[0]}
      </Text>
      <Text style={common.subtitle}>
        Take a check-in whenever you like. Your results are private to you.
      </Text>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={[common.error, { marginTop: 18 }]}
        >
          {error}
        </Text>
      )}
      {!data && !error && (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.brand} />
      )}
      {data &&
        FORM_TYPES.map((type) => {
          const info = FORM_INFO[type];
          const item = data[type];
          return (
            <View key={type} style={common.card}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                {info.topic}
              </Text>
              <Text
                style={{
                  color: colors.brandDark,
                  fontSize: 23,
                  fontWeight: "700",
                  marginTop: 3,
                }}
              >
                {info.name}
              </Text>
              <Text style={common.subtitle}>{info.blurb}</Text>
              {item?.latest ? (
                <>
                  <Text
                    style={{
                      fontSize: 29,
                      color: colors.ink,
                      fontWeight: "700",
                      marginTop: 16,
                    }}
                  >
                    {item.latest.totalScore}
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.muted,
                        fontWeight: "400",
                      }}
                    >
                      {" "}
                      / {info.max}
                    </Text>
                  </Text>
                  <Text style={{ color: colors.brand, marginTop: 4 }}>
                    {severityLabel(item.latest.severity)}
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 7 }}>
                    {formatDate(item.latest.completedAt)}.{" "}
                    {changeText(item.change)}
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 18, marginTop: 16 }}
                  >
                    <Link
                      href={{ pathname: "/assess/[type]", params: { type } }}
                      style={common.link}
                    >
                      Take again
                    </Link>
                    <Link
                      href={{
                        pathname: "/results/[id]",
                        params: { id: item.latest._id },
                      }}
                      style={common.link}
                    >
                      View result
                    </Link>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[common.subtitle, { marginTop: 14 }]}>
                    You have not taken this yet. It takes about 2 minutes.
                  </Text>
                  <Link
                    href={{ pathname: "/assess/[type]", params: { type } }}
                    style={[common.link, { marginTop: 15 }]}
                  >
                    Start check-in
                  </Link>
                </>
              )}
            </View>
          );
        })}
      {history && <ProgressChart items={history} />}
      {history && history.length > 0 && (
        <View style={[common.card, { marginTop: 26 }]}>
          <Text
            style={{ color: colors.brandDark, fontSize: 22, fontWeight: "700" }}
          >
            Recent check-ins
          </Text>
          {history.slice(0, 5).map((item) => (
            <View
              key={item._id}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                paddingVertical: 12,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.ink }}>
                {FORM_INFO[item.type].name} · {formatDate(item.completedAt)}
              </Text>
              <Text style={{ color: colors.muted }}>
                {item.totalScore} / {FORM_INFO[item.type].max}
              </Text>
            </View>
          ))}
          <Link
            href="/screens/reflections/history"
            style={[common.link, { marginTop: 14 }]}
          >
            View all history
          </Link>
        </View>
      )}
      <Text style={[common.subtitle, { marginTop: 24, fontSize: 13 }]}>
        These questionnaires are screening tools, not a diagnosis. If you are
        worried about how you feel, please talk to a qualified health
        professional.
      </Text>
    </ScrollView>
  );
}

function ResendVerification() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true);
    setError("");
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
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Pressable disabled={busy} onPress={resend}>
        <Text style={common.link}>{busy ? "Sending…" : "Resend email"}</Text>
      </Pressable>
      {!!message && <Text style={{ color: colors.muted }}>{message}</Text>}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.risk }}>
          {error}
        </Text>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
