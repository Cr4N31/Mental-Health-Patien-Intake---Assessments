import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/styles";

export function RequireAuth({ children }: React.PropsWithChildren) {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.brand} /></View>;
  if (!user) return <Redirect href="/login" />;
  return children;
}
