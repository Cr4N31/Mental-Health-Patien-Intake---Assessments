import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Assessment from "../models/Assessment.js";
import JournalEntry from "../models/JournalEntry.js";
import MoodCheckIn from "../models/MoodCheckIn.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendMail } from "../utils/mailer.js";

const router = Router();

const CONSENT_VERSION = "v1";
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(72, "Password is too long");

const tokenSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "This link is invalid or has expired");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  consent: z.any().refine((v) => v === true, {
    message: "You must accept the consent terms to create an account",
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const verifySchema = z.object({ token: tokenSchema });
const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
const resetSchema = z.object({ token: tokenSchema, password: passwordSchema });
const deleteSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});

// Used so a login for an unknown email takes about as long as a real one.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

// Cookie settings. If the client calls the API on a different site, set
// COOKIE_CROSS_SITE=true in production so the cookie is SameSite=None.
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

function createAuthToken(userId) {
  return jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    emailVerified: !!u.emailVerified,
  };
}

// ---- Tokens and email ----

const newToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");
const clientLink = (path, token) =>
  `${(process.env.CLIENT_URL || "").replace(/\/$/, "")}${path}?token=${token}`;

function mailTemplate({ heading, body, buttonText, url, footer }) {
  return {
    text: `${heading}\n\n${body}\n\n${buttonText}: ${url}\n\n${footer}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;line-height:1.5;color:#222">
<h2>${heading}</h2>
<p>${body}</p>
<p><a href="${url}" style="display:inline-block;background:#2f6f62;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${buttonText}</a></p>
<p style="color:#666;font-size:13px">${footer}</p>
<p style="color:#666;font-size:13px">If the button does not work, copy this link into your browser:<br>${url}</p>
</div>`,
  };
}

async function sendVerificationEmail(user) {
  const token = newToken();
  await User.updateOne(
    { _id: user._id },
    {
      emailVerifyTokenHash: hashToken(token),
      emailVerifyExpiresAt: new Date(Date.now() + VERIFY_TTL_MS),
    },
  );
  const url = clientLink("/verify-email", token);
  await sendMail({
    to: user.email,
    subject: "Verify your email for Mental Notes",
    ...mailTemplate({
      heading: "Verify your email",
      body: "Thanks for creating a Mental Notes account. Please confirm your email address. This link works for 24 hours.",
      buttonText: "Verify my email",
      url,
      footer: "If you did not create this account, you can ignore this email.",
    }),
  });
}

async function sendResetEmail(user) {
  const token = newToken();
  await User.updateOne(
    { _id: user._id },
    {
      resetTokenHash: hashToken(token),
      resetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  );
  const url = clientLink("/reset-password", token);
  await sendMail({
    to: user.email,
    subject: "Reset your Mental Notes password",
    ...mailTemplate({
      heading: "Reset your password",
      body: "We received a request to reset your password. This link works for 1 hour.",
      buttonText: "Choose a new password",
      url,
      footer:
        "If you did not ask for this, you can ignore this email. Your password will not change.",
    }),
  });
}

const logMailError = (what) => (err) =>
  console.error(`Could not send ${what} email:`, err.message);

// ---- Routes ----

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

    // Do not make the patient wait for (or fail on) the email
    sendVerificationEmail(user).catch(logMailError("verification"));

    setAuthCookie(res, user._id);
    res.status(201).json(publicUser(user));
  }),
);

// Native clients store this bearer token in platform secure storage.
// The existing cookie endpoints remain unchanged for the browser application.
router.post(
  "/mobile/session",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Enter a valid email and password" });
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: createAuthToken(user._id), user: publicUser(user) });
  }),
);

router.post(
  "/mobile/register",
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
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      throw err;
    }
    sendVerificationEmail(user).catch(logMailError("verification"));
    res.status(201).json({ token: createAuthToken(user._id), user: publicUser(user) });
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

// Confirm an email address from the link in the verification email.
router.post(
  "/verify-email",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "This verification link is invalid or has expired" });
    }

    const user = await User.findOneAndUpdate(
      {
        emailVerifyTokenHash: hashToken(parsed.data.token),
        emailVerifyExpiresAt: { $gt: new Date() },
      },
      {
        emailVerified: true,
        $unset: { emailVerifyTokenHash: 1, emailVerifyExpiresAt: 1 },
      },
    );

    if (!user) {
      return res
        .status(400)
        .json({ message: "This verification link is invalid or has expired" });
    }
    res.json({ message: "Email verified" });
  }),
);

// Send a fresh verification email to the logged-in user.
router.post(
  "/resend-verification",
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    if (user.emailVerified)
      return res.json({ message: "Your email is already verified" });

    try {
      await sendVerificationEmail(user);
    } catch (err) {
      console.error("Could not send verification email:", err.message);
      return res.status(500).json({
        message:
          "We could not send the email right now. Please try again later.",
      });
    }
    res.json({ message: "Verification email sent" });
  }),
);

// Always answers the same way, so it cannot be used to find out who has an account.
router.post(
  "/forgot-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const user = await User.findOne({ email: parsed.data.email });
    if (user) {
      sendResetEmail(user).catch(logMailError("password reset"));
    }

    res.json({
      message:
        "If an account exists for that email, we have sent a reset link.",
    });
  }),
);

router.post(
  "/reset-password",
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { token, password } = parsed.data;
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "This reset link is invalid or has expired" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.updateOne(
      { _id: user._id },
      {
        passwordHash,
        passwordChangedAt: new Date(), // signs out every existing session
        emailVerified: true, // they received the email, so the address is theirs
        $unset: { resetTokenHash: 1, resetExpiresAt: 1 },
      },
    );

    res.json({ message: "Password updated. You can now log in." });
  }),
);

// Permanently delete the account and every result. Needs the password.
router.delete(
  "/account",
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = deleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const user = await User.findById(req.userId).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(403).json({ message: "Incorrect password" });

    await Promise.all([
      Assessment.deleteMany({ user: user._id }),
      JournalEntry.deleteMany({ user: user._id }),
      MoodCheckIn.deleteMany({ user: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });

    res.clearCookie("token", cookieOptions);
    res.json({
      message: "Your account and private reflections have been deleted",
    });
  }),
);

export default router;
