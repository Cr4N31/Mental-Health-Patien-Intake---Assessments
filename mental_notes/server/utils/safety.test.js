import test from "node:test";
import assert from "node:assert/strict";
import { assessRisk } from "./safety.js";

test("ordinary text is not flagged", () => {
  assert.equal(
    assessRisk("Had a long day at work, but dinner was good."),
    "none",
  );
  assert.equal(assessRisk("Just killing time before my class."), "none");
  assert.equal(assessRisk(undefined, "", null), "none");
});

test("clear statements are high", () => {
  assert.equal(assessRisk("I want to die"), "high");
  assert.equal(assessRisk("I keep thinking about ending my life."), "high");
  assert.equal(assessRisk("Some days I think about hurting myself"), "high");
  assert.equal(assessRisk("I don\u2019t want to be here anymore"), "high");
});

test("heavy language is elevated", () => {
  assert.equal(assessRisk("Everything feels hopeless lately"), "elevated");
  assert.equal(assessRisk("I feel like a burden to everyone"), "elevated");
});

test("title and body are checked together", () => {
  assert.equal(assessRisk("Bad night", "I want to disappear"), "elevated");
});
