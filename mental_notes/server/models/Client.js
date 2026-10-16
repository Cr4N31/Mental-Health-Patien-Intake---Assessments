import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    status: { type: String, enum: ["active", "discharged"], default: "active" },

    // Store only a hash of the form link token. The raw token is shown once
    // when the link is created and emailed to the client.
    formTokenHash: { type: String, index: true },
    formTokenExpiresAt: { type: Date },
    formTypes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Client", clientSchema);
