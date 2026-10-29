import express from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { assessRisk } from "../utils/safety.js";
import {
  keyFor,
  pseudonymFor,
  containsContactInfo,
  hitLimit,
} from "../utils/resonance.js";
import Post from "../models/ResonancePost.js";
import Comment from "../models/ResonanceComment.js";

const router = express.Router();
router.use(requireAuth);

const REPORT_THRESHOLD = 3;
const POSTS_PER_HOUR = 5;
const COMMENTS_PER_HOUR = 20;

// Adapter: normalize whatever assessRisk returns into 'high' | 'elevated' | 'none'
function levelOf(text) {
  const r = assessRisk(text);
  const l = typeof r === "string" ? r : r && (r.level || r.risk);
  if (l === "high") return "high";
  if (l === "elevated" || l === "moderate") return "elevated";
  return "none";
}

const uid = (req) => String(req.user._id);
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

function shapePost(p, userId) {
  return {
    id: p._id,
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
    id: c._id,
    body: c.body,
    pseudonym: pseudonymFor(c.authorKey),
    isMine: keyFor(userId, c.postId) === c.authorKey,
    isOP: c.authorKey === post.authorKey,
    createdAt: c.createdAt,
  };
}

// Shared screening for posts and comments.
// Returns { error } or { status, support }.
function screen(body) {
  if (typeof body !== "string" || !body.trim())
    return { error: "Write something first." };
  if (containsContactInfo(body)) {
    return {
      error:
        "For everyone's safety, please remove links, emails and phone numbers.",
    };
  }
  const level = levelOf(body);
  if (level === "high") return { status: "held", support: true };
  if (level === "elevated") return { status: "published", support: true };
  return { status: "published", support: false };
}

// GET /posts?cursor=<lastId>&limit=20
router.get("/posts", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const q = { status: "published" };
    if (req.query.cursor && validId(req.query.cursor))
      q._id = { $lt: req.query.cursor };
    const posts = await Post.find(q).sort({ _id: -1 }).limit(limit).lean();
    const userId = uid(req);
    res.json({
      posts: posts.map((p) => shapePost(p, userId)),
      nextCursor:
        posts.length === limit
          ? String(posts[posts.length - 1]._id)
          : undefined,
    });
  } catch (e) {
    res.status(500).json({ error: "Could not load posts." });
  }
});

// POST /posts { body }
router.post("/posts", async (req, res) => {
  try {
    const userId = uid(req);
    const s = screen(req.body.body);
    if (s.error) return res.status(400).json({ error: s.error });
    if (hitLimit(userId, "post", POSTS_PER_HOUR)) {
      return res.status(429).json({
        error: "You have reached the hourly post limit. Try again later.",
      });
    }
    const _id = new mongoose.Types.ObjectId();
    const post = await Post.create({
      _id,
      authorKey: keyFor(userId, _id),
      body: req.body.body.trim(),
      status: s.status,
    });
    if (s.status === "held") {
      // Not published. Author sees the support card, nothing else is revealed.
      return res.status(202).json({ held: true, support: true });
    }
    res
      .status(201)
      .json({ post: shapePost(post.toObject(), userId), support: s.support });
  } catch (e) {
    res.status(500).json({ error: "Could not create post." });
  }
});

// GET /posts/:id
router.get("/posts/:id", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    }).lean();
    if (!post) return res.status(404).json({ error: "Not found." });
    res.json({ post: shapePost(post, uid(req)) });
  } catch (e) {
    res.status(500).json({ error: "Could not load post." });
  }
});

// DELETE /posts/:id (author only)
router.delete("/posts/:id", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found." });
    if (keyFor(uid(req), post._id) !== post.authorKey) {
      return res.status(403).json({ error: "Not allowed." });
    }
    await Comment.deleteMany({ postId: post._id });
    await post.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not delete post." });
  }
});

// POST /posts/:id/react (toggle)
router.post("/posts/:id/react", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ error: "Not found." });
    const k = keyFor(uid(req), post._id, "react");
    const has = post.reactorKeys.includes(k);
    if (has) post.reactorKeys.pull(k);
    else post.reactorKeys.push(k);
    post.reactionCount = post.reactorKeys.length;
    await post.save();
    res.json({ reacted: !has, reactionCount: post.reactionCount });
  } catch (e) {
    res.status(500).json({ error: "Could not react." });
  }
});

// GET /posts/:id/comments
router.get("/posts/:id/comments", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    }).lean();
    if (!post) return res.status(404).json({ error: "Not found." });
    const comments = await Comment.find({
      postId: post._id,
      status: "published",
    })
      .sort({ _id: 1 })
      .limit(200)
      .lean();
    const userId = uid(req);
    res.json({ comments: comments.map((c) => shapeComment(c, post, userId)) });
  } catch (e) {
    res.status(500).json({ error: "Could not load comments." });
  }
});

// POST /posts/:id/comments { body }
router.post("/posts/:id/comments", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const userId = uid(req);
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ error: "Not found." });
    const s = screen(req.body.body);
    if (s.error) return res.status(400).json({ error: s.error });
    if (hitLimit(userId, "comment", COMMENTS_PER_HOUR)) {
      return res.status(429).json({
        error: "You have reached the hourly comment limit. Try again later.",
      });
    }
    const comment = await Comment.create({
      postId: post._id,
      authorKey: keyFor(userId, post._id),
      body: req.body.body.trim(),
      status: s.status,
    });
    if (s.status === "held")
      return res.status(202).json({ held: true, support: true });
    await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
    res.status(201).json({
      comment: shapeComment(comment.toObject(), post, userId),
      support: s.support,
    });
  } catch (e) {
    res.status(500).json({ error: "Could not add comment." });
  }
});

// DELETE /comments/:id (author only)
router.delete("/comments/:id", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found." });
    if (keyFor(uid(req), c.postId) !== c.authorKey) {
      return res.status(403).json({ error: "Not allowed." });
    }
    const wasPublished = c.status === "published";
    await c.deleteOne();
    if (wasPublished)
      await Post.updateOne({ _id: c.postId }, { $inc: { commentCount: -1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not delete comment." });
  }
});

// Report helper: dedupes by an HMAC reporter key, auto-hides at 3 distinct reporters.
async function report(Model, doc, userId, reason, onHide) {
  const rk = keyFor(userId, doc._id, "report");
  if (doc.reports.some((r) => r.key === rk)) return { already: true };
  doc.reports.push({ key: rk, reason: String(reason || "").slice(0, 200) });
  if (doc.reports.length >= REPORT_THRESHOLD && doc.status === "published") {
    doc.status = "hidden";
    if (onHide) await onHide();
  }
  await doc.save();
  return { hidden: doc.status === "hidden" };
}

// POST /posts/:id/report { reason? }
router.post("/posts/:id/report", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const post = await Post.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!post) return res.status(404).json({ error: "Not found." });
    const userId = uid(req);
    if (keyFor(userId, post._id) === post.authorKey) {
      return res
        .status(400)
        .json({ error: "You cannot report your own post." });
    }
    await report(Post, post, userId, req.body.reason);
    res.json({ ok: true }); // never reveal whether it was hidden
  } catch (e) {
    res.status(500).json({ error: "Could not report." });
  }
});

// POST /comments/:id/report { reason? }
router.post("/comments/:id/report", async (req, res) => {
  try {
    if (!validId(req.params.id))
      return res.status(404).json({ error: "Not found." });
    const c = await Comment.findOne({
      _id: req.params.id,
      status: "published",
    });
    if (!c) return res.status(404).json({ error: "Not found." });
    const userId = uid(req);
    if (keyFor(userId, c.postId) === c.authorKey) {
      return res
        .status(400)
        .json({ error: "You cannot report your own comment." });
    }
    await report(Comment, c, userId, req.body.reason, () =>
      Post.updateOne({ _id: c.postId }, { $inc: { commentCount: -1 } }),
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Could not report." });
  }
});

export default router;
