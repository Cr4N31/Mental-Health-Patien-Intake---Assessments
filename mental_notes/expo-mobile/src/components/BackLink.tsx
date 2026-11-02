import { Link, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, type StyleProp, type ViewStyle, Text } from "react-native";
import { colors } from "../theme/styles";

export function BackLink({
  href,
  style,
}: {
  href: Href;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="< Back"
        style={({ pressed }) => [
          {
            minHeight: 40,
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 2,
            paddingRight: 10,
            opacity: pressed ? 0.65 : 1,
            transform: [{ translateX: pressed ? -2 : 0 }],
          },
          style,
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.brandDark} />
        <Text style={{ color: colors.brandDark, fontSize: 15, fontWeight: "600" }}>
          Back
        </Text>
      </Pressable>
    </Link>
  );
}
