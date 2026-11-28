import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import csv from "csv-parser";
import fs from "fs";
import { ensureDir, resolveUploadPath } from "../utils/uploadPaths.js";

const router = express.Router();
const upload = multer({ dest: ensureDir(resolveUploadPath()) });
const UNIT_MAP = {
  KG: "KG",
  KILOGRAMS: "KG",
  BAG: "BAG",
  BKT: "BKT",
  BUCKET: "BKT",
  BND: "BND",
  BUNDLE: "BND",
  BOWL: "BOWL",
  BX: "BX",
  CRD: "CRD",
  CM: "CM",
  CS: "CS",
  CTN: "CTN",
  DZ: "DZ",
  EA: "EA",
  FT: "FT",
  GAL: "GAL",
  GROSS: "GROSS",
  IN: "IN",
  KIT: "KIT",
  LOT: "LOT",
  M: "M",
  MM: "MM",
  PC: "PC",
  PK: "PK",
  PK100: "PK100",
  PK50: "PK50",
  PR: "PR",
  RACK: "RACK",
  RL: "RL",
  SET: "SET",
  SET3: "SET3",
  SET4: "SET4",
  SET5: "SET5",
  SGL: "SGL",
  SHT: "SHT",
  SQFT: "SQFT",
  TUBE: "TUBE",
  YD: "YD",
};

// Helper to parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

router.post("/import-products", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File is required" });

  try {
    let rows = [];

    if (req.file.mimetype === "text/csv") {
      rows = await parseCSV(req.file.path);
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      req.file.mimetype === "application/vnd.ms-excel"
    ) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ message: "Only CSV or Excel files are allowed" });
    }

    // Map rows to products format
    const products = rows.map((r) => {
      const rawUnit = (r.unit || r.Unit || "").trim();
      const normalizedUnit = UNIT_MAP[rawUnit.toUpperCase()] || rawUnit; // <-- this line changed

      return {
        name: r.name || r.Name,
        quantity: Number(r.quantity || r.Quantity || 0),
        price: Number(r.price || r.Price || 0),
        unit: normalizedUnit, // use mapped OR user-typed value
      };
    });

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    // Return parsed data as JSON
    res.status(200).json({ message: "Products parsed successfully!", data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to parse file", error: err.message });
  }
});

export default router;
