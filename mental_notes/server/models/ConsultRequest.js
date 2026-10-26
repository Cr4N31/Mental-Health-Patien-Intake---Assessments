import mongoose from "mongoose";

const consultRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
    message: { type: String, trim: true, required: true, maxlength: 1000 },
    preferredTime: { type: String, trim: true, maxlength: 200, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

consultRequestSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.ConsultRequest ||
  mongoose.model("ConsultRequest", consultRequestSchema);
