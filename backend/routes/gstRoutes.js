import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

dotenv.config();
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Helper to extract city
function extractCity(addressObj) {
  if (!addressObj) return "Unknown";
  return addressObj.location || "Unknown";
}

// Helper to extract state
function extractState(addressObj) {
  if (!addressObj) return "Unknown";
  return addressObj.stateCode || "Unknown";
}

// ✅ Protected route
router.get("/:gstin", authMiddleware, async (req, res) => {
  const gstin = req.params.gstin;
  const userId = req.user?.id; // authMiddleware should attach decoded user

  const options = {
    method: "GET",
    url: `https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/${gstin}`,
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "gst-insights-api.p.rapidapi.com",
      "content-type": "application/json",
    },
  };

  try {
    const response = await axios.request(options);
    const dataArray = response.data.data;

    if (!dataArray || dataArray.length === 0) 
      return res.status(404).json({ error: "No GST details found." });
    
    const data = dataArray[0]; 
    const principalAddress = data.principalAddress?.address || {};
    const principalNature = data.principalAddress?.nature || "Not available";

    const companyDetails = {
      gstin: data.gstNumber || gstin,
      companyName: data.tradeName || "Not available",
      tradeName: data.tradeName || "Not available",
      zipCode: principalAddress.pincode || "Not available",
      address: [
        principalAddress.buildingNumber,
        principalAddress.buildingName,
        principalAddress.street,
        principalAddress.location,
        principalAddress.district,
        principalAddress.stateCode,
        principalAddress.floorNumber,
        principalAddress.locality,
        principalAddress.landmark,
      ]
        .filter(Boolean)
        .join(", ") || "Not available",
      city: extractCity(principalAddress),
      state: extractState(principalAddress),
      aboutCompany: principalNature, 
      fetchedBy: userId,
    };
    res.json(companyDetails);
  } catch (error) {
    console.error("GST API error:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    res.status(500).json({ error: "Failed to fetch GST details" });
  }
});

export default router;
