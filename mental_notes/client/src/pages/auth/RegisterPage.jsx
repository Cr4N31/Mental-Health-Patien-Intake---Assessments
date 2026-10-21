import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { errorMessage } from "../../api/client.js";

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const setField = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("The two passwords do not match.");
      return;
    }
    if (!consent) {
      setError("Please accept the consent statement to continue.");
      return;
    }

    setBusy(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        consent: true,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const fields = [
    ["name", "Full name", "text", "name"],
    ["email", "Email", "email", "email"],
    [
      "password",
      "Password (at least 10 characters)",
      "password",
      "new-password",
    ],
    ["confirm", "Confirm password", "password", "new-password"],
  ];

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-5 py-10">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted hover:text-brand-dark"
      >
        <span aria-hidden="true">&larr;</span> Back to home
      </Link>
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-4xl font-semibold text-brand-dark">
          Create your account
        </h1>
        <p className="mt-2 text-muted">
          Take private check-ins and track how you are doing over time.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {fields.map(([name, label, type, auto]) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block text-sm font-medium">
                {label}
              </label>
              <input
                id={name}
                type={type}
                required
                autoComplete={auto}
                value={form[name]}
                onChange={setField(name)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2"
              />
            </div>
          ))}

          <label className="flex items-start gap-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              I understand that Mental Notes stores my answers and results so I
              can see my history. It is a screening tool, not a diagnosis, and
              it does not replace advice from a qualified professional.
            </span>
          </label>

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
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-brand underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
