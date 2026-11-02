export const MOODS = [
  { score: 1, icon: "emoticon-sad-outline", label: "Low" },
  { score: 2, icon: "emoticon-confused-outline", label: "Heavy" },
  { score: 3, icon: "emoticon-neutral-outline", label: "Okay" },
  { score: 4, icon: "emoticon-happy-outline", label: "Good" },
  { score: 5, icon: "emoticon-excited-outline", label: "Great" },
] as const;

export const EMOTIONS = ["calm", "grateful", "hopeful", "happy", "tired", "stressed", "anxious", "sad", "frustrated", "overwhelmed"] as const;

export const JOURNAL_PROMPTS = [
  "What is taking up the most space in your mind today?",
  "What is one thing you need a little more of right now?",
  "What felt meaningful today, even if it was small?",
  "What would you tell a friend feeling the way you do?",
];

export type Mood = { _id: string; score: number; emotions: string[]; note: string; checkedInAt: string };
export type JournalEntry = { _id: string; title: string; body: string; prompt: string; entryDate: string; createdAt: string };
export type ReflectionInsights = { periodDays: number; checkInCount: number; entryCount: number; averageMood: number | null; topEmotion: string | null };

export function shortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function moodLabel(score: number) {
  return MOODS.find((mood) => mood.score === score)?.label ?? "";
}
