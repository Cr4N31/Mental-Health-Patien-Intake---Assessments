// Adds SAMPLE professionals for testing. They are made up, flagged isSample,
// and never receive email. Do not show them to real users.
// Run from the repo root:  node server/scripts/seedAllies.js
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../db.js";
import Professional from "../models/Professional.js";

const samples = [
  {
    name: "Sample Counsellor One",
    title: "Counselling Psychologist (sample)",
    specializations: ["anxiety", "stress", "students"],
    languages: ["english"],
    bio: "Sample profile for testing the directory. Not a real person.",
    location: "Online",
    formats: ["video", "audio"],
    priceNote: "Sample price note",
    availabilityNote: "Weekday evenings (sample)",
  },
  {
    name: "Sample Counsellor Two",
    title: "Clinical Psychologist (sample)",
    specializations: ["depression", "burnout", "work stress"],
    languages: ["english", "french"],
    bio: "Sample profile for testing the directory. Not a real person.",
    location: "Abuja (sample)",
    formats: ["video", "in-person"],
    priceNote: "Sample price note",
    availabilityNote: "Saturdays (sample)",
  },
  {
    name: "Sample Counsellor Three",
    title: "Licensed Therapist (sample)",
    specializations: ["relationships", "grief", "anxiety"],
    languages: ["english"],
    bio: "Sample profile for testing the directory. Not a real person.",
    location: "Online",
    formats: ["audio"],
    priceNote: "Sample price note",
    availabilityNote: "Flexible (sample)",
  },
];

await connectDB();
for (const sample of samples) {
  await Professional.updateOne(
    { name: sample.name, isSample: true },
    { $set: { ...sample, verified: true, active: true, isSample: true } },
    { upsert: true },
  );
}
console.log(`Seeded ${samples.length} sample professionals`);
await mongoose.disconnect();
