import crypto from "crypto";

const ADJ = [
  "Quiet",
  "Gentle",
  "Brave",
  "Calm",
  "Kind",
  "Steady",
  "Warm",
  "Bright",
  "Soft",
  "Patient",
  "Hopeful",
  "Honest",
  "Mellow",
  "Sunny",
  "Silver",
  "Golden",
  "Misty",
  "Cosmic",
  "Humble",
  "Lively",
  "Serene",
  "Bold",
  "Cozy",
  "Wandering",
];

const ANIMALS = [
  "Heron",
  "Otter",
  "Fox",
  "Owl",
  "Panda",
  "Finch",
  "Lynx",
  "Dove",
  "Koala",
  "Wren",
  "Falcon",
  "Hare",
  "Robin",
  "Whale",
  "Sparrow",
  "Deer",
  "Swan",
  "Badger",
  "Crane",
  "Lark",
  "Seal",
  "Moth",
  "Ibis",
  "Gecko",
];

function keyFor(userId, scopeId, salt = "") {
  return crypto
    .createHmac("sha256", process.env.RESONANCE_SECRET)
    .update(`${userId}:${scopeId}:${salt}`)
    .digest("hex");
}

function pseudonymFor(key) {
  const a = parseInt(key.slice(0, 4), 16) % ADJ.length;
  const b = parseInt(key.slice(4, 8), 16) % ANIMALS.length;
  const n = parseInt(key.slice(8, 12), 16) % 100;

  return `${ADJ[a]} ${ANIMALS[b]} ${n}`;
}

const LINK =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|ng|app|link|ly|xyz)\b)/i;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;

function containsContactInfo(text) {
  return LINK.test(text) || EMAIL.test(text) || PHONE.test(text);
}

// In-memory limiter. Resets on restart, which is fine for MVP on a single Render instance.
// Deliberately NOT stored in Mongo, so no stable per-user key ever sits next to posts.
const buckets = new Map();

function hitLimit(userId, action, max, windowMs = 60 * 60 * 1000) {
  const k = `${userId}:${action}`;
  const now = Date.now();

  const arr = (buckets.get(k) || []).filter((t) => now - t < windowMs);

  if (arr.length >= max) {
    buckets.set(k, arr);
    return true;
  }

  arr.push(now);
  buckets.set(k, arr);
  return false;
}

export { keyFor, pseudonymFor, containsContactInfo, hitLimit };
