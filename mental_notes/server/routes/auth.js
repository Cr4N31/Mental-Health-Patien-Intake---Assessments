import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import Therapist from "../models/Therapist.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, "Password must be at least 10 characters"),
  licenseNumber: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Used so a login for an unknown email takes about as long as a real one.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

function setAuthCookie(res, therapistId) {
  const token = jwt.sign({ sub: therapistId }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

function publicTherapist(t) {
  return {
    id: t._id,
    name: t.name,
    email: t.email,
    licenseNumber: t.licenseNumber,
  };
}

router.post("/register", authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  if ((await Therapist.countDocuments()) > 0) {
    return res.status(403).json({ message: "Registration is closed" });
  }

  const { name, email, password, licenseNumber } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const therapist = await Therapist.create({
    name,
    email,
    passwordHash,
    licenseNumber,
  });

  setAuthCookie(res, therapist._id);
  res.status(201).json(publicTherapist(therapist));
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Enter a valid email and password" });
  }

  const { email, password } = parsed.data;
  const therapist = await Therapist.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(
    password,
    therapist?.passwordHash ?? DUMMY_HASH,
  );

  if (!therapist || !ok) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  setAuthCookie(res, therapist._id);
  res.json(publicTherapist(therapist));
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const therapist = await Therapist.findById(req.therapistId);
  if (!therapist) return res.status(401).json({ message: "Not authenticated" });
  res.json(publicTherapist(therapist));
});

export default router;
