import mongoose from "mongoose";

const ResonancePostSchema = new mongoose.Schema({
  authorKey: { type: String, required: true },
  anonymous: { type: Boolean, default: true },
  displayName: { type: String, maxlength: 100 },
  body: { type: String, required: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ["published", "held", "hidden"],
    default: "published",
    index: true,
  },
  reactorKeys: { type: [String], default: [] },
  reactionCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  reports: { type: [{ key: String, reason: String }], default: [] },
  createdAt: { type: Date, default: Date.now },
});

ResonancePostSchema.index({ status: 1, _id: -1 });

export default mongoose.model("ResonancePost", ResonancePostSchema);
