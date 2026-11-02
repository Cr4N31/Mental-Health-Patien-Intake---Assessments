import { Router } from "express";
import mongoose from "mongoose";
import ResonancePost from "../models/ResonancePost.js";
import ResonanceComment from "../models/ResonanceComment.js";
import ConsultRequest from "../models/ConsultRequest.js";
import Professional from "../models/Professional.js"; // registers the model for populate
import AdminAction from "../models/AdminAction.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const staff = requireRole("moderator", "admin");
const adminOnly = requireRole("admin");
const REVIEW = ["held", "hidden"];

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid id" });
  next();
}

const log = (adminId, action, targetType, targetId) =>
  AdminAction.create({ admin: adminId, action, targetType, targetId });

// Staff see the text and a short authorKey only. Never an identity.
function shape(doc) {
  return {
    _id: doc._id,
    body: doc.body,
    status: doc.status,
    postId: doc.postId,
    authorKey: doc.authorKey.slice(0, 10),
    reportCount: doc.reports.length,
    reasons: doc.reports.map((r) => r.reason).filter(Boolean),
    createdAt: doc.createdAt,
  };
}

// ---- Review queue (moderator and admin) ----

router.get(
  "/queue",
  staff,
  asyncHandler(async (req, res) => {
    const filter = { status: { $in: REVIEW } };
    const [posts, comments] = await Promise.all([
      ResonancePost.find(filter).sort({ _id: -1 }).limit(50).lean(),
      ResonanceComment.find(filter).sort({ _id: -1 }).limit(50).lean(),
    ]);
    res.json({ posts: posts.map(shape), comments: comments.map(shape) });
  }),
);

router.post(
  "/posts/:id/approve",
  staff,
  validId,
  asyncHandler(async (req, res) => {
    // Reports are cleared, otherwise the next report would hide it again.
    const post = await ResonancePost.findOneAndUpdate(
      { _id: req.params.id, status: { $in: REVIEW } },
      { status: "published", reports: [] },
      { new: true },
    );
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found or already live" });
    await log(req.userId, "approve", "post", post._id);
    res.json({ ok: true });
  }),
);

router.delete(
  "/posts/:id",
  staff,
  validId,
  asyncHandler(async (req, res) => {
    const post = await ResonancePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    await ResonanceComment.deleteMany({ postId: post._id });
    await post.deleteOne();
    await log(req.userId, "delete", "post", post._id);
    res.json({ ok: true });
  }),
);

router.post(
  "/comments/:id/approve",
  staff,
  validId,
  asyncHandler(async (req, res) => {
    const c = await ResonanceComment.findOneAndUpdate(
      { _id: req.params.id, status: { $in: REVIEW } },
      { status: "published", reports: [] },
      { new: true },
    );
    if (!c)
      return res
        .status(404)
        .json({ message: "Comment not found or already live" });
    // Held and hidden comments are not counted, so add it back.
    await ResonancePost.updateOne(
      { _id: c.postId },
      { $inc: { commentCount: 1 } },
    );
    await log(req.userId, "approve", "comment", c._id);
    res.json({ ok: true });
  }),
);

router.delete(
  "/comments/:id",
  staff,
  validId,
  asyncHandler(async (req, res) => {
    const c = await ResonanceComment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Comment not found" });
    const wasPublished = c.status === "published";
    await c.deleteOne();
    if (wasPublished)
      await ResonancePost.updateOne(
        { _id: c.postId },
        { $inc: { commentCount: -1 } },
      );
    await log(req.userId, "delete", "comment", c._id);
    res.json({ ok: true });
  }),
);

// ---- Admin only ----

async function countByStatus(Model) {
  const rows = await Model.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
}

router.get(
  "/stats",
  adminOnly,
  asyncHandler(async (req, res) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, recent, posts, comments, consults] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      countByStatus(ResonancePost),
      countByStatus(ResonanceComment),
      countByStatus(ConsultRequest),
    ]);
    res.json({
      users: { total, last7Days: recent },
      posts,
      comments,
      consults,
      needsReview:
        (posts.held || 0) +
        (posts.hidden || 0) +
        (comments.held || 0) +
        (comments.hidden || 0),
    });
  }),
);

// No user identity and no message text, only what staff need to see volume.
router.get(
  "/consults",
  adminOnly,
  asyncHandler(async (req, res) => {
    const rows = await ConsultRequest.find()
      .select("professional status preferredTime createdAt")
      .populate("professional", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(
      rows.map((r) => ({
        _id: r._id,
        professional: r.professional?.name ?? "Removed profile",
        status: r.status,
        preferredTime: r.preferredTime,
        createdAt: r.createdAt,
      })),
    );
  }),
);

router.get(
  "/audit",
  adminOnly,
  asyncHandler(async (req, res) => {
    const rows = await AdminAction.find()
      .populate("admin", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(
      rows.map((r) => ({
        _id: r._id,
        admin: r.admin?.name ?? "Unknown",
        action: r.action,
        targetType: r.targetType,
        createdAt: r.createdAt,
      })),
    );
  }),
);

export default router;
