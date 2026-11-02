import mongoose from "mongoose";

// Records who did what. Never stores post or comment text.
const adminActionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["approve", "delete"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

adminActionSchema.index({ createdAt: -1 });

export default mongoose.models.AdminAction ||
  mongoose.model("AdminAction", adminActionSchema);
