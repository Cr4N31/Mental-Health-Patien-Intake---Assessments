import { Link } from "react-router-dom";

const STEPS = [
  {
    title: "Create an account",
    text: "Sign up with your email. It takes less than a minute.",
  },
  {
    title: "Take a check-in",
    text: "Answer a short, standard questionnaire for low mood or anxiety. Each takes about 2 minutes.",
  },
  {
    title: "Track your progress",
    text: "See what your score means and how it changes each time you check in.",
  },
];

const TOOLS = [
  {
    name: "PHQ-9",
    topic: "Depression",
    text: "9 questions about mood and interest over the last 2 weeks.",
  },
  {
    name: "GAD-7",
    topic: "Anxiety",
    text: "7 questions about worry and anxiety over the last 2 weeks.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-serif text-xl font-semibold text-brand-dark">
          Mental Notes
        </span>
        <nav className="flex items-center gap-5 text-sm">
          <Link to="/login" className="text-muted hover:text-brand-dark">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:pt-20">
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight text-brand-dark sm:text-6xl">
            Check in with how you are feeling
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Take short, widely used questionnaires for low mood and anxiety,
            understand what your scores mean, and watch how they change over
            time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="rounded-md bg-brand px-6 py-3 text-base font-medium text-white hover:bg-brand-dark"
            >
              Create your account
            </Link>
            <Link to="/login" className="text-brand underline">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="font-serif text-3xl font-semibold text-brand-dark">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-lg border border-line p-5">
                  <span className="text-sm font-medium text-muted">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 font-serif text-xl font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="font-serif text-3xl font-semibold text-brand-dark">
            What you can check
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <div
                key={t.name}
                className="rounded-lg border border-line bg-paper p-6"
              >
                <p className="text-sm text-muted">{t.topic}</p>
                <h3 className="font-serif text-2xl font-semibold text-brand-dark">
                  {t.name}
                </h3>
                <p className="mt-2 text-muted">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="font-serif text-3xl font-semibold text-brand-dark">
              Your results are yours
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Your answers and scores are saved to your own account so you can
              see your history. Only you can see them. You will be asked to
              confirm what is stored when you sign up.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">
        <p>
          Mental Notes offers screening questionnaires, not a diagnosis, and it
          does not replace advice from a qualified health professional.
        </p>
        <p className="mt-2">
          If you are in danger or think you might harm yourself, contact your
          local emergency number now.
        </p>
      </footer>
    </div>
  );
}
