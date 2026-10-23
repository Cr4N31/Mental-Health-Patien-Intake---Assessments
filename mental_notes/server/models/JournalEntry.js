import mongoose from "mongoose";

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    body: { type: String, trim: true, required: true, maxlength: 10000 },
    prompt: { type: String, trim: true, maxlength: 280, default: "" },
    entryDate: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

journalEntrySchema.index({ user: 1, entryDate: -1 });

export default mongoose.model("JournalEntry", journalEntrySchema);


