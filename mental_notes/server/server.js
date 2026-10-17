import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/client.js";
import formRoutes from "./routes/form.js";
import assessmentRoutes from "./routes/assessments.js";
import noteRoutes from "./routes/notes.js";

const app = express();

app.use(helmet());

app.set("etag", false);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, //needed later for the auth cookie
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/notes", noteRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => console.log(`API is running on port ${PORT}`));
} catch (err) {
  console.error("Failed to start server:", err.message);
  process.exit(1);
}
