import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import ResonancePost from "../models/ResonancePost.js";
import ResonanceComment from "../models/ResonanceComment.js";
import ConsultRequest from "../models/ConsultRequest.js";
import AdminAction from "../models/AdminAction.js";
import User from "../models/User.js";
import LoginEvent from "../models/LoginEvent.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const staff = requireRole("moderator", "admin");
const adminOnly = requireRole("admin");
const REVIEW = ["held", "hidden"];
const ANALYTICS_RANGES = {
  "1h": { unit: "minute", binSize: 5, count: 12 },
  "5h": { unit: "minute", binSize: 15, count: 20 },
  "24h": { unit: "hour", binSize: 1, count: 24 },
  "3m": { unit: "day", binSize: 1, count: 90 },
  "12m": { unit: "month", binSize: 1, count: 12 },
};

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

router.get(
  "/analytics",
  adminOnly,
  asyncHandler(async (req, res) => {
    const range = ANALYTICS_RANGES[req.query.range];
    if (!range)
      return res
        .status(400)
        .json({ message: "Choose a valid analytics range" });

    const now = new Date();
    let start;
    let end;
    if (range.unit === "month") {
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1));
      start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - range.count + 1),
      );
    } else {
      const duration =
        range.binSize * (range.unit === "minute" ? 60_000 : 3_600_000);
      end = new Date(
        Math.floor(now.getTime() / duration) * duration + duration,
      );
      start = new Date(end.getTime() - range.count * duration);
      if (range.unit === "day") {
        end.setUTCHours(0, 0, 0, 0);
        end.setUTCDate(end.getUTCDate() + 1);
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - range.count);
      }
    }

    const match = { createdAt: { $gte: start, $lt: end } };
    const bucket = {
      $dateTrunc: {
        date: "$createdAt",
        unit: range.unit,
        binSize: range.binSize,
        timezone: "UTC",
      },
    };
    const grouped = (Model, extraGroup = {}) =>
      Model.aggregate([
        { $match: match },
        {
          $group: { _id: { date: bucket, ...extraGroup }, count: { $sum: 1 } },
        },
      ]);

    const [signups, logins, activity, consults] = await Promise.all([
      grouped(User),
      grouped(LoginEvent),
      grouped(AdminAction, { action: "$action" }),
      grouped(ConsultRequest, { status: "$status" }),
    ]);

    const buckets = Array.from({ length: range.count }, (_, index) => {
      const date = new Date(start);
      if (range.unit === "month") date.setUTCMonth(date.getUTCMonth() + index);
      else if (range.unit === "day") date.setUTCDate(date.getUTCDate() + index);
      else
        date.setTime(
          date.getTime() +
            index *
              range.binSize *
              (range.unit === "minute" ? 60_000 : 3_600_000),
        );
      return {
        date: date.toISOString(),
        signups: 0,
        logins: 0,
        activity: 0,
        approved: 0,
        deleted: 0,
        consultPending: 0,
        consultAccepted: 0,
        consultDeclined: 0,
        consultCancelled: 0,
      };
    });
    const bucketByDate = new Map(buckets.map((item) => [item.date, item]));
    const dateKey = (date) => new Date(date).toISOString();
    for (const row of signups) {
      const item = bucketByDate.get(dateKey(row._id.date));
      if (item) item.signups = row.count;
    }
    for (const row of logins) {
      const item = bucketByDate.get(dateKey(row._id.date));
      if (item) item.logins = row.count;
    }
    for (const row of activity) {
      const item = bucketByDate.get(dateKey(row._id.date));
      if (!item) continue;
      item.activity += row.count;
      if (row._id.action === "approve") item.approved = row.count;
      if (row._id.action === "delete") item.deleted = row.count;
    }
    for (const row of consults) {
      const item = bucketByDate.get(dateKey(row._id.date));
      const key = `consult${row._id.status[0].toUpperCase()}${row._id.status.slice(1)}`;
      if (item && key in item) item[key] = row.count;
    }

    res.json({ range: req.query.range, buckets });
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
        note: r.note,
        createdAt: r.createdAt,
      })),
    );
  }),
);

// ---- Accounts and roles (admin only) ----

const roleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const roleSchema = z.object({
  role: z.enum(["user", "moderator", "admin"]),
  password: z.string().min(1, "Enter your password"),
});

router.get(
  "/users",
  adminOnly,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "")
      .trim()
      .slice(0, 60);
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.find(filter)
      .select("name email role emailVerified createdAt lastLoginAt")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json(
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role ?? "user",
        emailVerified: !!u.emailVerified,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt ?? null,
      })),
    );
  }),
);

router.patch(
  "/users/:id/role",
  adminOnly,
  roleLimiter,
  validId,
  asyncHandler(async (req, res) => {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    const { role, password } = parsed.data;

    if (String(req.params.id) === String(req.userId))
      return res
        .status(400)
        .json({ message: "You cannot change your own role." });

    // Re-check the admin's password before changing anyone's access.
    const me = await User.findById(req.userId).select("+passwordHash");
    if (!me || !(await bcrypt.compare(password, me.passwordHash)))
      return res.status(403).json({ message: "Incorrect password" });

    const target = await User.findById(req.params.id).select("role");
    if (!target) return res.status(404).json({ message: "Account not found" });

    const from = target.role ?? "user";
    if (from === role)
      return res.status(400).json({ message: "They already have that role." });
    await User.updateOne({ _id: target._id }, { role });
    await AdminAction.create({
      admin: req.userId,
      action: "role_change",
      targetType: "user",
      targetId: target._id,
      note: `${from} to ${role}`,
    });
    res.json({ ok: true });
  }),
);

export default router;
