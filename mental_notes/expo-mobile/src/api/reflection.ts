import api from "./client";
import type {
  JournalEntry,
  Mood,
  ReflectionInsights,
} from "../lib/reflections";

export type SafetyLevel = "none" | "elevated" | "high";
export type Saved<T> = T & { safety?: SafetyLevel };

export type MoodInput = { score: number; emotions: string[]; note: string };
export type EntryInput = {
  title?: string;
  body: string;
  prompt?: string;
  entryDate?: string;
};

export const reflectionsApi = {
  insights: () =>
    api
      .get<ReflectionInsights>("/reflections/insights")
      .then((res) => res.data),

  moods: () => api.get<Mood[]>("/reflections/moods").then((res) => res.data),
  createMood: (input: MoodInput) =>
    api.post<Saved<Mood>>("/reflections/moods", input).then((res) => res.data),

  entries: (limit = 50) =>
    api
      .get<JournalEntry[]>("/reflections/entries", { params: { limit } })
      .then((res) => res.data),
  entry: (id: string) =>
    api.get<JournalEntry>(`/reflections/entries/${id}`).then((res) => res.data),
  createEntry: (input: EntryInput) =>
    api
      .post<Saved<JournalEntry>>("/reflections/entries", input)
      .then((res) => res.data),
  updateEntry: (id: string, input: Partial<EntryInput>) =>
    api
      .patch<Saved<JournalEntry>>(`/reflections/entries/${id}`, input)
      .then((res) => res.data),
  deleteEntry: (id: string) =>
    api.delete(`/reflections/entries/${id}`).then(() => undefined),
};
