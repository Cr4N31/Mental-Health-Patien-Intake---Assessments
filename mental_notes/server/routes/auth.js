import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

const CONSENT_VERSION = "v1";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(72, "Password is too long"),
  consent: z.any().refine((v) => v === true, {
    message: "You must accept the consent terms to create an account",
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Used so a login for an unknown email takes about as long as a real one.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

// Cookie settings. If the client calls the API on a different site (for example
// Vercel to Render with no proxy), set COOKIE_CROSS_SITE=true in production so the
// cookie is SameSite=None. If /api is proxied through the client's domain, leave it unset.
const isProd = process.env.NODE_ENV === "production";
const crossSite = isProd && process.env.COOKIE_CROSS_SITE === "true";
const cookieOptions = {
  httpOnly: true,
  sameSite: crossSite ? "none" : "lax",
  secure: isProd,
  path: "/",
};
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.cookie("token", token, { ...cookieOptions, maxAge: SEVEN_DAYS });
}

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email };
}

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await User.create({
        name,
        email,
        passwordHash,
        consentAcceptedAt: new Date(),
        consentVersion: CONSENT_VERSION,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: "An account with this email already exists" });
      }
      throw err;
    }

    setAuthCookie(res, user._id);
    res.status(201).json(publicUser(user));
  }),
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Enter a valid email and password" });
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    setAuthCookie(res, user._id);
    res.json(publicUser(user));
  }),
);

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out" });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      res.clearCookie("token", cookieOptions);
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(publicUser(user));
  }),
);

export default router;
