import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api, { errorMessage } from "../../api/client.js";
import ProgressChart from "../../components/ProgressChart.jsx";
import VerifyBanner from "../../components/VerifyBanner.jsx";
import {
  FORM_TYPES,
  FORM_INFO,
  severityLabel,
  changeText,
  formatDate,
  isHigh,
} from "../../lib/assessmentInfo.js";

function FormCard({ type, summary }) {
  const info = FORM_INFO[type];
  const latest = summary?.latest;

  return (
    <div className="rounded-lg border border-line bg-paper p-6">
      <p className="text-sm text-muted">{info.topic}</p>
      <h2 className="font-serif text-2xl font-semibold text-brand-dark">
        {info.name}
      </h2>
      <p className="mt-2 text-sm text-muted">{info.blurb}</p>

      {latest ? (
        <div className="mt-5">
          <p className="text-3xl font-semibold">
            {latest.totalScore}
            <span className="text-base font-normal text-muted">
              {" "}
              / {info.max}
            </span>
          </p>
          <p
            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-sm ${
              isHigh(latest.severity) ? "bg-risk-soft text-risk" : "bg-line"
            }`}
          >
            {severityLabel(latest.severity)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {formatDate(latest.completedAt)}. {changeText(summary.change)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/assess/${type}`}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Take again
            </Link>
            <Link
              to={`/results/${latest._id}`}
              state={{ change: summary.change }}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-paper"
            >
              View result
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm text-muted">
            You have not taken this yet. It takes about 2 minutes.
          </p>
          <Link
            to={`/assess/${type}`}
            className="mt-5 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Start
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/assessments/latest")
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));

    api
      .get("/assessments", { params: { limit: 100 } })
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]));
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="font-serif text-xl font-semibold text-brand-dark">
          Mental Notes
        </span>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/history" className="text-brand underline">
            History
          </Link>
          <Link to="/settings" className="text-brand underline">
            Settings
          </Link>
          <button onClick={handleLogout} className="text-muted underline">
            Log out
          </button>
        </div>
      </header>

      <VerifyBanner />

      <h1 className="mt-10 font-serif text-4xl font-semibold text-brand-dark">
        Hello, {firstName}
      </h1>
      <p className="mt-2 text-muted">
        Take a check-in whenever you like. Your results are private to you.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
        >
          {error}
        </p>
      )}

      {!data && !error && <p className="mt-8 text-muted">Loading...</p>}

      {data && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FORM_TYPES.map((type) => (
            <FormCard key={type} type={type} summary={data[type]} />
          ))}
        </div>
      )}

      {history && <ProgressChart items={history} />}

      <p className="mt-10 text-sm text-muted">
        These questionnaires are screening tools, not a diagnosis. If you are
        worried about how you feel, please talk to a qualified health
        professional.
      </p>
    </div>
  );
}
