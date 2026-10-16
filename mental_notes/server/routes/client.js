import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Client from "../models/Client.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import Assessment from "../models/Assessment.js";

const router = Router();
router.use(requireAuth);

// Never send the form link token data to the browser.
const HIDDEN = "-formTokenHash -formTokenExpiresAt";

const linkSchema = z.object({
  types: z
    .array(z.enum(["PHQ9", "GAD7"]))
    .min(1)
    .transform((a) => [...new Set(a)]),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

const createSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
});

const updateSchema = createSchema
  .partial()
  .extend({ status: z.enum(["active", "discharged"]).optional() });

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid client id" });
  }
  next();
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status === "discharged" ? "discharged" : "active";
    const clients = await Client.find({ therapist: req.therapistId, status })
      .select(HIDDEN)
      .sort({ lastName: 1, firstName: 1 });
    res.json(clients);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const client = await Client.create({
      ...parsed.data,
      therapist: req.therapistId,
    });
    const { formTokenHash, formTokenExpiresAt, ...safe } = client.toObject();
    res.status(201).json(safe);
  }),
);

router.get(
  "/:id",
  validId,
  asyncHandler(async (req, res) => {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.therapistId,
    }).select(HIDDEN);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  }),
);

router.patch(
  "/:id",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, therapist: req.therapistId },
      parsed.data,
      { new: true, runValidators: true },
    ).select(HIDDEN);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  }),
);

// Generate a form link. A new link replaces any earlier one for this client.
router.post(
  "/:id/form-link",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = linkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Choose at least one form: PHQ9 or GAD7" });
    }
    const { types, expiresInDays } = parsed.data;

    const token = crypto.randomBytes(32).toString("hex");
    const formTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, therapist: req.therapistId, status: "active" },
      { formTokenHash, formTokenExpiresAt: expiresAt, formTypes: types },
      { new: true },
    );
    if (!client)
      return res.status(404).json({ message: "Active client not found" });

    res.status(201).json({
      url: `${process.env.CLIENT_URL}/form/${token}`,
      types,
      expiresAt,
    });
  }),
);

// Assessment history for one client, newest first.
router.get(
  "/:id/assessments",
  validId,
  asyncHandler(async (req, res) => {
    const owns = await Client.exists({
      _id: req.params.id,
      therapist: req.therapistId,
    });
    if (!owns) return res.status(404).json({ message: "Client not found" });

    const assessments = await Assessment.find({
      client: req.params.id,
      therapist: req.therapistId,
    }).sort({ completedAt: -1 });
    res.json(assessments);
  }),
);

export default router;
