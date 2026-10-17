import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../api/client.js";

// Must match the placeholder text the server puts in drafts.
const PLACEHOLDER = "[Therapist to complete";

const SECTIONS = [
  ["subjective", "Subjective", 5],
  ["objective", "Objective", 5],
  ["assessment", "Assessment", 7],
  ["plan", "Plan", 5],
];

const fmt = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const today = () => new Date().toISOString().slice(0, 10);

function NoteEditor({ note, onChange }) {
  const [sections, setSections] = useState(note.sections);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const signed = note.status === "signed";
  const placeholdersLeft = SECTIONS.filter(([key]) =>
    sections[key].includes(PLACEHOLDER),
  ).length;

  const edit = (key) => (e) => {
    setSaved(false);
    setSections((s) => ({ ...s, [key]: e.target.value }));
  };

  async function save() {
    const res = await api.patch(`/notes/${note._id}`, { sections });
    onChange(res.data);
    return res.data;
  }

  async function handleSave() {
    setError("");
    setBusy(true);
    try {
      await save();
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSign() {
    if (!window.confirm("Sign this note? A signed note cannot be edited."))
      return;
    setError("");
    setBusy(true);
    try {
      await save();
      const res = await api.post(`/notes/${note._id}/sign`);
      onChange(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold">
          Session on {fmt(note.sessionDate)}
        </h3>
        {signed ? (
          <span className="rounded bg-brand px-2 py-0.5 text-sm text-white">
            Signed {fmt(note.signedAt)}
          </span>
        ) : (
          <span className="rounded bg-page px-2 py-0.5 text-sm text-muted">
            Draft
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {SECTIONS.map(([key, label, rows]) => (
          <div key={key}>
            <label
              htmlFor={`${note._id}-${key}`}
              className="mb-1 block text-sm font-medium"
            >
              {label}
            </label>
            <textarea
              id={`${note._id}-${key}`}
              rows={rows}
              value={sections[key]}
              onChange={edit(key)}
              readOnly={signed}
              className={`w-full rounded-md border px-3 py-2 leading-relaxed ${
                signed ? "border-line bg-page" : "border-line bg-white"
              } ${sections[key].includes(PLACEHOLDER) ? "border-risk" : ""}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
        >
          {error}
        </p>
      )}

      {!signed && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-page disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            onClick={handleSign}
            disabled={busy || placeholdersLeft > 0}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Sign note
          </button>
          <span className="text-sm text-muted">
            {saved
              ? "Draft saved."
              : placeholdersLeft > 0
                ? `${placeholdersLeft} ${placeholdersLeft === 1 ? "section needs" : "sections need"} your text before you can sign.`
                : "Ready to sign."}
          </span>
        </div>
      )}
    </div>
  );
}

export default function NotesSection({ clientId }) {
  const [notes, setNotes] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [date, setDate] = useState(today());
  const [bullets, setBullets] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/notes", { params: { clientId } });
      setNotes(res.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/notes/draft", {
        clientId,
        sessionDate: date,
        sessionNotes: bullets,
      });
      setNotes((prev) => [res.data, ...prev]);
      setOpenId(res.data._id);
      setBullets("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const replaceNote = (updated) =>
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));

  const open = notes.find((n) => n._id === openId);

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold">Session notes</h2>

      <form
        onSubmit={generate}
        className="mt-3 rounded-md border border-line bg-paper p-5"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="session-date"
              className="mb-1 block text-sm font-medium"
            >
              Session date
            </label>
            <input
              id="session-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-line bg-white px-3 py-2"
            />
          </div>
        </div>
        <label
          htmlFor="bullets"
          className="mb-1 mt-4 block text-sm font-medium"
        >
          What happened in the session
        </label>
        <textarea
          id="bullets"
          rows={4}
          value={bullets}
          onChange={(e) => setBullets(e.target.value)}
          placeholder="Your own words: mood, themes, interventions used."
          className="w-full rounded-md border border-line bg-white px-3 py-2"
        />
        <p className="mt-1 text-sm text-muted">
          The draft will add this client's latest PHQ-9 and GAD-7 scores and how
          they changed.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-risk">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Generating..." : "Generate draft"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-line px-5 py-6 text-muted">
          No notes yet. Write a few lines about the session above and generate
          your first draft.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-paper">
          {notes.map((n) => (
            <li key={n._id}>
              <button
                onClick={() => setOpenId(n._id === openId ? null : n._id)}
                aria-expanded={n._id === openId}
                className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-page"
              >
                <span className="font-medium">{fmt(n.sessionDate)}</span>
                <span
                  className={`rounded px-2 py-0.5 text-sm ${
                    n.status === "signed"
                      ? "bg-brand text-white"
                      : "bg-page text-muted"
                  }`}
                >
                  {n.status === "signed" ? "Signed" : "Draft"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <NoteEditor key={open._id} note={open} onChange={replaceNote} />}
    </section>
  );
}
