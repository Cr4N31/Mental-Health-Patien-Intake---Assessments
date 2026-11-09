import { useCallback, useEffect, useState } from "react";
import adminApi from "../../api/admin.js";
import { errorMessage } from "../../api/client.js";

function dateLabel(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function QueueItem({ item, kind, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const held = item.status === "held";

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    const message = held
      ? "It was held because it may describe someone in crisis. Publish it only if it is clearly safe."
      : "Its reports will be cleared and it will go live again.";
    if (window.confirm(`Publish this ${kind}?\n\n${message}`)) {
      void run(() => adminApi.approve(kind, item._id));
    }
  }

  function remove() {
    const message =
      kind === "post"
        ? "The post and its comments are deleted for good."
        : "This cannot be undone.";
    if (window.confirm(`Delete this ${kind}?\n\n${message}`)) {
      void run(() => adminApi.remove(kind, item._id));
    }
  }

  return (
    <article className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <p className={`text-sm font-semibold ${held ? "text-risk" : "text-muted"}`}>
        {held ? "Held: possible crisis" : `Hidden: ${item.reportCount} reports`}
      </p>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-ink">{item.body}</p>
      {item.reasons.map((reason, index) => (
        <p key={`${reason}-${index}`} className="mt-2 text-sm text-muted">
          Reason given: {reason}
        </p>
      ))}
      <p className="mt-3 text-xs text-muted">
        Author key {item.authorKey} · {dateLabel(item.createdAt)}
      </p>
      {error && <p role="alert" className="mt-3 text-sm text-risk">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={approve}
          className="rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className="rounded-lg border border-risk px-4 py-2.5 font-medium text-risk hover:bg-risk-soft disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function QueuePage() {
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    adminApi.queue().then(setQueue).catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empty = queue && queue.posts.length === 0 && queue.comments.length === 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Moderation</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-brand-dark">Review queue</h1>
        <p className="mt-2 text-muted">Held and hidden Resonance content, newest first.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 text-risk">{error}</p>}
      {!queue && !error && <p className="text-muted">Loading review queue...</p>}
      {empty && <p className="rounded-xl border border-line bg-paper p-5 text-muted">Nothing to review right now.</p>}
      {queue?.posts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Posts ({queue.posts.length})</h2>
          {queue.posts.map((item) => (
            <QueueItem key={item._id} item={item} kind="post" onDone={load} />
          ))}
        </section>
      )}
      {queue?.comments.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-dark">Comments ({queue.comments.length})</h2>
          {queue.comments.map((item) => (
            <QueueItem key={item._id} item={item} kind="comment" onDone={load} />
          ))}
        </section>
      )}
    </div>
  );
}
