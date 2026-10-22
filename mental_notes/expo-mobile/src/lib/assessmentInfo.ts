export const FORM_TYPES = ["PHQ9", "GAD7"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const FORM_INFO: Record<FormType, { name: string; topic: string; questions: number; max: number; blurb: string }> = {
  PHQ9: { name: "PHQ-9", topic: "Depression", questions: 9, max: 27, blurb: "How low mood and loss of interest have affected you over the last 2 weeks." },
  GAD7: { name: "GAD-7", topic: "Anxiety", questions: 7, max: 21, blurb: "How worry and anxiety have affected you over the last 2 weeks." },
};

export function severityLabel(value?: string) { return value ? value[0].toUpperCase() + value.slice(1) : ""; }
export function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
export function changeText(change: number | null | undefined) {
  if (change == null) return "This is your first result.";
  if (change === 0) return "No change since your last check-in.";
  const points = `${Math.abs(change)} ${Math.abs(change) === 1 ? "point" : "points"}`;
  return change < 0 ? `Down ${points} since your last check-in.` : `Up ${points} since your last check-in.`;
}
export function severityMeaning(severity: string) {
  const meanings: Record<string, string> = {
    minimal: "Your answers suggest few or no symptoms right now.",
    mild: "Your answers suggest mild symptoms. Keep an eye on how you feel over the next few weeks.",
    moderate: "Your answers suggest moderate symptoms. Consider speaking with a health professional.",
    "moderately severe": "Your answers suggest fairly significant symptoms. We recommend speaking with a health professional soon.",
    severe: "Your answers suggest severe symptoms. Please contact a health professional soon.",
  };
  return meanings[severity] ?? "";
}
