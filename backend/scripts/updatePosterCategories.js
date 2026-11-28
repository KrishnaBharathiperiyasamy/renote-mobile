import dotenv from "dotenv";
import mongoose from "mongoose";
import Poster from "../models/Poster.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/Renote_DB";

async function migrate() {
  try {
    console.log("Connecting to MongoDB for poster category migration...");
    await mongoose.connect(MONGO_URI);

    const res = await Poster.updateMany(
      {},
      {
        $set: {
          marketplaceCategory: "Electronics & Appliances",
          marketplaceSubcategory: "Computers & Laptops",
        },
      }
    );

    console.log(`Migration Complete: Updated ${res.modifiedCount} poster(s) to 'Electronics & Appliances' / 'Computers & Laptops'.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
