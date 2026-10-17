import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api, { errorMessage } from "../api/client.js";

const RESPONSE_LABEL = {
  1: "several days",
  2: "more than half the days",
  3: "nearly every day",
};

const fmt = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const emptyForm = { firstName: "", lastName: "", email: "", phone: "" };

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([
        api.get("/clients"),
        api.get("/assessments/alerts"),
      ]);
      setClients(c.data);
      setAlerts(a.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markReviewed(id) {
    try {
      await api.patch(`/assessments/${id}/acknowledge`);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function addClient(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      // Send only the fields that have a value.
      const body = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v.trim() !== ""),
      );
      await api.post("/clients", body);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const setField = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  return (
    <Layout>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
        >
          {error}
        </p>
      )}

      {alerts.length > 0 && (
        <section
          aria-labelledby="alerts-heading"
          className="mb-10 rounded-md border-l-4 border-risk bg-risk-soft px-5 py-4"
        >
          <h2
            id="alerts-heading"
            className="font-serif text-xl font-semibold text-risk"
          >
            {alerts.length === 1
              ? "1 response to question 9 needs your review"
              : `${alerts.length} responses to question 9 need your review`}
          </h2>
          <ul className="mt-3 divide-y divide-risk/20">
            {alerts.map((a) => (
              <li
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">
                    {a.client.firstName} {a.client.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    PHQ-9 on {fmt(a.completedAt)}: thoughts of self-harm
                    reported {RESPONSE_LABEL[a.answers[8]]}.
                    {a.client.phone ? ` Phone: ${a.client.phone}.` : ""}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <Link
                    to={`/clients/${a.client._id}`}
                    className="rounded-md border border-risk px-3 py-1.5 font-medium text-risk hover:bg-white"
                  >
                    Open client
                  </Link>
                  <button
                    onClick={() => markReviewed(a._id)}
                    className="rounded-md bg-risk px-3 py-1.5 font-medium text-white hover:opacity-90"
                  >
                    Mark reviewed
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-end justify-between">
        <h1 className="font-serif text-3xl font-semibold">Clients</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {showForm ? "Cancel" : "Add client"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addClient}
          className="mt-5 grid gap-4 rounded-md border border-line bg-paper p-5 sm:grid-cols-2"
        >
          {[
            ["firstName", "First name", "text", true],
            ["lastName", "Last name", "text", true],
            ["email", "Email", "email", false],
            ["phone", "Phone", "tel", false],
          ].map(([name, label, type, required]) => (
            <div key={name}>
              <label htmlFor={name} className="mb-1 block text-sm font-medium">
                {label}
                {required ? "" : " (optional)"}
              </label>
              <input
                id={name}
                type={type}
                required={required}
                value={form[name]}
                onChange={setField(name)}
                className="w-full rounded-md border border-line bg-white px-3 py-2"
              />
            </div>
          ))}
          {formError && (
            <p role="alert" className="text-sm text-risk sm:col-span-2">
              {formError}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save client"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-muted">Loading clients...</p>
        ) : clients.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-5 py-8 text-muted">
            No clients yet. Add your first client, then send them a PHQ-9 or
            GAD-7 link.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line bg-paper">
            {clients.map((c) => (
              <li key={c._id}>
                <Link
                  to={`/clients/${c._id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-page"
                >
                  <span className="font-medium">
                    {c.lastName}, {c.firstName}
                  </span>
                  <span className="text-sm text-muted">
                    {c.email || "No email"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
