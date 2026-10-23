import { Linking, Pressable, Text, View } from "react-native";
import type { SafetyLevel } from "../api/reflection";
import { CRISIS_RESOURCES, EMERGENCY_NOTE } from "../config/crisis";
import { colors, common } from "../theme/styles";

type Props = {
  level: SafetyLevel;
  onContinue?: () => void;
  continueLabel?: string;
};

export function SupportCard({
  level,
  onContinue,
  continueLabel = "Continue",
}: Props) {
  if (level === "none") return null;
  const high = level === "high";

  return (
    <View
      style={[
        common.card,
        { backgroundColor: colors.riskSoft, borderColor: colors.riskSoft },
      ]}
    >
      <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "700" }}>
        {high
          ? "You do not have to carry this alone"
          : "That sounds like a heavy day"}
      </Text>
      <Text style={[common.subtitle, { color: colors.ink }]}>
        {high
          ? "What you wrote matters, and so do you. Please reach out to someone now, a person you trust or one of the services below."
          : "Thank you for putting it into words. If things feel like too much, talking to someone you trust or a professional can help."}
      </Text>

      {CRISIS_RESOURCES.map((resource) => (
        <View key={resource.label} style={{ marginTop: 14 }}>
          <Text style={{ color: colors.ink, fontWeight: "700" }}>
            {resource.label}
          </Text>
          {!!resource.note && (
            <Text style={{ color: colors.muted, marginTop: 2 }}>
              {resource.note}
            </Text>
          )}
          {!!resource.phone && (
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL(`tel:${resource.phone!.replace(/\s+/g, "")}`)
              }
              style={{ marginTop: 4 }}
            >
              <Text style={common.link}>{resource.phone}</Text>
            </Pressable>
          )}
        </View>
      ))}

      {high && (
        <Text style={{ color: colors.ink, marginTop: 16, lineHeight: 22 }}>
          {EMERGENCY_NOTE}
        </Text>
      )}

      {onContinue && (
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={{ marginTop: 18 }}
        >
          <Text style={common.link}>{continueLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
