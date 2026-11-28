import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";

const dbURI = 'mongodb://localhost:27017/Renote_DB';

async function migrate() {
  try {
    await mongoose.connect(dbURI);
    console.log("Connected to MongoDB for Invoice ID migration...");

    const invoices = await Invoice.find({});
    console.log(`Found ${invoices.length} invoices to check.`);

    const legacyMap = {
      "I2604002": "I/26-27/0001",
      "I2605001": "I/26-27/0002",
      "I2608001": "I/26-27/0003",
      "I2608002": "I/26-27/0004",
    };

    let updatedCount = 0;

    for (const inv of invoices) {
      const raw = (inv.invoiceID || "").trim();
      let newID = null;

      if (legacyMap[raw]) {
        newID = legacyMap[raw];
      } else {
        const match = raw.match(/^I(\d{2})(\d{2})(\d+)$/);
        if (match) {
          const [, yy, mm, seqStr] = match;
          const yearNum = 2000 + parseInt(yy, 10);
          const monthNum = parseInt(mm, 10);
          const startYear = monthNum >= 4 ? yearNum : yearNum - 1;
          const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
          const seq = parseInt(seqStr, 10);
          newID = `I/${fyStr}/${String(seq).padStart(4, "0")}`;
        }
      }

      if (newID && newID !== raw) {
        inv.invoiceID = newID;
        await inv.save();
        console.log(`Updated Invoice ID: ${raw} -> ${newID}`);
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} invoice(s) in DB.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
