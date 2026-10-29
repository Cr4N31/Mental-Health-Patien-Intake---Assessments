import mongoose from "mongoose";

const ResonanceCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ResonancePost",
    required: true,
  },
  authorKey: { type: String, required: true },
  body: { type: String, required: true, maxlength: 500 },
  status: {
    type: String,
    enum: ["published", "held", "hidden"],
    default: "published",
  },
  reports: { type: [{ key: String, reason: String }], default: [] },
  createdAt: { type: Date, default: Date.now },
});

ResonanceCommentSchema.index({ postId: 1, status: 1, _id: 1 });

module.exports = mongoose.model("ResonanceComment", ResonanceCommentSchema);
