import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import Client from "../models/Client.js";
import Assessment from "../models/Assessment.js";
import { FORMS } from "../utils/scoring.js";
import { FORM_QUESTIONS } from "../utils/question.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

// Reject anything that is not a 64-character hex token before touching the database.
function tokenFormat(req, res, next) {
  if (!/^[a-f0-9]{64}$/.test(req.params.token)) {
    return res
      .status(404)
      .json({ message: "This link is not valid or has expired" });
  }
  next();
}

const answersSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3)),
});

// Which forms does this link ask for?
router.get(
  "/:token",
  tokenFormat,
  asyncHandler(async (req, res) => {
    const client = await Client.findOne({
      formTokenHash: hashToken(req.params.token),
      formTokenExpiresAt: { $gt: new Date() },
    }).select("firstName formTypes");

    if (!client) {
      return res
        .status(404)
        .json({ message: "This link is not valid or has expired" });
    }
    if (client.formTypes.length === 0) {
      return res
        .status(410)
        .json({ message: "All forms are complete. Thank you." });
    }

    res.json({
      firstName: client.firstName,
      forms: client.formTypes.map((type) => ({
        type,
        ...FORM_QUESTIONS[type],
      })),
    });
  }),
);

// Submit one form.
router.post(
  "/:token/:type",
  tokenFormat,
  asyncHandler(async (req, res) => {
    const { token, type } = req.params;
    if (!Object.hasOwn(FORMS, type)) {
      return res.status(404).json({ message: "Unknown form" });
    }

    const parsed = answersSchema.safeParse(req.body);
    if (!parsed.success || parsed.data.answers.length !== FORMS[type].items) {
      return res.status(400).json({ message: "Please answer every question" });
    }

    // Claim the form atomically so it can only be submitted once.
    const client = await Client.findOneAndUpdate(
      {
        formTokenHash: hashToken(token),
        formTokenExpiresAt: { $gt: new Date() },
        formTypes: type,
      },
      { $pull: { formTypes: type } },
    );
    if (!client) {
      return res.status(409).json({
        message: "This form was already submitted, or the link has expired",
      });
    }

    try {
      const assessment = await Assessment.createScored({
        client: client._id,
        therapist: client.therapist,
        type,
        answers: parsed.data.answers,
      });
      res.status(201).json({
        message: "Thank you",
        remaining: client.formTypes.filter((t) => t !== type),
        showSupport: assessment.riskFlag,
      });
    } catch (err) {
      // Saving failed, so give the client their form back.
      await Client.updateOne(
        { _id: client._id },
        { $addToSet: { formTypes: type } },
      );
      throw err;
    }
  }),
);

export default router;
