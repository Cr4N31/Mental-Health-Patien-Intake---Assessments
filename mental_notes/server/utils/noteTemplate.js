// Builds a draft SOAP note from scores and the therapist's own session bullets.
// Pure function: no database access, so it is easy to test.

export const PLACEHOLDER = "[Therapist to complete";

const LABEL = { PHQ9: "PHQ-9", GAD7: "GAD-7" };

// Point change treated as a real shift rather than noise. Commonly cited
// values; adjust to your own clinical judgement.
const MEANINGFUL_CHANGE = { PHQ9: 5, GAD7: 4 };

const day = (d) => new Date(d).toISOString().slice(0, 10);
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

function trendWord(type, diff) {
  const t = MEANINGFUL_CHANGE[type];
  if (diff <= -t) return "improved";
  if (diff >= t) return "worsened";
  return "little change";
}

function describeMeasure(type, { latest, previous, baseline }) {
  let line = `${LABEL[type]}: ${latest.totalScore} (${latest.severity}), completed ${day(latest.completedAt)}.`;

  if (previous) {
    const diff = latest.totalScore - previous.totalScore;
    line += ` Previous: ${previous.totalScore} (${day(previous.completedAt)}), change ${signed(diff)}.`;
  }

  const baselineIsOther =
    baseline &&
    String(baseline._id) !== String(latest._id) &&
    String(baseline._id) !== String(previous?._id);
  if (baselineIsOther) {
    line += ` Baseline: ${baseline.totalScore} (${day(baseline.completedAt)}).`;
  }
  return line;
}

function describeTrend(type, { latest, previous, baseline }) {
  const name = LABEL[type];
  const parts = [];

  if (previous) {
    const diff = latest.totalScore - previous.totalScore;
    parts.push(
      `${name} shows ${trendWord(type, diff)} since the previous measure (${signed(diff)} points)`,
    );
  }
  if (baseline && String(baseline._id) !== String(latest._id)) {
    const diff = latest.totalScore - baseline.totalScore;
    parts.push(
      `${trendWord(type, diff)} compared with baseline (${signed(diff)} points)`,
    );
  }
  if (parts.length === 0) {
    return `${name}: first measure recorded, so this score is the baseline.`;
  }
  return parts.join("; ") + ".";
}

export function buildSoapDraft({
  client,
  sessionDate,
  sessionNotes,
  measures,
}) {
  const types = Object.keys(measures);

  const subjective = sessionNotes?.trim()
    ? sessionNotes.trim()
    : `${PLACEHOLDER}: session content for ${client.firstName}]`;

  const objective =
    types.length === 0
      ? "No standardized measures on file for this client yet."
      : "Standardized measures:\n" +
        types.map((t) => `- ${describeMeasure(t, measures[t])}`).join("\n");

  const assessmentLines = [];

  const phq = measures.PHQ9?.latest;
  if (phq?.riskFlag) {
    assessmentLines.push(
      `ATTENTION: PHQ-9 item 9 was endorsed (response ${phq.answers[8]} of 3) on ${day(phq.completedAt)}. ` +
        `Risk assessment and any safety planning must be documented by the clinician.`,
    );
  }
  for (const t of types) assessmentLines.push(describeTrend(t, measures[t]));
  assessmentLines.push(`${PLACEHOLDER}: clinical impression]`);

  return {
    format: "SOAP",
    sessionDate,
    sections: {
      subjective,
      objective,
      assessment: assessmentLines.join("\n"),
      plan: `${PLACEHOLDER}: plan, homework, next session]`,
    },
  };
}

export function hasPlaceholders(sections) {
  return Object.values(sections).some((text) =>
    String(text).includes(PLACEHOLDER),
  );
}
