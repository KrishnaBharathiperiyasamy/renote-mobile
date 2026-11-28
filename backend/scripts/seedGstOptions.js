// Run once: node scripts/seedGstOptions.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = "mongodb://localhost:27017/Renote_DB";

await mongoose.connect(MONGO_URI);

const result = await mongoose.connection.db.collection("systemsettings").updateOne(
  { key: "gst_options" },
  { $setOnInsert: { key: "gst_options", value: [0, 5, 18, 40], createdAt: new Date(), updatedAt: new Date() } },
  { upsert: true }
);

if (result.upsertedCount) {
  console.log("GST options seeded: [0, 5, 18, 40]");
} else {
  console.log("GST options already exist, not overwritten.");
}

await mongoose.disconnect();
