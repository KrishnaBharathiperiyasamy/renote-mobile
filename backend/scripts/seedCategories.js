import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/Category.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/Renote_DB";

export const INITIAL_CATEGORIES = [
  {
    name: "Bike & Cars",
    icon: "Car",
    subcategories: [
      "Bikes",
      "Car",
      "Motorcycles",
      "Scooters",
      "Spare Parts",
      "Bicycles"
    ],
    order: 1
  },
  {
    name: "Properties",
    icon: "Home",
    subcategories: [
      "For Sale: Houses & Apartments",
      "For Rent: Houses & Apartments",
      "Lands & Plots",
      "For Sale: New Projects & Properties",
      "For Rent: Shops & Offices",
      "For Sale: Shops & Offices",
      "PG & Guest Houses"
    ],
    order: 2
  },
  {
    name: "Electronics & Appliances",
    icon: "Tv",
    subcategories: [
      "TVs, Video - Audio",
      "Kitchen & Other Appliances",
      "Computers & Laptops",
      "Cameras & Lenses",
      "Games & Entertainment",
      "Fridges",
      "Computer Accessories",
      "Hard Disks, Printers & Monitors",
      "ACs",
      "Washing Machines"
    ],
    order: 3
  },
  {
    name: "Mobiles",
    icon: "Smartphone",
    subcategories: [
      "Mobile Phones",
      "Accessories",
      "Tablets"
    ],
    order: 4
  },
  {
    name: "Commercial Vehicles & Spares",
    icon: "Truck",
    subcategories: [
      "Commercial & Other Vehicles",
      "Spare Parts"
    ],
    order: 5
  },
  {
    name: "Jobs",
    icon: "Briefcase",
    subcategories: [
      "Data entry & Back office",
      "Sales & Marketing",
      "BPO & Telecaller",
      "Driver",
      "Office Assistant",
      "Delivery & Collection",
      "Teacher",
      "Cook",
      "Receptionist & Front office",
      "Operator & Technician",
      "IT Engineer & Developer",
      "Hotel & Travel Executive",
      "Accountant",
      "Warehouse Staff",
      "Designer",
      "Security Guards",
      "Other Jobs"
    ],
    order: 6
  },
  {
    name: "Furniture",
    icon: "Armchair",
    subcategories: [
      "Sofa & Dining",
      "Beds & Wardrobes",
      "Home Decor & Garden",
      "Kids Furniture",
      "Other Household Items"
    ],
    order: 7
  },
  {
    name: "Fashion",
    icon: "Shirt",
    subcategories: [
      "Men",
      "Women",
      "Kids"
    ],
    order: 8
  },
  {
    name: "Pets",
    icon: "Dog",
    subcategories: [
      "Fishes & Aquarium",
      "Pet Food & Accessories",
      "Dogs",
      "Other Pets"
    ],
    order: 9
  },
  {
    name: "Books, Sports & Hobbies",
    icon: "BookOpen",
    subcategories: [
      "Books",
      "Gym & Fitness",
      "Musical Instruments",
      "Sports Equipment",
      "Other Hobbies"
    ],
    order: 10
  },
  {
    name: "Services",
    icon: "Wrench",
    subcategories: [
      "Education & Classes",
      "Tours & Travel",
      "Electronics Repair & Services",
      "Health & Beauty",
      "Home Renovation & Repair",
      "Cleaning & Pest Control",
      "Legal & Documentation Services",
      "Packers & Movers",
      "Other Services"
    ],
    order: 11
  }
];

export async function seedCategoriesIfNeeded() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log("No categories found in DB. Seeding initial categories taxonomy...");
      await Category.insertMany(INITIAL_CATEGORIES);
      console.log("Initial categories seeded successfully!");
    }
  } catch (err) {
    console.error("Error seeding categories:", err);
  }
}

async function runStandaloneSeed() {
  try {
    console.log("Connecting to MongoDB for Category seeding...");
    await mongoose.connect(MONGO_URI);

    // Upsert each category
    for (const cat of INITIAL_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        { $set: cat },
        { upsert: true, new: true }
      );
    }
    console.log("Categories seeded/upserted into DB successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Standalone seed error:", err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("seedCategories.js")) {
  runStandaloneSeed();
}
