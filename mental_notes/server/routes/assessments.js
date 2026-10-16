import { Router } from "express";
import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// Unreviewed risk flags, newest first, with the client's name.
router.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const alerts = await Assessment.find({
      therapist: req.therapistId,
      riskFlag: true,
      riskAcknowledgedAt: null,
    })
      .sort({ completedAt: -1 })
      .populate("client", "firstName lastName phone");
    res.json(alerts);
  }),
);

// Mark a risk flag as reviewed by the therapist.
router.patch(
  "/:id/acknowledge",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid assessment id" });
    }
    const assessment = await Assessment.findOneAndUpdate(
      {
        _id: req.params.id,
        therapist: req.therapistId,
        riskFlag: true,
        riskAcknowledgedAt: null,
      },
      { riskAcknowledgedAt: new Date() },
      { new: true },
    );
    if (!assessment) {
      return res.status(404).json({ message: "No unreviewed alert found" });
    }
    res.json(assessment);
  }),
);

export default router;
