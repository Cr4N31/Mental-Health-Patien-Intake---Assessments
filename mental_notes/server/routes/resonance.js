import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import ResonancePost from "../models/ResonancePost.js";
import ResonanceComment from "../models/ResonanceComment.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assessRisk } from "../utils/safety.js";
import {
  keyFor,
  pseudonymFor,
  containsContactInfo,
  hitLimit,
} from "../utils/resonance.js";

const router = Router();
router.use(requireAuth);

const REPORT_THRESHOLD = 3;
const POSTS_PER_HOUR = 5;
const COMMENTS_PER_HOUR = 20;

const postSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(1000),
});
const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(500),
});
const reportSchema = z.object({
  reason: z.string().trim().max(200).default(""),
});

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid id" });
  next();
}

const uid = (req) => String(req.userId);

function shapePost(p, userId) {
  return {
    _id: p._id,
    body: p.body,
    pseudonym: pseudonymFor(p.authorKey),
    isMine: keyFor(userId, p._id) === p.authorKey,
    reactionCount: p.reactionCount,
    reacted: p.reactorKeys.includes(keyFor(userId, p._id, "react")),
    commentCount: p.commentCount,
    createdAt: p.createdAt,
  };
}

function shapeComment(c, post, userId) {
  return {
    _id: c._id,
    body: c.body,
    pseudonym: pseudonymFor(c.authorKey),
    isMine: keyFor(userId, c.postId) === c.authorKey,
    isOP: c.authorKey === post.authorKey,
    createdAt: c.createdAt,
  };
}

// Returns an error message, or { status, safety }.
function screen(text) {
  if (containsContactInfo(text)) {
    return {
      error:
        "For everyone's safety, please remove links, emails and phone numbers.",
    };
  }
  const safety = assessRisk(text);
  return { status: safety === "high" ? "held" : "published", safety };
}

// Feed: GET /posts?cursor=<lastId>&limit=20
router.get(
  "/posts",
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const filter = { status: "published" };
    if (mongoose.isValidObjectId(req.query.cursor))
      filter._id = { $lt: req.query.cursor };
    const posts = await ResonancePost.find(filter)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
    const userId = uid(req);
    res.json({
      posts: posts.map((p) => shapePost(p, userId)),
      nextCursor:
        posts.length === limit
          ? String(posts[posts.length - 1]._id)
          : undefined,
    });
  }),
);

router.post(
  "/posts",
  asyncHandler(async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    const text = parsed.data.body;
    const userId = uid(req);

    const s = screen(text);
    if (s.error) return res.status(400).json({ message: s.error });
    if (hitLimit(userId, "post", POSTS_PER_HOUR))
      return res.status(429).json({
        message: "You have reached the hourly post limit. Try again later.",
      });

    const _id = new mongoose.Types.ObjectId();
    const post = await ResonancePost.create({
      _id,
      authorKey: keyFor(userId, _id),
      body: text,
      status: s.status,
    });

    // High risk: held, not published. The author only sees the support card.
    if (s.status === "held")
      return res.status(202).json({ held: true, safety: s.safety });

    res.status(201).json({
      post: shapePost(post.toObject(), userId),
      safety: s.safety,
    });
  }),
);

router.get(
  "/posts/:id",
  validId,
  asyncHandler(async (req, res) => {
    const post = await ResonancePost.findOne({
      _id: req.params.id,
      status: "published",
    }).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(shapePost(post, uid(req)));
  }),
);

router.delete(
  "/posts/:id",
  validId,
  asyncHandler(async (req, res) => {
    const post = await ResonancePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (keyFor(uid(req), post._id) !== post.authorKey)
      return res.status(403).json({ message: "Not allowed" });
    await ResonanceComment.deleteMany({ postId: post._id });
    await post.deleteOne();
    res.json({ ok: true });
  }),
);

router.post(
  "/posts/:id/react",
  validId,
  asyncHandler(async (req, res) => {
    const post = await ResonancePost.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    const k = keyFor(uid(req), post._id, "react");
    const had = post.reactorKeys.includes(k);
    if (had) post.reactorKeys.pull(k);
    else post.reactorKeys.push(k);
    post.reactionCount = post.reactorKeys.length;
    await post.save();
    res.json({ reacted: !had, reactionCount: post.reactionCount });
  }),
);

router.get(
  "/posts/:id/comments",
  validId,
  asyncHandler(async (req, res) => {
    const post = await ResonancePost.findOne({
      _id: req.params.id,
      status: "published",
    }).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comments = await ResonanceComment.find({
      postId: post._id,
      status: "published",
    })
      .sort({ _id: 1 })
      .limit(200)
      .lean();
    const userId = uid(req);
    res.json(comments.map((c) => shapeComment(c, post, userId)));
  }),
);

router.post(
  "/posts/:id/comments",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: parsed.error.issues[0].message });
    const text = parsed.data.body;
    const userId = uid(req);

    const post = await ResonancePost.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const s = screen(text);
    if (s.error) return res.status(400).json({ message: s.error });
    if (hitLimit(userId, "comment", COMMENTS_PER_HOUR))
      return res.status(429).json({
        message: "You have reached the hourly comment limit. Try again later.",
      });

    const comment = await ResonanceComment.create({
      postId: post._id,
      authorKey: keyFor(userId, post._id),
      body: text,
      status: s.status,
    });

    if (s.status === "held")
      return res.status(202).json({ held: true, safety: s.safety });

    await ResonancePost.updateOne(
      { _id: post._id },
      { $inc: { commentCount: 1 } },
    );
    res.status(201).json({
      comment: shapeComment(comment.toObject(), post, userId),
      safety: s.safety,
    });
  }),
);

router.delete(
  "/comments/:id",
  validId,
  asyncHandler(async (req, res) => {
    const c = await ResonanceComment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Comment not found" });
    if (keyFor(uid(req), c.postId) !== c.authorKey)
      return res.status(403).json({ message: "Not allowed" });
    const wasPublished = c.status === "published";
    await c.deleteOne();
    if (wasPublished)
      await ResonancePost.updateOne(
        { _id: c.postId },
        { $inc: { commentCount: -1 } },
      );
    res.json({ ok: true });
  }),
);

// Dedupes by a salted HMAC reporter key. Hides at 3 distinct reporters.
async function addReport(doc, userId, reason) {
  const rk = keyFor(userId, doc._id, "report");
  if (doc.reports.some((r) => r.key === rk)) return false;
  doc.reports.push({ key: rk, reason });
  let hidden = false;
  if (doc.reports.length >= REPORT_THRESHOLD && doc.status === "published") {
    doc.status = "hidden";
    hidden = true;
  }
  await doc.save();
  return hidden;
}

router.post(
  "/posts/:id/report",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = reportSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid report" });
    const post = await ResonancePost.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    const userId = uid(req);
    if (keyFor(userId, post._id) === post.authorKey)
      return res
        .status(400)
        .json({ message: "You cannot report your own post." });
    await addReport(post, userId, parsed.data.reason);
    res.json({ ok: true }); // never reveal whether it was hidden
  }),
);

router.post(
  "/comments/:id/report",
  validId,
  asyncHandler(async (req, res) => {
    const parsed = reportSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid report" });
    const c = await ResonanceComment.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!c) return res.status(404).json({ message: "Comment not found" });
    const userId = uid(req);
    if (keyFor(userId, c.postId) === c.authorKey)
      return res
        .status(400)
        .json({ message: "You cannot report your own comment." });
    const hidden = await addReport(c, userId, parsed.data.reason);
    if (hidden)
      await ResonancePost.updateOne(
        { _id: c.postId },
        { $inc: { commentCount: -1 } },
      );
    res.json({ ok: true });
  }),
);

export default router;
