import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSoapDraft,
  hasPlaceholders,
  PLACEHOLDER,
} from "./noteTemplate.js";

const client = { firstName: "Amina" };
const sessionDate = new Date("2026-10-20");

const m = (id, type, totalScore, severity, date, extra = {}) => ({
  _id: id,
  type,
  totalScore,
  severity,
  completedAt: new Date(date),
  riskFlag: false,
  answers: new Array(type === "PHQ9" ? 9 : 7).fill(0),
  ...extra,
});

test("first measure is reported as baseline", () => {
  const a = m("1", "PHQ9", 15, "moderately severe", "2026-10-01");
  const note = buildSoapDraft({
    client,
    sessionDate,
    sessionNotes: "Client reports poor sleep.",
    measures: { PHQ9: { latest: a, previous: null, baseline: a } },
  });
  assert.match(note.sections.objective, /PHQ-9: 15 \(moderately severe\)/);
  assert.match(note.sections.assessment, /baseline/);
  assert.equal(note.sections.subjective, "Client reports poor sleep.");
});

test("improvement is described with signed change", () => {
  const base = m("1", "PHQ9", 15, "moderately severe", "2026-10-01");
  const prev = m("2", "PHQ9", 12, "moderate", "2026-10-08");
  const latest = m("3", "PHQ9", 7, "mild", "2026-10-15");
  const note = buildSoapDraft({
    client,
    sessionDate,
    sessionNotes: "x",
    measures: { PHQ9: { latest, previous: prev, baseline: base } },
  });
  assert.match(note.sections.objective, /change -5/);
  assert.match(note.sections.objective, /Baseline: 15/);
  assert.match(
    note.sections.assessment,
    /improved since the previous measure \(-5 points\)/,
  );
  assert.match(
    note.sections.assessment,
    /improved compared with baseline \(-8 points\)/,
  );
});

test("small change is reported as little change", () => {
  const prev = m("1", "GAD7", 10, "moderate", "2026-10-01");
  const latest = m("2", "GAD7", 9, "mild", "2026-10-08");
  const note = buildSoapDraft({
    client,
    sessionDate,
    sessionNotes: "x",
    measures: { GAD7: { latest, previous: prev, baseline: prev } },
  });
  assert.match(note.sections.assessment, /little change/);
});

test("item 9 endorsement adds an attention line", () => {
  const answers = [0, 0, 0, 0, 0, 0, 0, 0, 2];
  const a = m("1", "PHQ9", 2, "minimal", "2026-10-01", {
    riskFlag: true,
    answers,
  });
  const note = buildSoapDraft({
    client,
    sessionDate,
    sessionNotes: "x",
    measures: { PHQ9: { latest: a, previous: null, baseline: a } },
  });
  assert.match(
    note.sections.assessment,
    /ATTENTION: PHQ-9 item 9 was endorsed \(response 2 of 3\)/,
  );
});

test("placeholders are detected, and cleared sections pass", () => {
  const note = buildSoapDraft({
    client,
    sessionDate,
    sessionNotes: "",
    measures: {},
  });
  assert.equal(hasPlaceholders(note.sections), true);
  assert.ok(note.sections.plan.includes(PLACEHOLDER));
  const done = { subjective: "a", objective: "b", assessment: "c", plan: "d" };
  assert.equal(hasPlaceholders(done), false);
});
