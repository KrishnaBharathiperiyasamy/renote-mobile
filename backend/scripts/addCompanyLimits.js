/**
 * One-time migration to add limits.companies to existing Plan documents.
 *
 * Usage:  node scripts/addCompanyLimits.js
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDb from '../db.js';
import Plan from '../models/Plan.js';

const LIMITS = {
  free: 1,
  starter: 2,
  pro: 3,
  business: 5,
};

async function migrate() {
  connectDb();
  await new Promise((resolve) => {
    mongoose.connection.once('connected', resolve);
    if (mongoose.connection.readyState === 1) resolve();
  });

  for (const [slug, limit] of Object.entries(LIMITS)) {
    const result = await Plan.updateOne(
      { slug },
      { $set: { 'limits.companies': limit } }
    );
    if (result.matchedCount) {
      console.log(`✔ ${slug} → ${limit} companies`);
    } else {
      console.log(`⚠ "${slug}" not found in DB`);
    }
  }

  console.log('Done.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
