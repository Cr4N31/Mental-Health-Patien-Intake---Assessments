import mongoose from "mongoose";
import { FORMS, scoreAssessment } from "../utils/scoring.js";

const assessmentSchema = new mongoose.Schema(
  {
    // The patient who took the assessment (replaces client + therapist)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: Object.keys(FORMS), required: true },

    answers: { type: [Number], required: true },
    totalScore: { type: Number, required: true },
    severity: { type: String, required: true },
    riskFlag: { type: Boolean, default: false },

    isBaseline: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

assessmentSchema.index({ user: 1, type: 1, completedAt: -1 });

// Always compute the score on the server from the raw answers.
// Never trust a score sent by the browser.
assessmentSchema.statics.createScored = async function ({
  user,
  type,
  answers,
}) {
  const result = scoreAssessment(type, answers);
  const previousCount = await this.countDocuments({ user, type });
  return this.create({
    user,
    type,
    answers,
    totalScore: result.totalScore,
    severity: result.severity,
    riskFlag: result.riskFlag,
    isBaseline: previousCount === 0,
  });
};

assessmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Assessment", assessmentSchema);
