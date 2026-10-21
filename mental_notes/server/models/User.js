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

    // Email verification. Only a hash of the token is stored.
    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpiresAt: { type: Date, select: false },

    // Password reset. Only a hash of the token is stored.
    resetTokenHash: { type: String, select: false },
    resetExpiresAt: { type: Date, select: false },

    // Sessions issued before this time are rejected (set on password reset)
    passwordChangedAt: { type: Date },
  },
  { timestamps: true },
);

// Safety net: strip secrets if a user document is ever serialized
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerifyTokenHash;
    delete ret.emailVerifyExpiresAt;
    delete ret.resetTokenHash;
    delete ret.resetExpiresAt;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
