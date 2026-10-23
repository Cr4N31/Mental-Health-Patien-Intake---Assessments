import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import JournalEntry from "../models/JournalEntry.js";
import MoodCheckIn from "../models/MoodCheckIn.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const emotions = [
  "calm",
  "grateful",
  "hopeful",
  "happy",
  "tired",
  "stressed",
  "anxious",
  "sad",
  "frustrated",
  "overwhelmed",
];

const fields = {
  title: z.string().trim().max(120),
  body: z.string().trim().min(1, "Write a few words before saving.").max(10000),
  prompt: z.string().trim().max(280),
  entryDate: z.coerce.date(),
};

const entrySchema = z.object({
  title: fields.title.default(""),
  body: fields.body,
  prompt: fields.prompt.default(""),
  entryDate: fields.entryDate.optional(),
});

const entryPatchSchema = z.object({
  title: fields.title.optional(),
  body: fields.body.optional(),
  prompt: fields.prompt.optional(),
  entryDate: fields.entryDate.optional(),
});

const moodSchema = z.object({
  score: z.number().int().min(1).max(5),
  emotions: z.array(z.enum(emotions)).max(3).default([]),
  note: z.string().trim().max(500).default(""),
});

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid reflection id" });
  next();
}

router.get(
  "/entries",
  asyncHandler(async (req, res) => {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const entries = await JournalEntry.find({ user: req.userId })
      .sort({ entryDate: -1 })
      .limit(limit);
    res.json(entries);
  }),
);

router.post(
  "/entries",
  asyncHandler(async (req, res) => {
    const parsed = entrySchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    const entry = await JournalEntry.create({
      ...parsed.data,
      user: req.userId,
    });
    res.status(201).json(entry);
  }),
);

router.patch(
  "/entries/:id",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = entryPatchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    if (Object.keys(parsed.data).length === 0)
      return res.status(400).json({ message: "Add a change before saving." });
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      parsed.data,
      { new: true, runValidators: true },
    );
    if (!entry)
      return res.status(404).json({ message: "Journal entry not found" });
    res.json(entry);
  }),
);

router.delete(
  "/entries/:id",
  validId,
  asyncHandler(async (req, res) => {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!entry)
      return res.status(404).json({ message: "Journal entry not found" });
    res.status(204).end();
  }),
);

router.get(
  "/moods",
  asyncHandler(async (req, res) => {
    const moods = await MoodCheckIn.find({ user: req.userId })
      .sort({ checkedInAt: -1 })
      .limit(60);
    res.json(moods);
  }),
);

router.post(
  "/moods",
  asyncHandler(async (req, res) => {
    const parsed = moodSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    const mood = await MoodCheckIn.create({ ...parsed.data, user: req.userId });
    res.status(201).json(mood);
  }),
);

router.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const [recentMoods, entryCount] = await Promise.all([
      MoodCheckIn.find({ user: req.userId, checkedInAt: { $gte: since } }).sort(
        { checkedInAt: -1 },
      ),
      JournalEntry.countDocuments({
        user: req.userId,
        entryDate: { $gte: since },
      }),
    ]);
    const averageMood = recentMoods.length
      ? Math.round(
          (recentMoods.reduce((total, mood) => total + mood.score, 0) /
            recentMoods.length) *
            10,
        ) / 10
      : null;
    const emotionCounts = recentMoods
      .flatMap((mood) => mood.emotions)
      .reduce(
        (counts, emotion) => ({
          ...counts,
          [emotion]: (counts[emotion] || 0) + 1,
        }),
        {},
      );
    const topEmotion =
      Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    res.json({
      periodDays: 7,
      checkInCount: recentMoods.length,
      entryCount,
      averageMood,
      topEmotion,
    });
  }),
);

export default router;
