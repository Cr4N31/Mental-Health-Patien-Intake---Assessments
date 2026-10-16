// Scoring for PHQ-9 and GAD-7. Pure functions, no database access.
// Each item is answered 0 (not at all) to 3 (nearly every day).

export const FORMS = {
  PHQ9: { items: 9, max: 27 },
  GAD7: { items: 7, max: 21 },
};

const PHQ9_BANDS = [
  { max: 4, label: "minimal" },
  { max: 9, label: "mild" },
  { max: 14, label: "moderate" },
  { max: 19, label: "moderately severe" },
  { max: 27, label: "severe" },
];

const GAD7_BANDS = [
  { max: 4, label: "minimal" },
  { max: 9, label: "mild" },
  { max: 14, label: "moderate" },
  { max: 21, label: "severe" },
];

function validate(type, answers) {
  const form = FORMS[type];
  if (!form) throw new Error(`Unknown form type: ${type}`);
  if (!Array.isArray(answers) || answers.length !== form.items) {
    throw new Error(`${type} requires exactly ${form.items} answers`);
  }
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a > 3) {
      throw new Error("Each answer must be an integer from 0 to 3");
    }
  }
}

function band(bands, total) {
  return bands.find((b) => total <= b.max).label;
}

export function scorePHQ9(answers) {
  validate("PHQ9", answers);
  const totalScore = answers.reduce((sum, a) => sum + a, 0);
  return {
    type: "PHQ9",
    totalScore,
    severity: band(PHQ9_BANDS, totalScore),
    // Item 9 asks about thoughts of self-harm. Any answer above 0 needs
    // the therapist's immediate attention, whatever the total score is.
    riskFlag: answers[8] > 0,
  };
}

export function scoreGAD7(answers) {
  validate("GAD7", answers);
  const totalScore = answers.reduce((sum, a) => sum + a, 0);
  return {
    type: "GAD7",
    totalScore,
    severity: band(GAD7_BANDS, totalScore),
    riskFlag: false,
  };
}

export function scoreAssessment(type, answers) {
  if (type === "PHQ9") return scorePHQ9(answers);
  if (type === "GAD7") return scoreGAD7(answers);
  throw new Error(`Unknown form type: ${type}`);
}

// Change from a previous score. Negative means improvement.
export function scoreChange(current, previous) {
  if (previous == null) return null;
  return current - previous;
}
