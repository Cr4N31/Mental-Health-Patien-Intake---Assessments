import { Link, Redirect } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { colors, common } from "../src/theme/styles";

export default function LandingScreen() {
  const { user, loading } = useAuth();
  if (!loading && user)
    return <Redirect href="/screens/reflections/dashboard" />;
  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 36 }}
    >
      <Text
        style={{ color: colors.brandDark, fontSize: 22, fontWeight: "700" }}
      >
        Mental Notes
      </Text>
      <View style={{ marginTop: 64 }}>
        <Text style={[common.title, { fontSize: 38, lineHeight: 45 }]}>
          Check in with how you are feeling
        </Text>
        <Text
          style={[
            common.subtitle,
            { fontSize: 18, lineHeight: 27, marginTop: 18 },
          ]}
        >
          Take short, widely used questionnaires for low mood and anxiety,
          understand what your scores mean, and watch how they change over time.
        </Text>
        <Link
          href="/auth/signup"
          style={[
            common.buttonText,
            {
              backgroundColor: colors.brand,
              overflow: "hidden",
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 18,
              marginTop: 26,
              alignSelf: "flex-start",
            },
          ]}
        >
          Create your account
        </Link>
        <Link href="/auth/login" style={[common.link, { marginTop: 20 }]}>
          I already have an account
        </Link>
      </View>
      <View style={[common.card, { marginTop: 48 }]}>
        <Text
          style={{ color: colors.brandDark, fontSize: 23, fontWeight: "700" }}
        >
          How it works
        </Text>
        <Text style={[common.subtitle, { lineHeight: 24 }]}>
          1. Create an account with your email.{"\n\n"}2. Take a short check-in
          for low mood or anxiety.{"\n\n"}3. Track your score over time.
        </Text>
      </View>
      <View style={[common.card, { marginTop: 16 }]}>
        <Text
          style={{ color: colors.brandDark, fontSize: 23, fontWeight: "700" }}
        >
          Your results are yours
        </Text>
        <Text style={common.subtitle}>
          Questionnaires are screening tools, not a diagnosis, and do not
          replace advice from a qualified health professional.
        </Text>
      </View>
    </ScrollView>
  );
}
