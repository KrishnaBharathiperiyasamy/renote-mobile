import mongoose from "mongoose";
import Plan from "../models/Plan.js";

const plans = [
  // Starter (Monthly)
  {
    name: "Starter",
    price: 199,
    duration: "monthly",
    razorpayPlanId: "plan_SuHjCJdJNLJYzC",
    features: {
      maxFromCompanies: 2,
      maxPostersPerMonth: 25,
      maxPosterLinks: 10,
      posterLinkExpiryDays: 30,
      maxVideoUploadsPerMonth: 5,
      maxVideoStorageMB: 150,
      posterFrames: 50,
      supportLevel: "email",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: false,
      unlimitedPosterLinks: false,
      unlimitedVideoUploads: false,
    },
    isActive: true,
  },
  // Pro (Monthly)
  {
    name: "Pro",
    price: 349,
    duration: "monthly",
    razorpayPlanId: "plan_SuHjD7tGoQASjL",
    features: {
      maxFromCompanies: 3,
      maxPostersPerMonth: 85,
      maxPosterLinks: 30,
      posterLinkExpiryDays: 90,
      maxVideoUploadsPerMonth: 20,
      maxVideoStorageMB: 250,
      posterFrames: 50,
      supportLevel: "priority",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: false,
      unlimitedPosterLinks: false,
      unlimitedVideoUploads: false,
    },
    isActive: true,
  },
  // Business (Monthly)
  {
    name: "Business",
    price: 499,
    duration: "monthly",
    razorpayPlanId: "plan_SuHjDm9iLYbZsc",
    features: {
      maxFromCompanies: 5,
      maxPostersPerMonth: -1, // Unlimited
      maxPosterLinks: -1, // Unlimited
      posterLinkExpiryDays: 365,
      maxVideoUploadsPerMonth: -1, // Unlimited
      maxVideoStorageMB: 500,
      posterFrames: 50,
      supportLevel: "dedicated",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: true,
      unlimitedPosterLinks: true,
      unlimitedVideoUploads: true,
    },
    isActive: true,
  },
  // Starter (Annually)
  {
    name: "Starter",
    price: 1999,
    duration: "annually",
    razorpayPlanId: "plan_SuHjCgioGjFP69",
    features: {
      maxFromCompanies: 2,
      maxPostersPerMonth: 25,
      maxPosterLinks: 10,
      posterLinkExpiryDays: 30,
      maxVideoUploadsPerMonth: 5,
      maxVideoStorageMB: 150,
      posterFrames: 50,
      supportLevel: "email",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: false,
      unlimitedPosterLinks: false,
      unlimitedVideoUploads: false,
    },
    isActive: true,
  },
  // Pro (Annually)
  {
    name: "Pro",
    price: 3499,
    duration: "annually",
    razorpayPlanId: "plan_SuHjDSVp28o9Bz",
    features: {
      maxFromCompanies: 3,
      maxPostersPerMonth: 75,
      maxPosterLinks: 30,
      posterLinkExpiryDays: 90,
      maxVideoUploadsPerMonth: 20,
      maxVideoStorageMB: 250,
      posterFrames: 50,
      supportLevel: "priority",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: false,
      unlimitedPosterLinks: false,
      unlimitedVideoUploads: false,
    },
    isActive: true,
  },
  // Business (Annually)
  {
    name: "Business",
    price: 4999,
    duration: "annually",
    razorpayPlanId: "plan_SuHjE4lxOJlKUL",
    features: {
      maxFromCompanies: 5,
      maxPostersPerMonth: -1, // Unlimited
      maxPosterLinks: -1, // Unlimited
      posterLinkExpiryDays: 365,
      maxVideoUploadsPerMonth: -1, // Unlimited
      maxVideoStorageMB: 500,
      posterFrames: 50,
      supportLevel: "dedicated",
      unlimitedInvoices: true,
      unlimitedEstimations: true,
      unlimitedProducts: true,
      unlimitedToCompanies: true,
      unlimitedPosters: true,
      unlimitedPosterLinks: true,
      unlimitedVideoUploads: true,
    },
    isActive: true,
  },
];

async function seedPlans() {
  await mongoose.connect("mongodb://localhost:27017/Renote_DB", { useNewUrlParser: true, useUnifiedTopology: true });
  await Plan.deleteMany({});
  await Plan.insertMany(plans);
  console.log("Plans seeded successfully!");
  await mongoose.disconnect();
}

seedPlans().catch((err) => {
  console.error("Error seeding plans:", err);
  process.exit(1);
});
