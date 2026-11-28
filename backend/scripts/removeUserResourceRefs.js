import mongoose from "mongoose";
import connectDb from "../db.js";
import User from "../models/User.js";

const run = async () => {
  try {
    connectDb();

    await new Promise((resolve, reject) => {
      mongoose.connection.once("open", resolve);
      mongoose.connection.once("error", reject);
    });

    const result = await User.updateMany(
      {
        $or: [
          { company: { $exists: true } },
          { quotations: { $exists: true } },
          { invoices: { $exists: true } },
          { posters: { $exists: true } },
          { products: { $exists: true } },
        ],
      },
      {
        $unset: {
          company: "",
          quotations: "",
          invoices: "",
          posters: "",
          products: "",
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} user document(s).`);
  } catch (error) {
    console.error("Failed to remove old user resource references:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
