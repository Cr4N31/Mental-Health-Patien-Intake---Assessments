import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import adminApi from "../../api/admin.js";
import { errorMessage } from "../../api/client.js";

function dateLabel(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PersonRows({ person, isSelf, onDone }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(person.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await adminApi.setRole(person._id, role, password);
      setOpen(false);
      setPassword("");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setOpen(false);
    setRole(person.role);
    setPassword("");
    setError("");
  }

  return (
    <>
      <tr className="border-b border-line align-top">
        <td className="py-4 pr-4">
          <p className="font-medium">{person.name}{isSelf ? " (you)" : ""}</p>
          <p className="mt-1 text-sm text-muted">{person.email}</p>
        </td>
        <td className="py-4 pr-4">
          <span className="rounded-full bg-page px-2.5 py-1 text-xs font-medium">
            {person.role === "user" ? "User · awaiting staff access" : person.role}
          </span>
        </td>
        <td className="py-4 pr-4 text-sm">
          {person.emailVerified ? "Verified" : "Not verified"}
        </td>
        <td className="py-4 pr-4 text-sm">
          Joined {dateLabel(person.createdAt)}
          <p className="mt-1 text-muted">
            {person.lastLoginAt ? `Last login ${dateLabel(person.lastLoginAt)}` : "No login recorded yet"}
          </p>
        </td>
        <td className="py-4 text-right">
          {!isSelf && (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="font-medium text-brand underline"
            >
              {open ? "Close" : "Change role"}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line bg-page/60">
          <td colSpan="5" className="p-4 sm:p-5">
            <div className="max-w-3xl space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Choose a role</legend>
                <div className="flex flex-wrap gap-2">
                  {["user", "moderator", "admin"].map((item) => {
                    const blocked = item !== "user" && !person.emailVerified;
                    return (
                      <label
                        key={item}
                        className={`cursor-pointer rounded-full border px-4 py-2 text-sm capitalize ${
                          role === item
                            ? "border-brand bg-brand/10 text-brand-dark"
                            : "border-line bg-paper"
                        } ${blocked ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`role-${person._id}`}
                          value={item}
                          checked={role === item}
                          disabled={blocked}
                          onChange={() => setRole(item)}
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {!person.emailVerified && (
                <p className="text-sm text-muted">
                  Staff roles need a verified email. Ask them to verify first.
                </p>
              )}
              <div className="max-w-sm">
                <label htmlFor={`password-${person._id}`} className="mb-1 block text-sm font-medium">
                  Your password, to confirm
                </label>
                <input
                  id={`password-${person._id}`}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2.5"
                />
              </div>
              {error && <p role="alert" className="text-sm text-risk">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy || role === person.role || !password}
                  onClick={save}
                  className="rounded-lg bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy ? "Saving..." : "Confirm"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={cancel}
                  className="rounded-lg border border-line px-4 py-2.5 text-muted hover:bg-paper disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PeoplePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback((term) => {
    setError("");
    adminApi
      .people(term)
      .then(setRows)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load(applied);
  }, [load, applied]);

  function search(event) {
    event.preventDefault();
    setApplied(query.trim());
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Administration</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-brand-dark">Accounts</h1>
        <p className="mt-2 text-muted">Newest first, 30 at a time. Search by name or email.</p>
      </header>
      <form onSubmit={search} className="flex max-w-xl gap-3">
        <label className="sr-only" htmlFor="account-search">Search accounts</label>
        <input
          id="account-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2.5"
        />
        <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark">
          Search
        </button>
      </form>
      {error && <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 text-risk">{error}</p>}
      {!rows && !error && <p className="text-muted">Loading accounts...</p>}
      {rows?.length === 0 && <p className="rounded-xl border border-line bg-paper p-5 text-muted">No accounts found.</p>}
      {!!rows?.length && (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper shadow-sm">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="border-b border-line bg-page/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <PersonRows
                  key={person._id}
                  person={person}
                  isSelf={person._id === user?.id}
                  onDone={() => load(applied)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
