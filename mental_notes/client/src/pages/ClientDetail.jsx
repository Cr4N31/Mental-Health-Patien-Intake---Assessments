import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Layout from "../components/Layout.jsx";
import api, { errorMessage } from "../api/client.js";
import NotesSection from "../components/NotesSection.jsx";

const CHARTS = {
  PHQ9: { title: "PHQ-9", max: 27, ticks: [0, 5, 10, 15, 20, 27] },
  GAD7: { title: "GAD-7", max: 21, ticks: [0, 5, 10, 15, 21] },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtShort = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function Dot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={payload.riskFlag ? "#b3402a" : "#1f6f66"}
    />
  );
}

function ScoreChart({ type, assessments }) {
  const cfg = CHARTS[type];
  const data = assessments
    .filter((a) => a.type === type)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map((a) => ({
      date: fmtShort(a.completedAt),
      score: a.totalScore,
      severity: a.severity,
      riskFlag: a.riskFlag,
    }));

  return (
    <div>
      <h3 className="font-serif text-lg font-semibold">{cfg.title}</h3>
      {data.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No {cfg.title} completed yet.</p>
      ) : (
        <div className="mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="#cfdad6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#5b706b" />
              <YAxis
                domain={[0, cfg.max]}
                ticks={cfg.ticks}
                tick={{ fontSize: 12 }}
                stroke="#5b706b"
              />
              <Tooltip
                formatter={(value, _name, item) => [
                  `${value} (${item.payload.severity})`,
                  cfg.title,
                ]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1f6f66"
                strokeWidth={2}
                dot={<Dot />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function FormLinkCard({ clientId }) {
  const [types, setTypes] = useState(["PHQ9", "GAD7"]);
  const [days, setDays] = useState(7);
  const [link, setLink] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggle = (t) =>
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  async function create() {
    setError("");
    setCopied(false);
    setBusy(true);
    try {
      const res = await api.post(`/clients/${clientId}/form-link`, {
        types,
        expiresInDays: Number(days),
      });
      setLink(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setError(
        "Could not copy automatically. Select the link and copy it by hand.",
      );
    }
  }

  return (
    <section className="rounded-md border border-line bg-paper p-5">
      <h2 className="font-serif text-xl font-semibold">Send questionnaires</h2>
      <p className="mt-1 text-sm text-muted">
        Create a private link for this client. Creating a new link replaces the
        previous one.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        {Object.entries(CHARTS).map(([key, cfg]) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <input
              type="checkbox"
              checked={types.includes(key)}
              onChange={() => toggle(key)}
              className="size-4 accent-brand"
            />
            {cfg.title}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          Expires in
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="rounded-md border border-line bg-white px-2 py-1"
          >
            {[1, 3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={create}
          disabled={busy || types.length === 0}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Creating..." : "Create link"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-risk">
          {error}
        </p>
      )}

      {link && (
        <div className="mt-4 rounded-md bg-page p-4">
          <label htmlFor="form-url" className="mb-1 block text-sm font-medium">
            Link for the client
          </label>
          <div className="flex gap-2">
            <input
              id="form-url"
              readOnly
              value={link.url}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              onClick={copy}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:bg-paper"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Expires {fmt(link.expiresAt)}. This link is shown only now, so copy
            it before you leave the page.
          </p>
        </div>
      )}
    </section>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/clients/${id}/assessments`),
      ]);
      setClient(c.data);
      setAssessments(a.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Layout>
        <p className="text-muted">Loading...</p>
      </Layout>
    );
  }

  if (error || !client) {
    return (
      <Layout>
        <p role="alert" className="text-risk">
          {error || "Client not found."}
        </p>
        <Link to="/" className="mt-4 inline-block text-brand underline">
          Back to clients
        </Link>
      </Layout>
    );
  }

  const hasRisk = assessments.some((a) => a.riskFlag);

  return (
    <Layout>
      <Link to="/" className="text-sm text-brand underline">
        All clients
      </Link>

      <header className="mt-3">
        <h1 className="font-serif text-3xl font-semibold">
          {client.firstName} {client.lastName}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {[client.email, client.phone].filter(Boolean).join("  |  ") ||
            "No contact details"}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <FormLinkCard clientId={id} />

        <section>
          <h2 className="font-serif text-xl font-semibold">Scores over time</h2>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            <ScoreChart type="PHQ9" assessments={assessments} />
            <ScoreChart type="GAD7" assessments={assessments} />
          </div>
          {hasRisk && (
            <p className="mt-3 text-sm text-muted">
              <span className="inline-block size-2.5 rounded-full bg-risk align-middle" />{" "}
              A red point means question 9 on the PHQ-9 was answered above zero.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold">History</h2>
          {assessments.length === 0 ? (
            <p className="mt-3 rounded-md border border-dashed border-line px-5 py-6 text-muted">
              No questionnaires completed yet. Create a link above and send it
              to the client.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-paper">
              {assessments.map((a) => (
                <li
                  key={a._id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <span className="font-medium">
                    {CHARTS[a.type].title}: {a.totalScore}{" "}
                    <span className="font-normal text-muted">
                      ({a.severity})
                    </span>
                    {a.isBaseline && (
                      <span className="ml-2 rounded bg-page px-1.5 py-0.5 text-xs text-muted">
                        baseline
                      </span>
                    )}
                    {a.riskFlag && (
                      <span className="ml-2 rounded bg-risk-soft px-1.5 py-0.5 text-xs text-risk">
                        question 9
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted">
                    {fmt(a.completedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <NotesSection clientId={id} />
      </div>
    </Layout>
  );
}
