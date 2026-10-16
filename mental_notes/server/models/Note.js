import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
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
    sessionDate: { type: Date, required: true },
    format: { type: String, enum: ["SOAP", "DAP"], default: "SOAP" },

    // Assessments used when drafting, so the note stays accurate
    // even if later scores change.
    assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assessment" }],

    // The therapist's own session bullets, used as input to the draft.
    sessionNotes: { type: String, default: "" },

    sections: {
      subjective: { type: String, default: "" },
      objective: { type: String, default: "" },
      assessment: { type: String, default: "" },
      plan: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: ["draft", "signed"],
      default: "draft",
      index: true,
    },
    signedAt: { type: Date },
  },
  { timestamps: true },
);

// A signed note cannot be edited. Corrections should be a new addendum note.
noteSchema.pre("save", function () {
  if (!this.isNew && this.status === "signed" && !this.isModified("status")) {
    throw new Error("Signed notes cannot be edited");
  }
  if (this.isModified("status") && this.status === "signed") {
    this.signedAt = new Date();
  }
});

export default mongoose.model("Note", noteSchema);
