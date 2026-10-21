import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api, { errorMessage } from "../../api/client.js";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Delete results
  const [confirmResults, setConfirmResults] = useState(false);
  const [resultsBusy, setResultsBusy] = useState(false);
  const [resultsMsg, setResultsMsg] = useState("");
  const [resultsError, setResultsError] = useState("");

  // Delete account
  const [showAccount, setShowAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");

  async function deleteResults() {
    setResultsError("");
    setResultsMsg("");
    setResultsBusy(true);
    try {
      const res = await api.delete("/assessments");
      setResultsMsg(
        `Deleted ${res.data.deleted} ${res.data.deleted === 1 ? "result" : "results"}.`,
      );
      setConfirmResults(false);
    } catch (err) {
      setResultsError(errorMessage(err));
    } finally {
      setResultsBusy(false);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setAccountError("");
    setAccountBusy(true);
    try {
      await api.delete("/auth/account", { data: { password } });
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setAccountError(errorMessage(err));
      setAccountBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link to="/" className="text-sm text-brand underline">
        Back to dashboard
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-brand-dark">
        Settings
      </h1>

      <section className="mt-8 rounded-lg border border-line bg-paper p-6">
        <h2 className="font-serif text-2xl font-semibold">Your account</h2>
        <p className="mt-3">{user?.name}</p>
        <p className="text-muted">{user?.email}</p>
        <p className="mt-2 text-sm text-muted">
          {user?.emailVerified ? "Email verified" : "Email not verified yet"}
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-paper p-6">
        <h2 className="font-serif text-2xl font-semibold">Delete my results</h2>
        <p className="mt-2 text-muted">
          Permanently deletes every PHQ-9 and GAD-7 result saved to your
          account. Your account stays open. This cannot be undone.
        </p>

        {resultsMsg && (
          <p className="mt-4 rounded-md bg-line px-3 py-2 text-sm">
            {resultsMsg}
          </p>
        )}
        {resultsError && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
          >
            {resultsError}
          </p>
        )}

        {!confirmResults ? (
          <button
            type="button"
            onClick={() => setConfirmResults(true)}
            className="mt-4 rounded-md border border-risk px-4 py-2 text-sm font-medium text-risk hover:bg-risk-soft"
          >
            Delete my results
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Delete all results?</span>
            <button
              type="button"
              onClick={deleteResults}
              disabled={resultsBusy}
              className="rounded-md bg-risk px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {resultsBusy ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmResults(false)}
              disabled={resultsBusy}
              className="rounded-md border border-line px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-risk bg-paper p-6">
        <h2 className="font-serif text-2xl font-semibold text-risk">
          Delete my account
        </h2>
        <p className="mt-2 text-muted">
          Permanently deletes your account and all of your results. This cannot
          be undone.
        </p>

        {!showAccount ? (
          <button
            type="button"
            onClick={() => setShowAccount(true)}
            className="mt-4 rounded-md border border-risk px-4 py-2 text-sm font-medium text-risk hover:bg-risk-soft"
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={deleteAccount} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="del-password"
                className="mb-1 block text-sm font-medium"
              >
                Enter your password to confirm
              </label>
              <input
                id="del-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full max-w-xs rounded-md border border-line bg-paper px-3 py-2"
              />
            </div>
            {accountError && (
              <p
                role="alert"
                className="rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
              >
                {accountError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={accountBusy}
                className="rounded-md bg-risk px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {accountBusy ? "Deleting..." : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAccount(false);
                  setPassword("");
                  setAccountError("");
                }}
                disabled={accountBusy}
                className="rounded-md border border-line px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
