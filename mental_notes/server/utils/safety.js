// A basic safety net for free text. It is NOT a clinical tool: it will miss some
// phrasing and flag some harmless text. Two rules:
//   1. Never block or delay saving because of it.
//   2. Never store or log the text it inspects.

const HIGH = [
  /\bkill(ing)? my ?self\b/,
  /\bend(ing)? my (own )?life\b/,
  /\btake my (own )?life\b/,
  /\bend it all\b/,
  /\bwant(ed)? to die\b/,
  /\bwish (i was|i were|i'?d) (dead|never been born)\b/,
  /\bbetter off dead\b/,
  /\b(think|thinking|thought|thoughts) (about|of) suicide\b/,
  /\b(hurt|harm|cut|hurting|harming|cutting) my ?self\b/,
  /\bself[ -]?harm\b/,
  /\bdon'?t want to (be alive|live|be here)\b/,
  /\bno reason to (live|go on)\b/,
  /\b(take|taking) (an )?overdose\b/,
];

const ELEVATED = [
  /\bsuicid(e|al)\b/,
  /\bhopeless\b/,
  /\bcan'?t (go on|do this anymore|take (it|this) anymore)\b/,
  /\bgive up on (life|everything)\b/,
  /\bno point (in )?(living|anything|going on)\b/,
  /\bwant to disappear\b/,
  /\btired of (living|being alive|life)\b/,
  /\bworthless\b/,
  /\bnobody would (care|miss me)\b/,
  /\bburden (to|on) (everyone|everybody|my)\b/,
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9'\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Accepts any number of strings (non-strings are ignored) and returns
// "none", "elevated" or "high".
export function assessRisk(...texts) {
  const text = normalize(texts.filter((t) => typeof t === "string").join(" "));
  if (!text) return "none";
  if (HIGH.some((pattern) => pattern.test(text))) return "high";
  if (ELEVATED.some((pattern) => pattern.test(text))) return "elevated";
  return "none";
}
