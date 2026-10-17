import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { errorMessage } from "../api/client.js";

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-start justify-center px-5 py-10 sm:items-center">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

function Message({ title, children }) {
  return (
    <Shell>
      <h1 className="font-serif text-3xl font-semibold text-brand-dark">
        {title}
      </h1>
      <div className="mt-4 space-y-3 text-lg leading-relaxed">{children}</div>
    </Shell>
  );
}

export default function PublicForm() {
  const { token } = useParams();

  const [status, setStatus] = useState("loading"); // loading | ready | invalid | complete
  const [firstName, setFirstName] = useState("");
  const [queue, setQueue] = useState([]); // forms still to fill in
  const [totalForms, setTotalForms] = useState(0);

  const [phase, setPhase] = useState("intro"); // intro | questions | support | done
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/forms/${token}`)
      .then((res) => {
        setFirstName(res.data.firstName);
        setQueue(res.data.forms);
        setTotalForms(res.data.forms.length);
        setAnswers(new Array(res.data.forms[0].items.length).fill(null));
        setStatus("ready");
      })
      .catch((err) => {
        setStatus(err.response?.status === 410 ? "complete" : "invalid");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <Shell>
        <p className="text-muted">Loading...</p>
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Message title="This link is not available">
        <p>
          It may have expired or been replaced. Please ask your therapist for a
          new link.
        </p>
      </Message>
    );
  }

  if (status === "complete" || phase === "done") {
    return (
      <Message title={firstName ? `Thank you, ${firstName}` : "Thank you"}>
        <p>
          Your answers have been sent to your therapist. You can close this page
          now.
        </p>
      </Message>
    );
  }

  const current = queue[0];

  if (phase === "intro") {
    return (
      <Message title={`Hello, ${firstName}`}>
        <p>
          Your therapist has asked you to answer{" "}
          {totalForms === 1
            ? "a short questionnaire"
            : "two short questionnaires"}
          . It takes about five minutes.
        </p>
        <p>
          There are no right or wrong answers. Choose the option that fits you
          best. Your answers go to your therapist.
        </p>
        <button
          onClick={() => setPhase("questions")}
          className="mt-4 rounded-md bg-brand px-6 py-3 text-base font-medium text-white hover:bg-brand-dark"
        >
          Start
        </button>
      </Message>
    );
  }

  function goToNextForm(remaining) {
    if (remaining.length === 0) {
      setPhase("done");
      return;
    }
    setAnswers(new Array(remaining[0].items.length).fill(null));
    setQIdx(0);
    setPhase("questions");
  }

  if (phase === "support") {
    const remaining = queue.slice(1);
    return (
      <Message title="Thank you for answering honestly">
        <p>
          One of your answers mentions thoughts of harming yourself. Your
          therapist will see your answers, but not always straight away.
        </p>
        <p>
          If you think you might act on these thoughts, or you are in danger,
          contact your local emergency number now or go to the nearest emergency
          room. If you can, tell someone you trust how you are feeling today.
        </p>
        <button
          onClick={() => {
            setQueue(remaining);
            goToNextForm(remaining);
          }}
          className="mt-4 rounded-md bg-brand px-6 py-3 text-base font-medium text-white hover:bg-brand-dark"
        >
          {remaining.length > 0
            ? "Continue to the next questionnaire"
            : "Finish"}
        </button>
      </Message>
    );
  }

  // phase === "questions"
  const total = current.items.length;
  const isLast = qIdx === total - 1;
  const formNumber = totalForms - queue.length + 1;

  function select(value) {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? value : a)));
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post(`/forms/${token}/${current.type}`, {
        answers,
      });
      const remaining = queue.slice(1);
      if (res.data.showSupport) {
        setPhase("support");
      } else {
        setQueue(remaining);
        goToNextForm(remaining);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <p className="text-sm text-muted">
        {totalForms > 1 ? `Questionnaire ${formNumber} of ${totalForms}. ` : ""}
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

      <p className="mt-8 text-sm text-muted">{current.stem}</p>

      <fieldset className="mt-3">
        <legend className="font-serif text-2xl font-semibold leading-snug">
          {current.items[qIdx]}
        </legend>

        <div className="mt-6 space-y-3">
          {current.options.map((o) => (
            <label key={o.value} className="block cursor-pointer">
              <input
                type="radio"
                name={`${current.type}-${qIdx}`}
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
            {submitting ? "Sending..." : "Submit answers"}
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
