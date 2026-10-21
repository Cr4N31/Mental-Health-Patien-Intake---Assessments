import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api, { errorMessage } from "../../api/client.js";
import {
  FORM_INFO,
  severityLabel,
  severityMeaning,
  changeText,
  formatDate,
} from "../../lib/assessmentInfo.js";
import { CRISIS_RESOURCES, CRISIS_REGION } from "../../config/crisis.js";

function CrisisBlock() {
  return (
    <section
      role="alert"
      className="rounded-lg border border-risk bg-risk-soft p-5"
    >
      <h2 className="font-serif text-2xl font-semibold text-risk">
        Thank you for answering honestly
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed">
        <p>
          One of your answers mentions thoughts of harming yourself. You are not
          alone, and help is available.
        </p>
        <p>
          If you think you might act on these thoughts, or you are in danger,
          contact your local emergency number now or go to the nearest emergency
          room. If you can, tell someone you trust how you are feeling today.
        </p>
        {CRISIS_RESOURCES.length > 0 && (
          <div>
            <p className="font-medium">Support lines in {CRISIS_REGION}</p>
            <ul className="mt-2 space-y-3">
              {CRISIS_RESOURCES.map((r) => (
                <li key={r.name}>
                  <span className="font-medium">{r.name}</span>:{" "}
                  {r.tel ? (
                    <a href={`tel:${r.tel}`} className="underline">
                      {r.contact}
                    </a>
                  ) : (
                    r.contact
                  )}
                  {r.note && <span className="block text-sm">{r.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const change = location.state?.change;

  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/assessments/${id}`)
      .then((res) => setAssessment(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-10">
        <p role="alert" className="text-risk">
          {error}
        </p>
        <Link to="/" className="mt-4 inline-block text-brand underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!assessment) {
    return <p className="p-8 text-muted">Loading...</p>;
  }

  const info = FORM_INFO[assessment.type];

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      {assessment.riskFlag && (
        <div className="mb-8">
          <CrisisBlock />
        </div>
      )}

      <p className="text-sm text-muted">
        {info.name}: {info.topic}. {formatDate(assessment.completedAt)}
      </p>
      <h1 className="mt-1 font-serif text-4xl font-semibold text-brand-dark">
        {assessment.totalScore}
        <span className="text-xl font-normal text-muted"> / {info.max}</span>
      </h1>
      <p className="mt-1 text-xl">{severityLabel(assessment.severity)}</p>

      <p className="mt-4 text-lg leading-relaxed">
        {severityMeaning(assessment.severity)}
      </p>
      {change !== undefined && (
        <p className="mt-2 text-muted">{changeText(change)}</p>
      )}
      <p className="mt-2 text-sm text-muted">
        A lower score means fewer symptoms.
      </p>

      <p className="mt-6 rounded-md bg-line px-4 py-3 text-sm">
        This is a screening result, not a diagnosis. It cannot replace advice
        from a qualified health professional.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/"
          className="rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          Back to dashboard
        </Link>
        <Link
          to="/history"
          className="rounded-md border border-line px-5 py-2.5 font-medium hover:bg-paper"
        >
          View history
        </Link>
      </div>
    </div>
  );
}
