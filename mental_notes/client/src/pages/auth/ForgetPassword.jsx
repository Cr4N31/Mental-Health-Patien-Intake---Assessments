import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api/client.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-dark"
        >
          <span aria-hidden="true">&larr;</span> Back to log in
        </Link>
        <h1 className="font-serif text-4xl font-semibold text-brand-dark">
          Forgot your password?
        </h1>

        {sent ? (
          <div className="mt-4 space-y-3">
            <p className="text-lg">
              If an account exists for{" "}
              <span className="font-medium">{email}</span>, we have sent a link
              to reset your password.
            </p>
            <p className="text-muted">
              The link works for 1 hour. Check your spam folder if you do not
              see it.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-muted">
              Enter your email and we will send you a link to choose a new
              password.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
