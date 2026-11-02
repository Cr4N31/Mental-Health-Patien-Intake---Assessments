import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { RequireAuth } from "../../../src/components/RequireAuth";
import { BackLink } from "../../../src/components/BackLink";
import { RequireStaff } from "../../../src/components/RequireStaff";
import { adminApi, Kind, Queue, QueueItem } from "../../../src/api/admin";
import { errorMessage } from "../../../src/api/client";
import { formatDate } from "../../../src/lib/assessmentInfo";
import { colors, common } from "../../../src/theme/styles";

function Item({
  item,
  kind,
  onDone,
}: {
  item: QueueItem;
  kind: Kind;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const held = item.status === "held";

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    Alert.alert(
      "Publish this " + kind + "?",
      held
        ? "It was held because it may describe someone in crisis. Publish it only if it is clearly safe."
        : "Its reports will be cleared and it will go live again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: () => void run(() => adminApi.approve(kind, item._id)),
        },
      ],
    );
  }

  function remove() {
    Alert.alert(
      "Delete this " + kind + "?",
      kind === "post"
        ? "The post and its comments are deleted for good."
        : "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void run(() => adminApi.remove(kind, item._id)),
        },
      ],
    );
  }

  return (
    <View style={common.card}>
      <Text
        style={{ color: held ? colors.risk : colors.muted, fontWeight: "600" }}
      >
        {held ? "Held: possible crisis" : `Hidden: ${item.reportCount} reports`}
      </Text>
      <Text style={{ color: colors.ink, lineHeight: 22, marginTop: 8 }}>
        {item.body}
      </Text>
      {item.reasons.map((r, i) => (
        <Text
          key={i}
          style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}
        >
          Reason given: {r}
        </Text>
      ))}
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
        Author key {item.authorKey} · {formatDate(item.createdAt)}
      </Text>
      {!!error && <Text style={[common.error, { marginTop: 8 }]}>{error}</Text>}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <Pressable
          disabled={busy}
          onPress={approve}
          style={[common.button, { paddingVertical: 10 }]}
        >
          <Text style={common.buttonText}>Approve</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={remove}
          style={{
            borderColor: colors.risk,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 16,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.risk, fontWeight: "600" }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function QueueContent() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    adminApi
      .queue()
      .then(setQueue)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useFocusEffect(load);

  const empty =
    queue && queue.posts.length === 0 && queue.comments.length === 0;

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
    >
      <BackLink href="/screens/admin" />
      <Text style={[common.title, { marginTop: 23 }]}>Review queue</Text>
      <Text style={common.subtitle}>
        Held and hidden Resonance content, newest first.
      </Text>

      {!!error && (
        <Text style={[common.error, { marginTop: 14 }]}>{error}</Text>
      )}
      {!queue && !error && (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
      )}
      {empty && (
        <Text style={[common.subtitle, { marginTop: 24 }]}>
          Nothing to review right now.
        </Text>
      )}

      {queue && queue.posts.length > 0 && (
        <>
          <Text style={[common.label, { marginTop: 24 }]}>
            Posts ({queue.posts.length})
          </Text>
          {queue.posts.map((p) => (
            <Item key={p._id} item={p} kind="post" onDone={load} />
          ))}
        </>
      )}
      {queue && queue.comments.length > 0 && (
        <>
          <Text style={[common.label, { marginTop: 24 }]}>
            Comments ({queue.comments.length})
          </Text>
          {queue.comments.map((c) => (
            <Item key={c._id} item={c} kind="comment" onDone={load} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

export default function QueueScreen() {
  return (
    <RequireAuth>
      <RequireStaff>
        <QueueContent />
      </RequireStaff>
    </RequireAuth>
  );
}
