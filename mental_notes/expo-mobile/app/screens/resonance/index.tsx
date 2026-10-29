import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { errorMessage } from "../../../src/api/client";
import { resonanceApi, type ResonancePost } from "../../../src/api/resonance";
import { PostCard } from "../../../src/components/resonance/PostCard";
import { colors, common } from "../../../src/theme/styles";

export default function ResonanceFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<ResonancePost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const busyMore = useRef(false);

  const loadFirst = useCallback(async (pullToRefresh: boolean) => {
    if (pullToRefresh) setRefreshing(true);
    try {
      const page = await resonanceApi.feed();
      setPosts(page.posts);
      setCursor(page.nextCursor);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refreshes quietly every time the tab or screen regains focus, e.g. after posting.
  useFocusEffect(
    useCallback(() => {
      loadFirst(false);
    }, [loadFirst]),
  );

  const loadMore = useCallback(async () => {
    if (!cursor || busyMore.current) return;
    busyMore.current = true;
    setLoadingMore(true);
    try {
      const page = await resonanceApi.feed(cursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...page.posts.filter((p) => !seen.has(p._id))];
      });
      setCursor(page.nextCursor);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      busyMore.current = false;
      setLoadingMore(false);
    }
  }, [cursor]);

  function flipReaction(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === id
          ? {
              ...p,
              reacted: !p.reacted,
              reactionCount: p.reactionCount + (p.reacted ? -1 : 1),
            }
          : p,
      ),
    );
  }

  async function toggleReaction(id: string) {
    flipReaction(id); // optimistic
    try {
      const result = await resonanceApi.react(id);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                reacted: result.reacted,
                reactionCount: result.reactionCount,
              }
            : p,
        ),
      );
    } catch (e) {
      flipReaction(id); // undo
      setError(errorMessage(e));
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

  return (
    <View style={common.screen}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p._id}
        renderItem={({ item }) => (
          <PostCard post={item} onReact={toggleReaction} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 110,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFirst(true)}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ marginTop: 6 }}>
            <Text style={common.subtitle}>
              A quiet place to share how you are really doing. Everyone here is
              anonymous.
            </Text>
            {!!error && (
              <Text style={[common.error, { marginTop: 12 }]}>{error}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          error ? undefined : (
            <View style={{ alignItems: "center", paddingVertical: 50 }}>
              <Text
                style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}
              >
                Nothing here yet
              </Text>
              <Text style={[common.subtitle, { textAlign: "center" }]}>
                Be the first to share something. Tap the button below.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 18 }} />
          ) : undefined
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Write a post"
        onPress={() => router.push("/screens/resonance/compose")}
        style={{
          position: "absolute",
          right: 20,
          bottom: 24,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.brand,
          alignItems: "center",
          justifyContent: "center",
          elevation: 4,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Ionicons name="add" size={30} color={colors.paper} />
      </Pressable>
    </View>
  );
}
