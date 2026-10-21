import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../../api/client.js";
import { FORM_INFO } from "../../lib/assessmentInfo.js";

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-start justify-center px-5 py-10 sm:items-center">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

export default function TakeAssessment() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState("intro"); // intro | questions
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/assessments/forms/${type}`)
      .then((res) => {
        setForm(res.data);
        setAnswers(new Array(res.data.items.length).fill(null));
      })
      .catch((err) => setLoadError(errorMessage(err)));
  }, [type]);

  if (loadError) {
    return (
      <Shell>
        <p role="alert" className="text-risk">
          {loadError}
        </p>
        <Link to="/" className="mt-4 inline-block text-brand underline">
          Back to dashboard
        </Link>
      </Shell>
    );
  }

  if (!form) {
    return (
      <Shell>
        <p className="text-muted">Loading...</p>
      </Shell>
    );
  }

  const info = FORM_INFO[type];

  if (phase === "intro") {
    return (
      <Shell>
        <h1 className="font-serif text-3xl font-semibold text-brand-dark">
          {info.name}: {info.topic}
        </h1>
        <div className="mt-4 space-y-3 text-lg leading-relaxed">
          <p>{info.questions} short questions. It takes about 2 minutes.</p>
          <p>
            There are no right or wrong answers. Choose the option that fits you
            best. Your answers are saved to your private history.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => setPhase("questions")}
            className="rounded-md bg-brand px-6 py-3 text-base font-medium text-white hover:bg-brand-dark"
          >
            Start
          </button>
          <Link to="/" className="text-muted underline">
            Cancel
          </Link>
        </div>
      </Shell>
    );
  }

  const total = form.items.length;
  const isLast = qIdx === total - 1;

  function select(value) {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? value : a)));
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/assessments", { type, answers });
      navigate(`/results/${res.data.assessment._id}`, {
        replace: true,
        state: { change: res.data.change },
      });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <p className="text-sm text-muted">
        Question {qIdx + 1} of {total}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={qIdx + 1}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full bg-brand transition-[width] duration-200"
          style={{ width: `${((qIdx + 1) / total) * 100}%` }}
        />
      </div>

      <p className="mt-8 text-sm text-muted">{form.stem}</p>

      <fieldset className="mt-3">
        <legend className="font-serif text-2xl font-semibold leading-snug">
          {form.items[qIdx]}
        </legend>

        <div className="mt-6 space-y-3">
          {form.options.map((o) => (
            <label key={o.value} className="block cursor-pointer">
              <input
                type="radio"
                name={`${type}-${qIdx}`}
                value={o.value}
                checked={answers[qIdx] === o.value}
                onChange={() => select(o.value)}
                className="peer sr-only"
              />
              <span className="block rounded-md border border-line bg-paper px-4 py-3.5 text-base peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-risk-soft px-3 py-2 text-sm text-risk"
        >
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setQIdx((i) => i - 1)}
          disabled={qIdx === 0 || submitting}
          className="rounded-md border border-line px-5 py-2.5 font-medium hover:bg-paper disabled:invisible"
        >
          Back
        </button>

        {isLast ? (
          <button
            onClick={submit}
            disabled={answers[qIdx] === null || submitting}
            className="rounded-md bg-brand px-6 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "Saving..." : "See my result"}
          </button>
        ) : (
          <button
            onClick={() => setQIdx((i) => i + 1)}
            disabled={answers[qIdx] === null}
            className="rounded-md bg-brand px-6 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </Shell>
  );
}
