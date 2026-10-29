import { Stack } from "expo-router";
import { colors } from "../../../src/theme/styles";

export default function ResonanceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.brand,
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Resonance" }} />
      <Stack.Screen name="compose" options={{ title: "New post" }} />
    </Stack>
  );
}
