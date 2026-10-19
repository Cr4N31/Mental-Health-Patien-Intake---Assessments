import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../api/client.js";

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking"); // checking | open | closed | error
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    licenseNumber: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/auth/registration-status")
      .then((res) => setStatus(res.data.open ? "open" : "closed"))
      .catch(() => setStatus("error"));
  }, []);

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

    setBusy(true);
    try {
      const body = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (form.licenseNumber.trim()) body.licenseNumber = form.licenseNumber;
      await register(body);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") {
    return <p className="p-8 text-muted">Loading...</p>;
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-sm px-5 py-16">
        <p role="alert" className="text-risk">
          Could not reach the server. Check that the API is running and try
          again.
        </p>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <div className="mx-auto max-w-sm px-5 py-16">
        <h1 className="font-serif text-3xl font-semibold text-brand-dark">
          Registration is closed
        </h1>
        <p className="mt-3 text-muted">
          An account already exists for this practice.
        </p>
        <Link to="/login" className="mt-6 inline-block text-brand underline">
          Go to log in
        </Link>
      </div>
    );
  }

  const fields = [
    ["name", "Full name", "text", "name", true],
    ["email", "Email", "email", "email", true],
    [
      "password",
      "Password (at least 10 characters)",
      "password",
      "new-password",
      true,
    ],
    ["confirm", "Confirm password", "password", "new-password", true],
    ["licenseNumber", "License number (optional)", "text", "off", false],
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-4xl font-semibold text-brand-dark">
          Create your account
        </h1>
        <p className="mt-2 text-muted">
          This sets up the single account for your practice. Registration closes
          afterwards.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {fields.map(([name, label, type, auto, required]) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block text-sm font-medium">
                {label}
              </label>
              <input
                id={name}
                type={type}
                required={required}
                autoComplete={auto}
                value={form[name]}
                onChange={setField(name)}
                className="w-full rounded-md border border-line bg-paper px-3 py-2"
              />
            </div>
          ))}

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
      </div>
    </div>
  );
}
