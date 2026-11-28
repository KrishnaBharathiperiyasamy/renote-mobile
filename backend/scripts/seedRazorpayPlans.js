/**
 * One-time script to create Razorpay Plans and seed their IDs into MongoDB.
 *
 * Usage:  node scripts/seedRazorpayPlans.js
 *
 * What it does:
 * 1. Creates monthly + annual Razorpay Plans for starter, pro, business
 * 2. Updates the local Plan documents with the returned razorpay plan IDs
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDb from '../db.js';
import Razorpay from 'razorpay';
import Plan from '../models/Plan.js';

const rz = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_CONFIG = [
  { slug: 'starter', monthlyPrice: 199, annualPrice: 1999 },
  { slug: 'pro',     monthlyPrice: 349, annualPrice: 3499 },
  { slug: 'business', monthlyPrice: 499, annualPrice: 4999 },
];

async function createRazorpayPlan(name, amount, period, interval) {
  return rz.plans.create({
    period,        // 'monthly' or 'yearly'
    interval,      // 1
    item: {
      name,
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
    },
  });
}

async function main() {
  connectDb();
  // Wait for connection
  await new Promise((resolve) => {
    mongoose.connection.once('connected', resolve);
    if (mongoose.connection.readyState === 1) resolve();
  });
  console.log('Connected to MongoDB');

  for (const cfg of PLAN_CONFIG) {
    const plan = await Plan.findOne({ slug: cfg.slug });
    if (!plan) {
      console.log(`⚠  Plan "${cfg.slug}" not found in DB — skipping`);
      continue;
    }

    // Monthly plan
    if (!plan.razorpayMonthlyPlanId) {
      console.log(`Creating monthly Razorpay plan for "${cfg.slug}" — ₹${cfg.monthlyPrice}/mo`);
      const rzMonthly = await createRazorpayPlan(
        `reNote ${plan.name} — Monthly`,
        cfg.monthlyPrice,
        'monthly',
        1
      );
      plan.razorpayMonthlyPlanId = rzMonthly.id;
      console.log(`  ✔ Monthly plan ID: ${rzMonthly.id}`);
    } else {
      console.log(`  ✔ Monthly plan for "${cfg.slug}" already set: ${plan.razorpayMonthlyPlanId}`);
    }

    // Annual plan
    if (!plan.razorpayAnnualPlanId) {
      console.log(`Creating annual Razorpay plan for "${cfg.slug}" — ₹${cfg.annualPrice}/yr`);
      const rzAnnual = await createRazorpayPlan(
        `reNote ${plan.name} — Annual`,
        cfg.annualPrice,
        'yearly',
        1
      );
      plan.razorpayAnnualPlanId = rzAnnual.id;
      console.log(`  ✔ Annual plan ID: ${rzAnnual.id}`);
    } else {
      console.log(`  ✔ Annual plan for "${cfg.slug}" already set: ${plan.razorpayAnnualPlanId}`);
    }

    await plan.save();
    console.log(`  ✔ Saved "${cfg.slug}" to DB\n`);
  }

  console.log('Done!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
