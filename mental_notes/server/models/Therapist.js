import mongoose from "mongoose";

const therapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    licenseNumber: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("Therapist", therapistSchema);
