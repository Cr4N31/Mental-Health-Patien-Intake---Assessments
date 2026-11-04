import mongoose from "mongoose";

const loginEventSchema = new mongoose.Schema(
  { createdAt: { type: Date, default: Date.now } },
  { versionKey: false },
);

loginEventSchema.index({ createdAt: -1 });

export default mongoose.models.LoginEvent ||
  mongoose.model("LoginEvent", loginEventSchema);
