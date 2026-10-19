import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../api/client.js";

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    api
      .get("/auth/registration-status")
      .then((res) => setCanRegister(res.data.open))
      .catch(() => {});
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
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
          Mental Notes
        </h1>
        <p className="mt-2 text-muted">Log in to your practice.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
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
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>
        {canRegister && (
          <p className="mt-6 text-sm text-muted">
            No account yet?{" "}
            <Link to="/register" className="text-brand underline">
              Create the first account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
