import mongoose from "mongoose";

const professionalSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    title: { type: String, trim: true, required: true, maxlength: 120 },
    specializations: [
      { type: String, trim: true, lowercase: true, maxlength: 60 },
    ],
    languages: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    bio: { type: String, trim: true, maxlength: 1000, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    formats: [{ type: String, enum: ["video", "audio", "in-person"] }],
    // Text only for the MVP. There are no payments yet.
    priceNote: { type: String, trim: true, maxlength: 120, default: "" },
    availabilityNote: { type: String, trim: true, maxlength: 200, default: "" },
    // Private. Never returned by the public routes (select: false).
    contactEmail: { type: String, trim: true, lowercase: true, select: false },
    // Manual verification for the MVP: only verified professionals are listed.
    verified: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true },
    // Marks made-up profiles used for testing. The app must label these clearly.
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Professional ||
  mongoose.model("Professional", professionalSchema);
