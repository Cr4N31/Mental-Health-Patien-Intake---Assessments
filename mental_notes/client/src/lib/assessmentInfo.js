export const FORM_TYPES = ["PHQ9", "GAD7"];

export const FORM_INFO = {
  PHQ9: {
    name: "PHQ-9",
    topic: "Depression",
    questions: 9,
    max: 27,
    blurb:
      "How low mood and loss of interest have affected you over the last 2 weeks.",
  },
  GAD7: {
    name: "GAD-7",
    topic: "Anxiety",
    questions: 7,
    max: 21,
    blurb: "How worry and anxiety have affected you over the last 2 weeks.",
  },
};

const MEANING = {
  minimal: "Your answers suggest few or no symptoms right now.",
  mild: "Your answers suggest mild symptoms. Keep an eye on how you feel over the next few weeks.",
  moderate:
    "Your answers suggest moderate symptoms. Consider speaking with a health professional.",
  "moderately severe":
    "Your answers suggest fairly significant symptoms. We recommend speaking with a health professional soon.",
  severe:
    "Your answers suggest severe symptoms. Please contact a health professional soon.",
};

export const severityLabel = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export const severityMeaning = (s) => MEANING[s] ?? "";

export const isHigh = (s) => s === "moderately severe" || s === "severe";

export function changeText(change) {
  if (change === null || change === undefined)
    return "This is your first result.";
  if (change === 0) return "No change since your last check-in.";
  const n = Math.abs(change);
  const pts = `${n} ${n === 1 ? "point" : "points"}`;
  return change < 0
    ? `Down ${pts} since your last check-in.`
    : `Up ${pts} since your last check-in.`;
}

export const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
