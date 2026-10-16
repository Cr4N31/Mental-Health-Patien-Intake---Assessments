// Run with: node --test
import test from "node:test";
import assert from "node:assert/strict";
import { scorePHQ9, scoreGAD7, scoreChange } from "./scoring.js";

test("PHQ-9 all zeros is minimal, no flag", () => {
  const r = scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(r.totalScore, 0);
  assert.equal(r.severity, "minimal");
  assert.equal(r.riskFlag, false);
});

test("PHQ-9 band boundaries", () => {
  assert.equal(scorePHQ9([1, 1, 1, 1, 0, 0, 0, 0, 0]).severity, "minimal"); // 4
  assert.equal(scorePHQ9([1, 1, 1, 1, 1, 0, 0, 0, 0]).severity, "mild"); // 5
  assert.equal(scorePHQ9([2, 2, 2, 2, 2, 0, 0, 0, 0]).severity, "moderate"); // 10
  assert.equal(
    scorePHQ9([2, 2, 2, 2, 2, 2, 2, 2, 1]).severity,
    "moderately severe",
  ); // 17
  assert.equal(scorePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 0]).severity, "severe"); // 24
});

test("PHQ-9 item 9 above zero raises the risk flag even with a low total", () => {
  const r = scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(r.totalScore, 1);
  assert.equal(r.riskFlag, true);
});

test("GAD-7 band boundaries", () => {
  assert.equal(scoreGAD7([1, 1, 1, 1, 0, 0, 0]).severity, "minimal"); // 4
  assert.equal(scoreGAD7([2, 2, 1, 0, 0, 0, 0]).severity, "mild"); // 5
  assert.equal(scoreGAD7([2, 2, 2, 2, 2, 0, 0]).severity, "moderate"); // 10
  assert.equal(scoreGAD7([3, 3, 3, 3, 3, 0, 0]).severity, "severe"); // 15
});

test("rejects wrong length and out-of-range answers", () => {
  assert.throws(() => scorePHQ9([0, 0, 0]));
  assert.throws(() => scoreGAD7([0, 0, 0, 0, 0, 0, 4]));
  assert.throws(() => scoreGAD7([0, 0, 0, 0, 0, 0, 1.5]));
});

test("scoreChange", () => {
  assert.equal(scoreChange(8, 15), -7);
  assert.equal(scoreChange(8, null), null);
});
