import { useState, useEffect } from "react";
import apiClient from "@utilis/apiClient";
import { API_ENDPOINTS } from "./api";
import {
  Car,
  Home,
  Tv,
  Smartphone,
  Truck,
  Briefcase,
  Armchair,
  Shirt,
  Dog,
  BookOpen,
  Wrench,
  Tag,
  Sparkles
} from "lucide-react";

export interface CategoryTaxonomy {
  [category: string]: string[];
}

export const MARKETPLACE_TAXONOMY: CategoryTaxonomy = {
  "Bike & Cars": [
    "Bikes",
    "Car",
    "Motorcycles",
    "Scooters",
    "Spare Parts",
    "Bicycles"
  ],
  "Properties": [
    "For Sale: Houses & Apartments",
    "For Rent: Houses & Apartments",
    "Lands & Plots",
    "For Sale: New Projects & Properties",
    "For Rent: Shops & Offices",
    "For Sale: Shops & Offices",
    "PG & Guest Houses"
  ],
  "Electronics & Appliances": [
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
  "Mobiles": [
    "Mobile Phones",
    "Accessories",
    "Tablets"
  ],
  "Commercial Vehicles & Spares": [
    "Commercial & Other Vehicles",
    "Spare Parts"
  ],
  "Jobs": [
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
  "Furniture": [
    "Sofa & Dining",
    "Beds & Wardrobes",
    "Home Decor & Garden",
    "Kids Furniture",
    "Other Household Items"
  ],
  "Fashion": [
    "Men",
    "Women",
    "Kids"
  ],
  "Pets": [
    "Fishes & Aquarium",
    "Pet Food & Accessories",
    "Dogs",
    "Other Pets"
  ],
  "Books, Sports & Hobbies": [
    "Books",
    "Gym & Fitness",
    "Musical Instruments",
    "Sports Equipment",
    "Other Hobbies"
  ],
  "Services": [
    "Education & Classes",
    "Tours & Travel",
    "Electronics Repair & Services",
    "Health & Beauty",
    "Home Renovation & Repair",
    "Cleaning & Pest Control",
    "Legal & Documentation Services",
    "Packers & Movers",
    "Other Services"
  ]
};

export const MAIN_CATEGORIES = Object.keys(MARKETPLACE_TAXONOMY);

export const DEFAULT_CATEGORY = "Electronics & Appliances";
export const DEFAULT_SUBCATEGORY = "Computers & Laptops";

export const CATEGORY_ICONS: Record<string, any> = {
  "Bike & Cars": Car,
  "Properties": Home,
  "Electronics & Appliances": Tv,
  "Mobiles": Smartphone,
  "Commercial Vehicles & Spares": Truck,
  "Jobs": Briefcase,
  "Furniture": Armchair,
  "Fashion": Shirt,
  "Pets": Dog,
  "Books, Sports & Hobbies": BookOpen,
  "Services": Wrench
};

export const CATEGORY_ITEMS = [
  { label: "All", icon: Tag },
  ...MAIN_CATEGORIES.map((cat) => ({
    label: cat,
    icon: CATEGORY_ICONS[cat] || Sparkles
  }))
];

export interface DBCategory {
  _id: string;
  name: string;
  icon: string;
  subcategories: string[];
  order: number;
  isActive: boolean;
}

export function useDBCategories() {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxonomy, setTaxonomy] = useState<CategoryTaxonomy>(MARKETPLACE_TAXONOMY);
  const [mainCategories, setMainCategories] = useState<string[]>(MAIN_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.CATEGORIES.GET_ALL);
        if (res.data?.success && Array.isArray(res.data.categories) && res.data.categories.length > 0) {
          const fetched: DBCategory[] = res.data.categories;
          setCategories(fetched);

          const newTaxonomy: CategoryTaxonomy = {};
          const newMain: string[] = [];

          fetched.forEach((cat) => {
            newTaxonomy[cat.name] = cat.subcategories || [];
            newMain.push(cat.name);
          });

          setTaxonomy(newTaxonomy);
          setMainCategories(newMain);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories from DB:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, taxonomy, mainCategories, loading };
}

