import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../../api/client.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-4xl font-semibold text-brand-dark">
          Choose a new password
        </h1>

        {!token ? (
          <div className="mt-4 space-y-3">
            <p role="alert" className="text-risk">
              This reset link is not valid.
            </p>
            <Link to="/forgot-password" className="text-brand underline">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="mt-4 space-y-4">
            <p className="text-lg">Your password has been updated.</p>
            <Link
              to="/login"
              className="inline-block rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
            >
              Log in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                New password (at least 10 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="mb-1 block text-sm font-medium"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-brand px-4 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Saving..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
