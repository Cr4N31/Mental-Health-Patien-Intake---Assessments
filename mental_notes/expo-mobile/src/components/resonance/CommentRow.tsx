import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ResonanceComment } from "../../api/resonance";
import { timeAgo } from "../../lib/timeAgo";
import { colors } from "../../theme/styles";

type Props = { comment: ResonanceComment; onMenu: () => void };

export function CommentRow({ comment, onMenu }: Props) {
  const tags = [comment.isOP ? "author" : "", comment.isMine ? "you" : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginTop: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.ink, fontWeight: "600", flexShrink: 1 }}>
          {comment.pseudonym}
          {tags ? ` (${tags})` : ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {timeAgo(comment.createdAt)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            onPress={onMenu}
            hitSlop={10}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={colors.muted}
            />
          </Pressable>
        </View>
      </View>
      <Text
        style={{
          color: colors.ink,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 8,
        }}
      >
        {comment.body}
      </Text>
    </View>
  );
}
