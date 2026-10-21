import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../../api/client.js";
import {
  FORM_TYPES,
  FORM_INFO,
  severityLabel,
  formatDate,
} from "../../lib/assessmentInfo.js";

export default function History() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/assessments")
      .then((res) => setItems(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const shown = items?.filter((a) => filter === "ALL" || a.type === filter);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link to="/" className="text-sm text-brand underline">
        Back to dashboard
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-brand-dark">
        Your history
      </h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {["ALL", ...FORM_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              filter === t
                ? "border-brand bg-brand text-white"
                : "border-line bg-paper"
            }`}
          >
            {t === "ALL" ? "All" : FORM_INFO[t].name}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
        >
          {error}
        </p>
      )}
      {!items && !error && <p className="mt-6 text-muted">Loading...</p>}

      {shown && shown.length === 0 && (
        <p className="mt-6 text-muted">No results yet.</p>
      )}

      {shown && shown.length > 0 && (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-paper">
          {shown.map((a) => (
            <li key={a._id}>
              <Link
                to={`/results/${a._id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-line/40"
              >
                <span>
                  <span className="font-medium">{FORM_INFO[a.type].name}</span>
                  <span className="block text-sm text-muted">
                    {formatDate(a.completedAt)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-medium">
                    {a.totalScore} / {FORM_INFO[a.type].max}
                  </span>
                  <span className="block text-sm text-muted">
                    {severityLabel(a.severity)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
