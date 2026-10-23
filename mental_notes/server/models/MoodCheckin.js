import mongoose from "mongoose";

const moodCheckInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    score: { type: Number, required: true, min: 1, max: 5 },
    emotions: { type: [String], default: [] },
    note: { type: String, trim: true, maxlength: 500, default: "" },
    checkedInAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

moodCheckInSchema.index({ user: 1, checkedInAt: -1 });

export default mongoose.model("MoodCheckIn", moodCheckInSchema);
