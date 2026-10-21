import { Router } from "express";
import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import { FORMS, scoreAssessment, scoreChange } from "../utils/scoring.js";
import { FORM_QUESTIONS } from "../utils/question.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const TYPES = Object.keys(FORMS);

// Questions and answer options for one form, for the take-assessment screen.
router.get("/forms/:type", (req, res) => {
  const { type } = req.params;
  if (!Object.hasOwn(FORMS, type)) {
    return res.status(404).json({ message: "Unknown form" });
  }
  res.json({ type, ...FORM_QUESTIONS[type] });
});

// Dashboard summary: the latest result per form, plus the change since the
// result before it. Negative change means improvement.
router.get(
  "/latest",
  asyncHandler(async (req, res) => {
    const entries = await Promise.all(
      TYPES.map(async (type) => {
        const [latest, previous] = await Assessment.find({
          user: req.userId,
          type,
        })
          .sort({ completedAt: -1 })
          .limit(2);
        return [
          type,
          latest
            ? {
                latest,
                change: scoreChange(latest.totalScore, previous?.totalScore),
                count: await Assessment.countDocuments({
                  user: req.userId,
                  type,
                }),
              }
            : null,
        ];
      }),
    );
    res.json(Object.fromEntries(entries));
  }),
);

// History for the logged-in user only. Optional ?type=PHQ9 and ?limit=50.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { user: req.userId };
    if (req.query.type !== undefined) {
      if (!TYPES.includes(req.query.type)) {
        return res.status(400).json({ message: "Unknown assessment type" });
      }
      filter.type = req.query.type;
    }
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const assessments = await Assessment.find(filter)
      .sort({ completedAt: -1 })
      .limit(limit);
    res.json(assessments);
  }),
);

// Submit a completed assessment. The score is always calculated here.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { type, answers } = req.body ?? {};

    // scoreAssessment throws on a bad type, wrong answer count or bad values.
    // Check first so those return 400, not 500.
    let result;
    try {
      result = scoreAssessment(type, answers);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const previous = await Assessment.findOne({ user: req.userId, type }).sort({
      completedAt: -1,
    });

    const assessment = await Assessment.createScored({
      user: req.userId,
      type,
      answers,
    });

    res.status(201).json({
      assessment,
      change: scoreChange(result.totalScore, previous?.totalScore),
    });
  }),
);

// Delete every result for the logged-in user. The account stays.
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { deletedCount } = await Assessment.deleteMany({ user: req.userId });
    res.json({ deleted: deletedCount });
  }),
);

// One result. Filtering by both id and user means a patient can never
// load someone else's result by guessing an id.
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid assessment id" });
    }
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.json(assessment);
  }),
);

export default router;
