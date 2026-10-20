import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    // Never returned by default. Login uses .select("+passwordHash").
    passwordHash: { type: String, required: true, select: false },

    // Consent captured at sign-up
    consentAcceptedAt: { type: Date, required: true },
    consentVersion: { type: String, required: true, default: "v1" },
  },
  { timestamps: true },
);

// Safety net: strip the hash if a user document is ever serialized
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
