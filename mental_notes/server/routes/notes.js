import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Client from "../models/Client.js";
import Assessment from "../models/Assessment.js";
import Note from "../models/Note.js";
import { FORMS } from "../utils/scoring.js";
import { buildSoapDraft, hasPlaceholders } from "../utils/noteTemplate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const draftSchema = z.object({
  clientId: z.string().refine(mongoose.isValidObjectId, "Invalid client id"),
  sessionDate: z.coerce.date(),
  sessionNotes: z.string().max(5000).default(""),
});

const text = z.string().max(10000);
const updateSchema = z.object({
  sessionNotes: z.string().max(5000).optional(),
  sections: z
    .object({
      subjective: text,
      objective: text,
      assessment: text,
      plan: text,
    })
    .partial()
    .optional(),
});

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid note id" });
  }
  next();
}

// Latest, previous and baseline assessment for each form type.
async function gatherMeasures(clientId, therapistId) {
  const measures = {};
  for (const type of Object.keys(FORMS)) {
    const all = await Assessment.find({
      client: clientId,
      therapist: therapistId,
      type,
    }).sort({
      completedAt: -1,
    });
    if (all.length === 0) continue;
    measures[type] = {
      latest: all[0],
      previous: all[1] ?? null,
      baseline: all.find((a) => a.isBaseline) ?? all[all.length - 1],
    };
  }
  return measures;
}

// Create a draft note from the client's scores and your session bullets.
router.post(
  "/draft",
  asyncHandler(async (req, res) => {
    const parsed = draftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { clientId, sessionDate, sessionNotes } = parsed.data;

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.therapistId,
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const measures = await gatherMeasures(client._id, req.therapistId);
    const draft = buildSoapDraft({
      client,
      sessionDate,
      sessionNotes,
      measures,
    });

    const note = await Note.create({
      client: client._id,
      therapist: req.therapistId,
      sessionDate,
      format: draft.format,
      sessionNotes,
      assessments: Object.values(measures).map((m) => m.latest._id),
      sections: draft.sections,
      status: "draft",
    });
    res.status(201).json(note);
  }),
);

// List notes for one client: GET /api/notes?clientId=...
router.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.query.clientId)) {
      return res.status(400).json({ message: "clientId is required" });
    }
    const notes = await Note.find({
      client: req.query.clientId,
      therapist: req.therapistId,
    }).sort({ sessionDate: -1 });
    res.json(notes);
  }),
);

router.get(
  "/:id",
  validId,
  asyncHandler(async (req, res) => {
    const note = await Note.findOne({
      _id: req.params.id,
      therapist: req.therapistId,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  }),
);

// Edit a draft.
router.patch(
  "/:id",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      therapist: req.therapistId,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.status === "signed") {
      return res.status(409).json({ message: "Signed notes cannot be edited" });
    }

    const { sessionNotes, sections } = parsed.data;
    if (sessionNotes !== undefined) note.sessionNotes = sessionNotes;
    for (const [key, value] of Object.entries(sections ?? {})) {
      note.set(`sections.${key}`, value);
    }
    await note.save();
    res.json(note);
  }),
);

// Sign a note. Refused while any placeholder is still in the text.
router.post(
  "/:id/sign",
  validId,
  asyncHandler(async (req, res) => {
    const note = await Note.findOne({
      _id: req.params.id,
      therapist: req.therapistId,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.status === "signed") {
      return res.status(409).json({ message: "Note is already signed" });
    }
    if (hasPlaceholders(note.sections)) {
      return res.status(400).json({
        message: "Complete every bracketed placeholder before signing",
      });
    }
    note.status = "signed";
    await note.save();
    res.json(note);
  }),
);

export default router;
