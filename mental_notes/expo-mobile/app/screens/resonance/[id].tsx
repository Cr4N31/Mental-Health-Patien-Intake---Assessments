import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../../src/api/client";
import {
  resonanceApi,
  type ResonanceComment,
  type ResonancePost,
} from "../../../src/api/resonance";
import type { SafetyLevel } from "../../../src/api/reflection";
import { CommentRow } from "../../../src/components/resonance/CommentRow";
import { PostCard } from "../../../src/components/resonance/PostCard";
import { SupportCard } from "../../../src/components/SupportCard";
import { colors, common } from "../../../src/theme/styles";

const MAX = 500;

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listRef = useRef<FlatList<ResonanceComment>>(null);

  const [post, setPost] = useState<ResonancePost | null>(null);
  const [comments, setComments] = useState<ResonanceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [support, setSupport] = useState<{
    held: boolean;
    safety: SafetyLevel;
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([
          resonanceApi.get(id),
          resonanceApi.comments(id),
        ]);
        if (!active) return;
        setPost(p);
        setComments(c);
      } catch (e) {
        if (active) setLoadError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  function flipReaction() {
    setPost((p) =>
      p
        ? {
            ...p,
            reacted: !p.reacted,
            reactionCount: p.reactionCount + (p.reacted ? -1 : 1),
          }
        : p,
    );
  }

  async function toggleReaction() {
    flipReaction(); // optimistic
    try {
      const result = await resonanceApi.react(id);
      setPost((p) =>
        p
          ? {
              ...p,
              reacted: result.reacted,
              reactionCount: result.reactionCount,
            }
          : p,
      );
    } catch (e) {
      flipReaction(); // undo
      setError(errorMessage(e));
    }
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await resonanceApi.addComment(id, trimmed);
      setText("");
      const created = res.comment;
      if (created) {
        setComments((prev) => [...prev, created]);
        setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
      }
      if (res.held || res.safety !== "none") {
        setSupport({ held: !!res.held, safety: res.safety });
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  // Menus: owners get delete, everyone else gets report. Each asks for confirmation.
  function postMenu() {
    if (!post) return;
    if (post.isMine) {
      Alert.alert("Delete this post?", "Its comments will be deleted too.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await resonanceApi.remove(post._id);
              router.back();
            } catch (e) {
              Alert.alert("Could not delete", errorMessage(e));
            }
          },
        },
      ]);
    } else {
      Alert.alert(
        "Report this post?",
        "Posts reported by several people are hidden and reviewed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            style: "destructive",
            onPress: async () => {
              try {
                await resonanceApi.reportPost(post._id);
                Alert.alert("Thank you", "Your report was sent.");
                router.back();
              } catch (e) {
                Alert.alert("Could not report", errorMessage(e));
              }
            },
          },
        ],
      );
    }
  }

  function commentMenu(c: ResonanceComment) {
    if (c.isMine) {
      Alert.alert("Delete this comment?", undefined, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await resonanceApi.removeComment(c._id);
              setComments((prev) => prev.filter((x) => x._id !== c._id));
              setPost((p) =>
                p ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p,
              );
            } catch (e) {
              Alert.alert("Could not delete", errorMessage(e));
            }
          },
        },
      ]);
    } else {
      Alert.alert(
        "Report this comment?",
        "Comments reported by several people are hidden and reviewed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Report",
            style: "destructive",
            onPress: async () => {
              try {
                await resonanceApi.reportComment(c._id);
                // Hide it for this reader right away.
                setComments((prev) => prev.filter((x) => x._id !== c._id));
                Alert.alert("Thank you", "Your report was sent.");
              } catch (e) {
                Alert.alert("Could not report", errorMessage(e));
              }
            },
          },
        ],
      );
    }
  }

  if (loading) {
    return (
      <View
        style={[
          common.screen,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!post) {
    return (
      <View
        style={[
          common.screen,
          { alignItems: "center", justifyContent: "center", padding: 24 },
        ]}
      >
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>
          {loadError || "This post is not available."}
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={common.link}>Back to Resonance</Text>
        </Pressable>
      </View>
    );
  }

  const canSend = !!text.trim() && !sending;

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={comments}
        keyExtractor={(c) => c._id}
        renderItem={({ item }) => (
          <CommentRow comment={item} onMenu={() => commentMenu(item)} />
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <PostCard post={post} onReact={toggleReaction} onMenu={postMenu} />
            {support ? (
              <View style={{ marginTop: 6 }}>
                <Text
                  style={{ color: colors.ink, lineHeight: 22, marginTop: 8 }}
                >
                  {support.held
                    ? "Your comment was not shared with the community. Support is below."
                    : "Your comment is shared."}
                </Text>
                <SupportCard
                  level={support.safety}
                  onContinue={() => setSupport(null)}
                  continueLabel="Dismiss"
                />
              </View>
            ) : undefined}
            <Text
              style={{
                color: colors.ink,
                fontWeight: "700",
                fontSize: 16,
                marginTop: 22,
              }}
            >
              Comments
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[common.subtitle, { marginTop: 12 }]}>
            No comments yet. A kind word can mean a lot.
          </Text>
        }
      />

      {!!error && (
        <Text style={[common.error, { marginHorizontal: 20, marginBottom: 8 }]}>
          {error}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: colors.paper,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a kind reply"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={MAX}
          style={[
            common.input,
            { flex: 1, maxHeight: 110, paddingVertical: 10 },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          onPress={send}
          disabled={!canSend}
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.brand,
            alignItems: "center",
            justifyContent: "center",
            opacity: canSend ? 1 : 0.45,
          }}
        >
          {sending ? (
            <ActivityIndicator color={colors.paper} />
          ) : (
            <Ionicons name="send" size={19} color={colors.paper} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
