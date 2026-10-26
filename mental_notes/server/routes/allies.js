import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Professional from "../models/Professional.js";
import ConsultRequest from "../models/ConsultRequest.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assessRisk } from "../utils/safety.js";
import { sendMail } from "../utils/mailer.js";

const router = Router();
router.use(requireAuth);

const PUBLIC_FIELDS =
  "name title specializations languages bio location formats priceNote availabilityNote isSample";
const MAX_REQUESTS_PER_DAY = 5;

const requestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Tell the professional a little about what you need.")
    .max(1000),
  preferredTime: z.string().trim().max(200).default(""),
});

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid id" });
  next();
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function notifyProfessional(professional, user, request) {
  const lines = [
    "You have a new consultation request through PranatiX.",
    "",
    `From: ${user.name} (${user.email})`,
    `Preferred time: ${request.preferredTime || "Not specified"}`,
    "",
    "Message:",
    request.message,
    "",
    "Please reply to the person directly by email.",
  ];
  await sendMail({
    to: professional.contactEmail,
    subject: "New consultation request via PranatiX",
    text: lines.join("\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;line-height:1.5;color:#222">
<h2>New consultation request</h2>
<p><strong>From:</strong> ${escapeHtml(user.name)} (${escapeHtml(user.email)})</p>
<p><strong>Preferred time:</strong> ${escapeHtml(request.preferredTime || "Not specified")}</p>
<p><strong>Message:</strong><br>${escapeHtml(request.message).replace(/\n/g, "<br>")}</p>
<p style="color:#666;font-size:13px">Please reply to the person directly by email.</p>
</div>`,
  });
}

// Directory. Only verified, active professionals are listed.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { verified: true, active: true };
    const { q, specialization, language } = req.query;
    if (typeof specialization === "string" && specialization.trim()) {
      filter.specializations = specialization.trim().toLowerCase();
    }
    if (typeof language === "string" && language.trim()) {
      filter.languages = language.trim().toLowerCase();
    }
    if (typeof q === "string" && q.trim()) {
      const pattern = new RegExp(escapeRegex(q.trim().slice(0, 50)), "i");
      filter.$or = [{ name: pattern }, { title: pattern }];
    }
    const professionals = await Professional.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ name: 1 })
      .limit(50);
    res.json(professionals);
  }),
);

// Values for the filter chips.
router.get(
  "/filters",
  asyncHandler(async (req, res) => {
    const base = { verified: true, active: true };
    const [specializations, languages] = await Promise.all([
      Professional.distinct("specializations", base),
      Professional.distinct("languages", base),
    ]);
    res.json({
      specializations: specializations.sort(),
      languages: languages.sort(),
    });
  }),
);

router.get(
  "/requests/mine",
  asyncHandler(async (req, res) => {
    const requests = await ConsultRequest.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("professional", "name title isSample");
    res.json(requests);
  }),
);

router.patch(
  "/requests/:id/cancel",
  validId,
  asyncHandler(async (req, res) => {
    const request = await ConsultRequest.findOneAndUpdate(
      { _id: req.params.id, user: req.userId, status: "pending" },
      { status: "cancelled" },
      { new: true },
    );
    if (!request)
      return res.status(404).json({ message: "Pending request not found" });
    res.json(request);
  }),
);

router.get(
  "/:id",
  validId,
  asyncHandler(async (req, res) => {
    const professional = await Professional.findOne({
      _id: req.params.id,
      verified: true,
      active: true,
    }).select(PUBLIC_FIELDS);
    if (!professional)
      return res.status(404).json({ message: "Professional not found" });
    res.json(professional);
  }),
);

router.post(
  "/:id/request",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });

    const professional = await Professional.findOne({
      _id: req.params.id,
      verified: true,
      active: true,
    }).select("+contactEmail");
    if (!professional)
      return res.status(404).json({ message: "Professional not found" });

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentCount, duplicate] = await Promise.all([
      ConsultRequest.countDocuments({
        user: req.userId,
        createdAt: { $gte: dayAgo },
      }),
      ConsultRequest.exists({
        user: req.userId,
        professional: professional._id,
        status: "pending",
      }),
    ]);
    if (duplicate)
      return res
        .status(409)
        .json({
          message: "You already have a pending request with this professional.",
        });
    if (recentCount >= MAX_REQUESTS_PER_DAY) {
      return res
        .status(429)
        .json({
          message:
            "You have sent several requests today. Please try again tomorrow.",
        });
    }

    const request = await ConsultRequest.create({
      ...parsed.data,
      user: req.userId,
      professional: professional._id,
    });

    // Sample professionals never receive email. Mail failures never fail the request.
    if (!professional.isSample && professional.contactEmail) {
      User.findById(req.userId)
        .then((user) => user && notifyProfessional(professional, user, request))
        .catch((err) =>
          console.error("Could not notify professional:", err.message),
        );
    }

    res.status(201).json({
      ...request.toObject(),
      professional: {
        _id: professional._id,
        name: professional.name,
        title: professional.title,
        isSample: professional.isSample,
      },
      safety: assessRisk(parsed.data.message),
    });
  }),
);

export default router;
