import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ResonancePost } from "../../api/resonance";
import { timeAgo } from "../../lib/timeAgo";
import { colors, common } from "../../theme/styles";

type Props = {
  post: ResonancePost;
  onReact: (id: string) => void;
  onPress?: () => void;
};

export function PostCard({ post, onReact, onPress }: Props) {
  const content = (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.ink, fontWeight: "700" }}>
          {post.pseudonym}
          {post.isMine ? " (you)" : ""}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {timeAgo(post.createdAt)}
        </Text>
      </View>
      <Text
        style={{
          color: colors.ink,
          fontSize: 16,
          lineHeight: 23,
          marginTop: 10,
        }}
      >
        {post.body}
      </Text>
    </>
  );

  return (
    <View style={common.card}>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
          {content}
        </Pressable>
      ) : (
        <View>{content}</View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 14,
          gap: 22,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            post.reacted ? "Remove your reaction" : "This resonates with me"
          }
          onPress={() => onReact(post._id)}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons
            name={post.reacted ? "heart" : "heart-outline"}
            size={20}
            color={post.reacted ? colors.brand : colors.muted}
          />
          <Text style={{ color: post.reacted ? colors.brand : colors.muted }}>
            {post.reactionCount}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
          <Text style={{ color: colors.muted }}>{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}
