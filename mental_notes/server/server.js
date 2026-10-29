import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
// Therapist-side routes are archived for now (move the files to routes/_archive/).
// The assessments route is the patient version (Step 3).
import assessmentRoutes from "./routes/assessments.js";
import reflectionRoutes from "./routes/reflections.js";
import allyRoutes from "./routes/allies.js";
import resonanceRoutes from "./routes/resonance.js";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());

app.set("etag", false);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  res.on("finish", () =>
    console.log(req.method, req.originalUrl, res.statusCode),
  );
  next();
});
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/reflections", reflectionRoutes);
app.use("/api/allies", allyRoutes);
app.use("/api/resonance", resonanceRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid request body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "That is too large to send" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

try {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  await connectDB();
  app.listen(PORT, () => console.log(`API is running on port ${PORT}`));
} catch (err) {
  console.error("Failed to start server:", err.message);
  process.exit(1);
}
