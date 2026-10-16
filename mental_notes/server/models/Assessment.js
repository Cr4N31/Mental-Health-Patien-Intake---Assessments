import mongoose from "mongoose";
import { FORMS, scoreAssessment } from "../utils/scoring.js";

const assessmentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    type: { type: String, enum: Object.keys(FORMS), required: true },

    answers: { type: [Number], required: true },
    totalScore: { type: Number, required: true },
    severity: { type: String, required: true },
    riskFlag: { type: Boolean, default: false },
    riskAcknowledgedAt: { type: Date }, // therapist clicked "reviewed"

    isBaseline: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

assessmentSchema.index({ client: 1, type: 1, completedAt: -1 });

// Always compute the score on the server from the raw answers.
// Never trust a score sent by the browser.
assessmentSchema.statics.createScored = async function ({
  client,
  therapist,
  type,
  answers,
}) {
  const result = scoreAssessment(type, answers);
  const previousCount = await this.countDocuments({ client, type });
  return this.create({
    client,
    therapist,
    type,
    answers,
    totalScore: result.totalScore,
    severity: result.severity,
    riskFlag: result.riskFlag,
    isBaseline: previousCount === 0,
  });
};

export default mongoose.model("Assessment", assessmentSchema);
