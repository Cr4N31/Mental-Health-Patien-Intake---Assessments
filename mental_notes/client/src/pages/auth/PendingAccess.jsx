import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { errorMessage } from "../../api/client.js";
import VerifyBanner from "../../components/VerifyBanner.jsx";

export default function PendingAccess() {
  const { user, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="p-8 text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "user") {
    return <Navigate to={user.staffSession ? "/admin" : "/login"} replace />;
  }

  async function checkAccess() {
    setBusy(true);
    setError("");
    try {
      const currentUser = await refreshUser();
      if (currentUser.role !== "user") {
        await logout();
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      navigate("/login", { replace: true });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-line bg-paper p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          Account access
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">
          Welcome, waiting for admin access to be granted.
        </h1>
        <p className="mt-4 text-muted">
          Your account is registered. You can check again after an administrator
          grants your account a staff role.
        </p>
        <VerifyBanner />
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-risk-soft px-4 py-3 text-risk">
            {error}
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={checkAccess}
            disabled={busy}
            className="rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Checking..." : "Check access"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-line px-5 py-3 font-medium text-ink hover:bg-page"
          >
            Log out
          </button>
        </div>
      </section>
    </main>
  );
}
