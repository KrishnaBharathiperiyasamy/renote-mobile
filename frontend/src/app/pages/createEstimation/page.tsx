"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Trash2,
    ArrowUp,
    ArrowDown,
    Plus,
    Download,
    Printer,
    ArrowLeft,
    Save,
    Copy,
    ChevronDown,
    Check,
    Eye,
    Search,
    Share2,
} from "lucide-react";
import { API_ENDPOINTS, DATA_API_BASE_URL } from "@constants/api";
import { getLogoUrl } from "@utilis/getLogoUrl";
import { UNIT_OPTIONS } from "@constants/unitOptions";
import { fetchGstOptions, GST_OPTIONS_DEFAULT } from "@constants/gstOptions";
import apiClient from "@utilis/apiClient";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import HsnModal from "@components/HsnModal";
import { useRouter, useSearchParams } from "next/navigation";
import AddCompanyModal from "@components/AddCompanyModal";
import Modal from "@components/Modal";
import QRCode from "qrcode";
import {
    formatEstimateID,
    numberToWords
} from "@utilis/formatInvoice";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./createEstimation.css";

const GST_STATE_CODES: Record<string, string> = {
    "01": "jammu and kashmir",
    "02": "himachal pradesh",
    "03": "punjab",
    "04": "chandigarh",
    "05": "uttarakhand",
    "06": "haryana",
    "07": "delhi",
    "08": "rajasthan",
    "09": "uttar pradesh",
    "10": "bihar",
    "11": "sikkim",
    "12": "arunachal pradesh",
    "13": "nagaland",
    "14": "manipur",
    "15": "mizoram",
    "16": "tripura",
    "17": "meghalaya",
    "18": "assam",
    "19": "west bengal",
    "20": "jharkhand",
    "21": "odisha",
    "22": "chhattisgarh",
    "23": "madhya pradesh",
    "24": "gujarat",
    "25": "daman and diu",
    "26": "dadra and nagar haveli",
    "27": "maharashtra",
    "29": "karnataka",
    "30": "goa",
    "31": "lakshadweep",
    "32": "kerala",
    "33": "tamil nadu",
    "34": "puducherry",
    "35": "andaman and nicobar islands",
    "36": "telangana",
    "37": "andhra pradesh",
    "38": "ladakh",
};

const getGstStateCode = (item?: { gstNo?: string; state?: string; address?: string; city?: string } | null): string => {
    if (!item) return "";
    const gstNo = (item.gstNo || "").trim();
    if (gstNo.length >= 2 && /^\d{2}/.test(gstNo)) {
        return gstNo.slice(0, 2);
    }
    const stateText = (item.state || "").trim().toLowerCase();
    if (stateText) {
        for (const [code, name] of Object.entries(GST_STATE_CODES)) {
            if (stateText.includes(name) || name.includes(stateText)) {
                return code;
            }
        }
        return stateText;
    }
    const combined = `${item.city || ""} ${item.address || ""}`.toLowerCase();
    for (const [code, name] of Object.entries(GST_STATE_CODES)) {
        if (combined.includes(name)) {
            return code;
        }
    }
    return "";
};

interface EstimateRow {
    product: string;
    price: string;
    qty: string;
    unit: string;
    unitFromSuggestion: boolean;
    gst: string;
    amount: number;
    hsn: string;
}

export default function CreateEstimation() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const [isGstEnabled, setIsGstEnabled] = useState(false);
    const [selectedCopyType, setSelectedCopyType] = useState<string>("ESTIMATE / QUOTATION");
    const [gstOptions, setGstOptions] = useState<number[]>(GST_OPTIONS_DEFAULT);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

    // Theme detection
    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) {
                setIsDarkMode(saved === "dark");
            } else {
                setIsDarkMode(document.documentElement.classList.contains("dark"));
            }
        };
        handleThemeSync();
        window.addEventListener("themechange", handleThemeSync);
        window.addEventListener("storage", handleThemeSync);
        return () => {
            window.removeEventListener("themechange", handleThemeSync);
            window.removeEventListener("storage", handleThemeSync);
        };
    }, []);

    // Company & Customer State
    const [companyDetails, setCompanyDetails] = useState({
        _id: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        gstNo: "",
        upiId: "",
        logo: "",
    });

    const [fromCompanies, setFromCompanies] = useState<any[]>([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [fromSearch, setFromSearch] = useState("");

    const [customerDetails, setCustomerDetails] = useState({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        gstNo: "",
    });

    const [companies, setCompanies] = useState<any[]>([]);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [toSearch, setToSearch] = useState("");

    const [estimateIdDisplay, setEstimateIdDisplay] = useState<string>("");
    const [estimations, setEstimations] = useState<any[]>([]);
    const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

    // Products from backend
    const [allAvailableProducts, setAllAvailableProducts] = useState<any[]>([]);
    const [activeProductDropdown, setActiveProductDropdown] = useState<number | null>(null);
    const [productSearch, setProductSearch] = useState<string>("");

    // Rows
    const [rows, setRows] = useState<EstimateRow[]>([
        {
            product: "",
            price: "",
            qty: "1",
            unit: "Pcs",
            unitFromSuggestion: false,
            gst: "0",
            amount: 0,
            hsn: "",
        },
    ]);

    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<any>(null);
    const [modalFlag, setModalFlag] = useState<"vendor" | "customer">("customer");

    const [hsnModal, setHsnModal] = useState<{ open: boolean; rowIndex: number | null }>({
        open: false,
        rowIndex: null,
    });

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Dates
    const [estimateDate, setEstimateDate] = useState<string>("");
    const [validTillDate, setValidTillDate] = useState<string>("");
    const [termsText, setTermsText] = useState<string>(
        "This estimate is valid for 10 days from the date of issue. Prices are subject to change after the validity period."
    );

    // Refs for outside clicks
    const fromDropdownRef = useRef<HTMLDivElement>(null);
    const toDropdownRef = useRef<HTMLDivElement>(null);
    const productDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) {
                setShowFromDropdown(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) {
                setShowToDropdown(false);
            }
            if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
                setActiveProductDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchGstOptions().then(setGstOptions);
    }, []);

    // Generate UPI QR Code whenever UPI ID changes
    useEffect(() => {
        const upiId = companyDetails.upiId.trim();
        if (!upiId) {
            setQrDataUrl(null);
            return;
        }
        const companyName = companyDetails.name || "Company";
        const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(companyName)}&cu=INR`;
        QRCode.toDataURL(upiString, { width: 140, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => setQrDataUrl(null));
    }, [companyDetails.upiId, companyDetails.name]);

    const fetchFromCompanies = async () => {
        try {
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await apiClient.get(
                API_ENDPOINTS.COMPANIES.GET_COMPANY_BY_USER_ID(userId),
                {
                    params: { flag: "vendor" },
                    headers,
                }
            );
            const list = res.data?.company || [];
            setFromCompanies(list);
        } catch (err) {
            const localData = localStorage.getItem("vendor_companies");
            if (localData) {
                setFromCompanies(JSON.parse(localData));
            }
        }
    };

    const fetchCustomerCompanies = async () => {
        try {
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await apiClient.get(
                API_ENDPOINTS.COMPANIES.GET_CUSTOMER_COMPANY_BY_USER_ID(userId),
                {
                    params: { flag: "customer" },
                    headers,
                }
            );
            const list = res.data?.company || [];
            setCompanies(list);
        } catch (err) {
            const localData = localStorage.getItem("customer_companies");
            if (localData) {
                setCompanies(JSON.parse(localData));
            }
        }
    };

    const fetchAllProducts = async () => {
        try {
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await apiClient.get(
                `${DATA_API_BASE_URL}/api/products/get/${userId}?limit=300`,
                { headers }
            );
            if (res.data?.products && Array.isArray(res.data.products)) {
                setAllAvailableProducts(res.data.products);
            }
        } catch (e) {
            console.error("Failed to fetch products:", e);
        }
    };

    const fetchNextEstimateId = async (): Promise<string | null> => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const { data } = await apiClient.get(
                `${DATA_API_BASE_URL}/api/quotations/next-id/${userId}`,
                { headers }
            );

            return data.estimateID || "E2610001";
        } catch (error: any) {
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const prefix = `E${year}${month}`;
            const guestEstimates = JSON.parse(localStorage.getItem("guestEstimations") || "[]");
            let maxNum = 0;
            for (const est of guestEstimates) {
                const idStr = String(est.estimateID || est._id || "");
                if (idStr.startsWith(prefix)) {
                    const num = parseInt(idStr.slice(prefix.length), 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            }
            return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
        }
    };

    const fetchEstimateById = async (estId: string) => {
        try {
            const token = localStorage.getItem("token");
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            let estimate: any = null;
            if (token) {
                const res = await apiClient.get(API_ENDPOINTS.QUOTATIONS.GET_BY_ID(estId), { headers });
                estimate = res.data?.quotation || res.data;
            } else {
                const guestEstimates = JSON.parse(localStorage.getItem("guestEstimations") || "[]");
                estimate = guestEstimates.find((e: any) => e._id === estId || e.estimateID === estId);
            }

            if (!estimate) return;
            setSelectedEstimate(estimate);

            const company = estimate.company || (estimate.company_id && estimate.company_id[0]);
            if (company) {
                setCompanyDetails({
                    _id: company._id || "",
                    name: company.name || "",
                    address: company.address || "",
                    phone: company.phone || "",
                    email: company.email || "",
                    gstNo: company.gstNo || "",
                    upiId: company.upiId || "",
                    logo: company.logo || "",
                });
            }

            const customer = estimate.customers?.[0];
            if (customer) {
                setCustomerDetails({
                    name: customer.name || "",
                    address: customer.address || "",
                    city: customer.city || "",
                    phone: customer.phoneNumber || customer.phone || "",
                    email: customer.email || "",
                    gstNo: (customer as any).gstNo || "",
                });
            }

            if (estimate.products && estimate.products.length > 0) {
                const productRows = estimate.products.map((p: any) => {
                    const qty = Number(p.quantity || p.qty) || 1;
                    const price = Number(p.price) || 0;
                    return {
                        product: p.name || "",
                        price: p.price?.toString() || "",
                        qty: (p.quantity || p.qty || 1).toString(),
                        gst: p.gst?.toString() || "18",
                        unit: p.unit?.toString() || "Pcs",
                        unitFromSuggestion: !!p.unit,
                        hsn: p.hsn || "",
                        amount: qty * price,
                    };
                });
                setRows(productRows);
            }

            setIsGstEnabled(estimate.products?.some((p: any) => (p.gst || 0) > 0) ?? false);
            setEstimateIdDisplay(formatEstimateID(estimate.estimateID) || "E/26-27/0001");
            if (mode === "preview") {
                setIsPreviewMode(true);
            }
        } catch (err: any) {
            handleAuthErrorAndToast(err, "Failed to load estimate");
        }
    };

    useEffect(() => {
        const init = async () => {
            const today = new Date();
            setEstimateDate(today.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));
            const valid = new Date(today);
            valid.setDate(valid.getDate() + 10);
            setValidTillDate(valid.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));

            if (id) {
                await fetchEstimateById(id);
            } else {
                const nextId = await fetchNextEstimateId();
                if (nextId) setEstimateIdDisplay(nextId);
            }
        };

        init();
        fetchCustomerCompanies();
        fetchFromCompanies();
        fetchAllProducts();
    }, [id]);

    const getQtyError = (qty: string | number) => {
        const str = String(qty ?? "").trim();
        if (!str) return "1–99 required";
        const n = Number(str);
        if (!/^\d+$/.test(str) || isNaN(n)) return "1–99 only";
        if (n < 1 || n > 99) return "Must be 1–99";
        return null;
    };

    const getPriceError = (price: string | number) => {
        const str = String(price ?? "").trim();
        if (str === ".") return "Invalid price";
        if (str !== "") {
            const n = Number(str);
            if (isNaN(n) || n < 0) return "Invalid price";
        }
        return null;
    };

    const isValidQty = (qty: string | number) => {
        return getQtyError(qty) === null;
    };

    const isValidPrice = (price: string | number) => {
        const str = String(price ?? "").trim();
        if (!str || str === ".") return false;
        const n = Number(str);
        return !isNaN(n) && n >= 0;
    };

    const calculateAmount = (price: string | number, qty: string | number) => {
        if (!isValidQty(qty) || !isValidPrice(price)) return 0;
        const p = parseFloat(price as any) || 0;
        const q = parseFloat(qty as any) || 0;
        return p * q;
    };

    const handleSelectProduct = (index: number, product: any) => {
        const currentQty = rows[index]?.qty || "1";
        const priceStr = product.price != null ? String(product.price) : "0";
        const pNum = parseFloat(priceStr) || 0;
        const qNum = parseFloat(currentQty) || 1;

        setRows((prev) =>
            prev.map((r, i) =>
                i === index
                    ? {
                          ...r,
                          product: product.name,
                          price: priceStr,
                          qty: currentQty,
                          unit: product.unit || r.unit || "Pcs",
                          unitFromSuggestion: true,
                          gst: product.gst != null ? String(product.gst) : "18",
                          hsn: product.hsn || r.hsn || "",
                          amount: pNum * qNum,
                      }
                    : r
            )
        );
        setActiveProductDropdown(null);
    };

    const handleAddRow = () => {
        setRows((prev) => [
            ...prev,
            {
                product: "",
                price: "",
                qty: "1",
                unit: "Pcs",
                unitFromSuggestion: false,
                gst: "18",
                amount: 0,
                hsn: "",
            },
        ]);
    };

    const handleDeleteRow = (index: number) => {
        if (rows.length === 1) {
            safeToastError("Estimate must have at least one row");
            return;
        }
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        setRows((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index - 1];
            next[index - 1] = temp;
            return next;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index === rows.length - 1) return;
        setRows((prev) => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index + 1];
            next[index + 1] = temp;
            return next;
        });
    };

    const validateRows = (currentRows: any[]) => {
        if (!currentRows || currentRows.length === 0) {
            safeToastError("Please add at least one item");
            return false;
        }
        for (const [index, row] of currentRows.entries()) {
            const productName = row.product?.trim();
            if (!productName) {
                safeToastError(`Row ${index + 1}: Description is required`);
                return false;
            }
            const qtyErr = getQtyError(row.qty);
            if (qtyErr) {
                safeToastError(`Row ${index + 1}: Quantity must be a positive whole number between 1 and 99`);
                return false;
            }
            const priceStr = String(row.price ?? "").trim();
            const priceNum = Number(priceStr);
            if (priceStr === "" || isNaN(priceNum) || priceNum < 0 || priceStr === ".") {
                safeToastError(`Row ${index + 1}: Price must be a valid non-negative number`);
                return false;
            }
        }
        return true;
    };

    const handleSave = async (overrideNewId?: boolean) => {
        setIsSaving(true);

        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const userId = typeof window !== "undefined"
                ? (localStorage.getItem("user_id") || localStorage.getItem("authId") || "")
                : "";

            // Validate company
            const activeCompanyId = companyDetails._id || (fromCompanies.length > 0 ? fromCompanies[0]._id : null);
            if (!activeCompanyId) {
                safeToastError("Please select or add your Company (FROM) before saving.");
                setIsSaving(false);
                return;
            }

            // Validate customer
            if (!customerDetails.name?.trim()) {
                safeToastError("Please select or enter a Customer Name (TO) before saving.");
                setIsSaving(false);
                return;
            }

            if (!validateRows(rows)) {
                setIsSaving(false);
                return;
            }

            // Validate products - only take rows with a valid product name and price
            const validRows = rows
                .filter((r) => r.product && r.product.trim())
                .map((r) => {
                    const quantity = parseFloat(r.qty) || 1;
                    const price = parseFloat(r.price) || 0;
                    return {
                        name: r.product.trim(),
                        quantity,
                        price,
                        unit: r.unit?.trim() || "Pcs",
                        amount: quantity * price,
                        gst: isGstEnabled ? Number(r.gst || 0) : 0,
                        hsn: r.hsn?.trim() || "",
                    };
                });

            if (validRows.length === 0) {
                safeToastError("Please enter at least one item with a valid Description and Price.");
                setIsSaving(false);
                return;
            }

            const activeEstimateId = (estimateIdDisplay && estimateIdDisplay.trim()) || (await fetchNextEstimateId()) || "E2610001";

            const customerPayload = {
                name: customerDetails.name.trim(),
                address: customerDetails.address?.trim() || "",
                city: customerDetails.city?.trim() || "",
                phoneNumber: customerDetails.phone?.trim() || "",
                email: customerDetails.email?.trim() || "",
                gstNo: customerDetails.gstNo?.trim() || "",
            };

            const payload: any = {
                estimateID: activeEstimateId,
                company_id: [activeCompanyId],
                customers: [customerPayload],
                products: validRows,
            };

            let savedQuotation: any = null;

            if (token) {
                if (mode === "edit" && id && !overrideNewId) {
                    const res = await apiClient.put(API_ENDPOINTS.QUOTATIONS.UPDATE(id), payload, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    savedQuotation = res.data?.quotation || { ...payload, _id: id };
                    setSelectedEstimate(savedQuotation);
                    safeToastSuccess(`Estimate #${savedQuotation.estimateID || activeEstimateId} updated successfully! 🎉`);
                } else {
                    const res = await apiClient.post(
                        API_ENDPOINTS.QUOTATIONS.CREATE_QUOTATION(userId),
                        payload,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    savedQuotation = res.data?.quotation || { ...payload, _id: res.data?.id };
                    setSelectedEstimate(savedQuotation);
                    safeToastSuccess(`Estimate #${savedQuotation.estimateID || activeEstimateId} saved successfully! 🎉`);
                    if (savedQuotation?._id) {
                        router.replace(`/pages/createEstimation?mode=preview&id=${savedQuotation._id}`);
                    }
                }
            } else {
                // Offline fallback only if completely logged out
                const guestEstimates = JSON.parse(localStorage.getItem("guestEstimations") || "[]");
                const localId = mode === "edit" && id ? id : `local_est_${Date.now()}`;
                savedQuotation = {
                    ...payload,
                    _id: localId,
                    createdAt: new Date().toISOString(),
                    total: grandTotal,
                };
                if (mode === "edit" && id) {
                    const idx = guestEstimates.findIndex((e: any) => e._id === id || e.estimateID === id);
                    if (idx !== -1) guestEstimates[idx] = savedQuotation;
                    else guestEstimates.unshift(savedQuotation);
                } else {
                    guestEstimates.unshift(savedQuotation);
                }
                localStorage.setItem("guestEstimations", JSON.stringify(guestEstimates));
                setSelectedEstimate(savedQuotation);
                safeToastSuccess(`Estimate #${activeEstimateId} saved locally! 🎉`);
            }

            setIsSaved(true);
            setIsPreviewMode(true);
        } catch (err: any) {
            console.error("Error saving estimate:", err);
            const msg = err?.response?.data?.message || err?.message || "Failed to save estimate to server";
            safeToastError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAs = async () => {
        const nextId = await fetchNextEstimateId();
        if (nextId) setEstimateIdDisplay(nextId);
        await handleSave(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        const estId = selectedEstimate?._id || id;
        const shareUrl = estId
            ? `${window.location.origin}/pages/createEstimation?mode=preview&id=${estId}`
            : typeof window !== "undefined" ? window.location.href : "";

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Estimate ${estimateIdDisplay}`,
                    text: `Estimate from ${companyDetails.name || "Company"}`,
                    url: shareUrl,
                });
                return;
            } catch (e) {
                // fallback to clipboard
            }
        }

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
            safeToastSuccess("Estimate link copied to clipboard! 🔗");
        }
    };

    const handleDownloadPdf = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const billElement = document.getElementById("estimate-bill-printable") || (document.querySelector(".bg-white.text-\\[\\#111827\\].rounded-2xl") as HTMLElement);
            if (!billElement) {
                safeToastError("Failed to download estimate PDF. Please try again.");
                return;
            }

            const canvas = await html2canvas(billElement, {
                scale: 2.5,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1024,
                onclone: (clonedDoc) => {
                    const clonedBill = clonedDoc.getElementById("estimate-bill-printable");
                    if (clonedBill) {
                        clonedBill.style.boxShadow = "none";
                        clonedBill.style.border = "none";
                        clonedBill.style.borderRadius = "0";
                        clonedBill.style.maxWidth = "800px";
                        clonedBill.style.width = "100%";
                        clonedBill.style.margin = "0 auto";
                        clonedBill.style.padding = "24px";
                        clonedBill.style.backgroundColor = "#ffffff";
                    }
                },
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const margin = 10;
            const printableWidth = pageWidth - margin * 2; // 190mm
            const printableHeight = pageHeight - margin * 2; // 277mm

            const ratio = canvas.width / canvas.height;
            let renderWidth = printableWidth;
            let renderHeight = renderWidth / ratio;

            if (renderHeight <= printableHeight) {
                pdf.addImage(imgData, "PNG", margin, margin, renderWidth, renderHeight, undefined, "FAST");
            } else {
                let heightLeft = renderHeight;
                let position = margin;

                pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight, undefined, "FAST");
                heightLeft -= printableHeight;

                while (heightLeft > 0) {
                    position = position - printableHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight, undefined, "FAST");
                    heightLeft -= printableHeight;
                }
            }

            const rawId = (estimateIdDisplay || "E2601001").trim();
            const cleanId = rawId
                .replace(/^#/, "")
                .replace(/^E\/?/i, "E")
                .replace(/[-\/\\]/g, "");
            const fileName = `Estimate_${cleanId}.pdf`;

            pdf.save(fileName);
        } catch (error: any) {
            console.error("Download error:", error);
            safeToastError("Failed to download estimate PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleBack = () => {
        if (isPreviewMode && !isSaved && mode !== "preview") {
            setIsPreviewMode(false);
        } else {
            router.push("/pages/estimation");
        }
    };

    // Subtotal and Tax Calculations
    const subtotal = rows.reduce(
        (acc, r) =>
            acc +
            (isValidQty(r.qty) && isValidPrice(r.price)
                ? parseFloat(r.price || "0") * parseFloat(r.qty || "0")
                : 0),
        0
    );

    const fromState = getGstStateCode(companyDetails);
    const toState = getGstStateCode(customerDetails);
    const isInterState = Boolean(fromState && toState && fromState !== toState);

    const rawGstTotal = isGstEnabled
        ? rows.reduce(
              (acc, r) =>
                  acc +
                  (isValidQty(r.qty) && isValidPrice(r.price)
                      ? (parseFloat(r.price || "0") *
                            parseFloat(r.qty || "0") *
                            parseFloat(r.gst || "0")) /
                        100
                      : 0),
              0
          )
        : 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isGstEnabled) {
        if (isInterState) {
            igstAmount = Math.round(rawGstTotal * 100) / 100;
        } else {
            const halfGst = rawGstTotal / 2;
            cgstAmount = Math.round(halfGst * 100) / 100;
            sgstAmount = cgstAmount;
        }
    }

    const unroundedTotal = subtotal + (isGstEnabled ? rawGstTotal : 0);
    const grandTotal = Math.round(unroundedTotal);
    const roundOff = Math.round((grandTotal - unroundedTotal) * 100) / 100;

    // Filtered lists
    const filteredFromCompanies = fromCompanies.filter((c) =>
        (c.name || "").toLowerCase().includes(fromSearch.toLowerCase())
    );

    const filteredCustomerCompanies = companies.filter((c) =>
        (c.name || "").toLowerCase().includes(toSearch.toLowerCase())
    );

    const filteredProducts = allAvailableProducts.filter((p) =>
        (p.name || "").toLowerCase().includes(productSearch.toLowerCase())
    );

    // Dynamic theme classes
    const cardBg = isDarkMode ? "bg-[#16181E] text-[#E0E2EC] border-white/10" : "bg-white text-gray-900 border-gray-200";
    const inputBg = isDarkMode
        ? "bg-[#1E2028] text-white border-white/15 placeholder-gray-500 focus:border-orange-500"
        : "bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-orange-500";
    const dropdownBg = isDarkMode ? "bg-[#1A1C24] text-white border-white/15 shadow-2xl" : "bg-white text-gray-800 border-gray-200 shadow-xl";
    const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-orange-50/60";

    return (
        <div
            className={`min-h-screen flex flex-col justify-between ${
                isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]"
            } print:bg-white print:p-0 print:m-0 print:min-h-0 transition-colors`}
        >
            <div className="flex-1 w-full max-w-[1240px] mx-auto p-3 sm:p-5 md:p-6 space-y-4">
                {/* 1. Preview Mode: Estimated Bill matching user image */}
                {isPreviewMode ? (
                    <div className="pb-28">
                        {/* Printable Estimate Card matching user image */}
                        <div
                            id="estimate-bill-printable"
                            className="bg-white text-[#111827] rounded-2xl shadow-xl max-w-4xl mx-auto p-4 sm:px-7 sm:pt-4 sm:pb-6 border border-gray-100 print:shadow-none print:border-none print:rounded-none print:p-0 print:max-w-none"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-gray-200 overflow-hidden shrink-0 shadow-xs">
                                        <img
                                            src={companyDetails.logo ? getLogoUrl(companyDetails.logo) : "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
                                            alt={companyDetails.name || "KrishTech Computers"}
                                            className="w-full h-full object-contain p-0.5"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                if (!target.src.includes("logo-1779622107439-878996187.webp")) {
                                                    target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-sm sm:text-[15px] font-bold text-[#111827] tracking-tight leading-snug">
                                            {companyDetails.name || "Company"}
                                        </h1>
                                        {companyDetails.address && (
                                            <p className="text-[10px] sm:text-[10.5px] text-[#6B7280] mt-0.5 font-normal leading-tight">
                                                {companyDetails.address}
                                            </p>
                                        )}
                                        {companyDetails.phone && (
                                            <p className="text-[10px] sm:text-[10.5px] text-[#6B7280] font-normal leading-tight">
                                                {companyDetails.phone}
                                            </p>
                                        )}
                                        {companyDetails.email && (
                                            <p className="text-[10px] sm:text-[10.5px] text-[#6B7280] font-normal leading-tight">{companyDetails.email}</p>
                                        )}
                                        {companyDetails.gstNo && (
                                            <p className="text-[10px] sm:text-[10.5px] text-[#374151] font-medium leading-tight">GSTIN: {companyDetails.gstNo}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <h2 className="text-lg sm:text-xl font-black text-[#FF5722] tracking-tight uppercase leading-none">
                                        ESTIMATE
                                    </h2>
                                    <p className="text-[10.5px] font-bold text-[#111827] mt-0.5 font-mono">
                                        #{estimateIdDisplay || "E2610001"}
                                    </p>
                                    <p className="text-[9.5px] sm:text-[10px] text-[#6B7280] mt-0.5 font-normal leading-tight">
                                        <span className="font-bold text-[#374151]">Date :</span> {estimateDate || new Date().toLocaleDateString("en-GB")}
                                    </p>
                                    <p className="text-[9.5px] sm:text-[10px] text-[#6B7280] font-normal leading-tight">
                                        <span className="font-bold text-[#374151]">Valid Till :</span> {validTillDate || ""}
                                    </p>
                                </div>
                            </div>

                            {/* Solid Orange Divider Line */}
                            <div className="h-[2px] bg-[#FF5722] w-full my-2 rounded-full" />

                            {/* ESTIMATE TO Box */}
                            <div className="rounded-lg border border-[#FED7AA] bg-[#FFFBF8] p-4 mb-5">
                                <span className="text-[10px] font-extrabold text-[#FF5722] tracking-wider uppercase block">
                                    ESTIMATE TO
                                </span>
                                <p className="text-sm font-bold text-[#111827] mt-1">
                                    {customerDetails.name || "Customer"}
                                </p>
                                {customerDetails.address && (
                                    <p className="text-xs text-[#6B7280] mt-0.5 font-normal">{customerDetails.address}</p>
                                )}
                                {customerDetails.phone && (
                                    <p className="text-xs text-[#6B7280] mt-0.5 font-normal">
                                        {customerDetails.phone}
                                    </p>
                                )}
                                {customerDetails.city && (
                                    <p className="text-xs text-[#6B7280] font-normal">{customerDetails.city}</p>
                                )}
                                {customerDetails.gstNo && (
                                    <p className="text-xs font-bold text-[#FF5722] mt-0.5">GSTIN: {customerDetails.gstNo}</p>
                                )}
                            </div>

                            {/* Items Table */}
                            <div className="overflow-hidden mb-5">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#FF5722] text-white font-bold text-[11px] uppercase tracking-wider">
                                            <th className="py-2.5 px-3 text-center w-14">SL.</th>
                                            <th className="py-2.5 px-3">DESCRIPTION</th>
                                            <th className="py-2.5 px-3 text-right w-28">PRICE</th>
                                            <th className="py-2.5 px-3 text-center w-16">QTY</th>
                                            <th className="py-2.5 px-3 text-center w-20">UNIT</th>
                                            <th className="py-2.5 px-3 text-right w-32">AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rows.map((row, idx) => (
                                            <tr key={idx} className="font-normal text-[#374151]">
                                                <td className="py-3.5 px-3 text-center font-medium text-[#374151]">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </td>
                                                <td className="py-3.5 px-3 font-normal text-[#111827]">
                                                    {row.product || "—"}
                                                </td>
                                                <td className="py-3.5 px-3 text-right font-medium text-[#374151]">
                                                    ₹{parseFloat(row.price || "0").toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-3 text-center text-[#374151]">
                                                    {row.qty || "1"}
                                                </td>
                                                <td className="py-3.5 px-3 text-center text-[#374151] uppercase font-medium">
                                                    {row.unit || "Pcs"}
                                                </td>
                                                <td className="py-3.5 px-3 text-right font-bold text-[#111827]">
                                                    ₹{(parseFloat(row.price || "0") * parseFloat(row.qty || "0")).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Solid orange line under table */}
                                <div className="h-[2.5px] bg-[#FF5722] w-full" />
                            </div>

                            {/* Amount in Words and Financial Totals */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6 pt-2">
                                {/* Left: Amount in Words */}
                                <div className="space-y-1.5 flex-1 max-w-sm">
                                    <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider block">
                                        AMOUNT IN WORDS:
                                    </span>
                                    <div className="px-4 py-2.5 rounded-lg border border-[#FED7AA] bg-[#FFFBF8] inline-block shadow-sm">
                                        <span className="text-xs font-bold text-[#111827]">
                                            {numberToWords(grandTotal)}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Financial Totals */}
                                <div className="w-full sm:w-64 space-y-1 text-xs text-[#4B5563] font-medium">
                                    <div className="flex justify-between py-0.5">
                                        <span className="font-medium text-[#4B5563]">Taxable Value</span>
                                        <span className="font-bold text-[#111827]">
                                            ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-0.5">
                                        <span className="font-medium text-[#4B5563]">Round Off</span>
                                        <span className="font-bold text-[#111827]">
                                            ₹ {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                                        </span>
                                    </div>
                                    {isGstEnabled && (
                                        <div className="flex justify-between py-0.5">
                                            <span className="font-medium text-[#4B5563]">GST Total</span>
                                            <span className="font-bold text-[#FF5722]">
                                                ₹ {rawGstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="h-[1.5px] bg-[#FF5722] w-full my-1.5" />
                                    <div className="flex justify-between py-1 text-base text-[#111827]">
                                        <span className="font-bold">Total</span>
                                        <span className="font-extrabold">
                                            ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Conditions and Signature */}
                            <div className="border-t border-[#E5E7EB] pt-4 flex flex-col sm:flex-row justify-between items-end gap-6 mb-4">
                                <div className="space-y-1 max-w-md">
                                    <h4 className="text-xs font-bold text-[#374151]">Terms &amp; Conditions</h4>
                                    <p className="text-[10.5px] text-[#6B7280] leading-relaxed font-normal">
                                        {termsText}
                                    </p>
                                </div>

                                <div className="text-center sm:text-right w-full sm:w-auto">
                                    <div className="border-t border-[#9CA3AF] w-44 ml-auto pt-1 text-center">
                                        <span className="text-[10px] text-[#6B7280] font-normal block">
                                            Authorised Signature
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Solid Orange Banner */}
                            <div className="bg-[#FF5722] text-white text-center py-2.5 rounded-md text-xs sm:text-sm font-bold tracking-wide">
                                Thank you for your interest
                            </div>
                        </div>

                        {/* Floating Action Buttons Centered at Bottom matching user image */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 dark:bg-[#1A1C24]/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 print:hidden">
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isDownloading}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                            >
                                <Download className="w-[18px] h-[18px] stroke-[2]" />
                                <span>{isDownloading ? "Downloading..." : "Download"}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                            >
                                <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                                <span>Share</span>
                            </button>

                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                            >
                                <Printer className="w-[18px] h-[18px] stroke-[2]" />
                                <span>Print</span>
                            </button>

                            <button
                                onClick={handleBack}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                    isDarkMode
                                        ? "bg-[#1E2028] border-white/15 text-gray-200 hover:bg-white/10"
                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm"
                                }`}
                            >
                                <ArrowLeft className="w-[18px] h-[18px] stroke-[2]" />
                                <span>Back</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 2. Interactive Estimate Creator Form matching Image 2 */
                    <div className="space-y-4">
                        {/* Top Bar: GST toggle (left) | Estimate Sequence ID (center) | Dates (right) */}
                        <div className={`p-4 rounded-xl border ${cardBg} shadow-sm`}>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                {/* Left: GST switch */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsGstEnabled(!isGstEnabled)}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            isGstEnabled ? "bg-[#FF5722]" : isDarkMode ? "bg-gray-700" : "bg-gray-300"
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                isGstEnabled ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                    <span className="text-sm font-bold tracking-wide">GST</span>
                                </div>

                                {/* Center: Estimate Sequence ID */}
                                <div className="text-center">
                                    <input
                                        type="text"
                                        value={estimateIdDisplay}
                                        onChange={(e) => setEstimateIdDisplay(e.target.value)}
                                        className={`text-center font-black text-lg sm:text-xl tracking-wide bg-transparent border-0 border-b border-dashed ${
                                            isDarkMode ? "border-gray-600 text-white focus:border-[#FF5722]" : "border-gray-300 text-gray-900 focus:border-[#FF5722]"
                                        } focus:ring-0 px-2 py-0.5`}
                                    />
                                </div>

                                {/* Right: Dates */}
                                <div className="text-right text-xs space-y-0.5">
                                    <div className="font-bold">{estimateDate || "22/10/2026"}</div>
                                    <div className="text-gray-500 font-medium">Valid Till: {validTillDate || "01/11/2026"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Two Columns: FROM & TO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* FROM : Card */}
                            <div className={`p-4 rounded-xl border ${cardBg} relative`}>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                                    FROM :
                                </label>
                                <div className="relative" ref={fromDropdownRef}>
                                    <div
                                        onClick={() => setShowFromDropdown((prev) => !prev)}
                                        className={`w-full p-2.5 rounded-lg border text-sm font-medium flex items-center justify-between cursor-pointer transition ${inputBg}`}
                                    >
                                        <span className={companyDetails.name ? "font-semibold" : "text-gray-400"}>
                                            {companyDetails.name || "Select a company"}
                                        </span>
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>

                                    {/* Dropdown list */}
                                    {showFromDropdown && (
                                        <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border ${dropdownBg} z-40 max-h-72 overflow-y-auto`}>
                                            {fromCompanies.length > 5 && (
                                                <div className="p-2 border-b border-inherit">
                                                    <input
                                                        type="text"
                                                        value={fromSearch}
                                                        onChange={(e) => setFromSearch(e.target.value)}
                                                        placeholder="Search company..."
                                                        className={`w-full text-xs p-1.5 rounded border ${inputBg}`}
                                                    />
                                                </div>
                                            )}

                                            <div className="py-1">
                                                {filteredFromCompanies.map((c) => (
                                                    <div
                                                        key={c._id}
                                                        onClick={() => {
                                                            setCompanyDetails({
                                                                _id: c._id || "",
                                                                name: c.name || "",
                                                                address: c.address || "",
                                                                phone: c.phone || "",
                                                                email: c.email || "",
                                                                gstNo: c.gstNo || "",
                                                                upiId: c.upiId || "",
                                                                logo: c.logo || "",
                                                            });
                                                            setShowFromDropdown(false);
                                                        }}
                                                        className={`px-3 py-2 text-sm font-medium cursor-pointer transition ${hoverBg} flex items-center justify-between ${
                                                            companyDetails._id === c._id ? "text-[#FF5722] font-bold" : ""
                                                        }`}
                                                    >
                                                        <span>{c.name}</span>
                                                        {companyDetails._id === c._id && <Check size={14} className="text-[#FF5722]" />}
                                                    </div>
                                                ))}

                                                {filteredFromCompanies.length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-gray-500">No companies found</div>
                                                )}

                                                {/* + Add New Company */}
                                                <div
                                                    onClick={() => {
                                                        setModalFlag("vendor");
                                                        setCompanyToEdit(null);
                                                        setShowAddCompanyModal(true);
                                                        setShowFromDropdown(false);
                                                    }}
                                                    className="px-3 py-2.5 text-sm font-bold text-[#FF5722] hover:bg-orange-500/10 cursor-pointer border-t border-inherit flex items-center gap-1.5"
                                                >
                                                    <Plus size={15} />
                                                    <span>Add New Company</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Active Company Details summary */}
                                {companyDetails.name && (
                                    <div className="mt-2.5 pt-2 border-t border-inherit text-xs space-y-0.5 text-gray-500">
                                        {companyDetails.address && <p>{companyDetails.address}</p>}
                                        <div className="flex items-center gap-2">
                                            {companyDetails.phone && <span>Ph: {companyDetails.phone}</span>}
                                            {companyDetails.email && <span>&middot; {companyDetails.email}</span>}
                                        </div>
                                        {companyDetails.gstNo && <p className="font-semibold text-[#FF5722]">GSTIN: {companyDetails.gstNo}</p>}
                                    </div>
                                )}
                            </div>

                            {/* TO : Card */}
                            <div className={`p-4 rounded-xl border ${cardBg} relative`}>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                                    TO :
                                </label>
                                <div className="relative" ref={toDropdownRef}>
                                    <div
                                        onClick={() => setShowToDropdown((prev) => !prev)}
                                        className={`w-full p-2.5 rounded-lg border text-sm font-medium flex items-center justify-between cursor-pointer transition ${inputBg}`}
                                    >
                                        <span className={customerDetails.name ? "font-semibold" : "text-gray-400"}>
                                            {customerDetails.name || "Select a customer"}
                                        </span>
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>

                                    {/* Dropdown list */}
                                    {showToDropdown && (
                                        <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border ${dropdownBg} z-40 max-h-72 overflow-y-auto`}>
                                            <div className="p-2 border-b border-inherit">
                                                <input
                                                    type="text"
                                                    value={toSearch}
                                                    onChange={(e) => setToSearch(e.target.value)}
                                                    placeholder="Search customer..."
                                                    className={`w-full text-xs p-1.5 rounded border ${inputBg}`}
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="py-1">
                                                {filteredCustomerCompanies.map((c) => (
                                                    <div
                                                        key={c._id}
                                                        onClick={() => {
                                                            setCustomerDetails({
                                                                name: c.name || "",
                                                                address: c.address || "",
                                                                city: c.city || "",
                                                                phone: c.phone || "",
                                                                email: c.email || "",
                                                                gstNo: c.gstNo || "",
                                                            });
                                                            setShowToDropdown(false);
                                                        }}
                                                        className={`px-3 py-2 text-sm font-medium cursor-pointer transition ${hoverBg} flex items-center justify-between ${
                                                            customerDetails.name === c.name ? "text-[#FF5722] font-bold" : ""
                                                        }`}
                                                    >
                                                        <span>{c.name}</span>
                                                        {customerDetails.name === c.name && <Check size={14} className="text-[#FF5722]" />}
                                                    </div>
                                                ))}

                                                {filteredCustomerCompanies.length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-gray-500">No customers found</div>
                                                )}

                                                {/* + Add New Customer */}
                                                <div
                                                    onClick={() => {
                                                        setModalFlag("customer");
                                                        setCompanyToEdit(null);
                                                        setShowAddCompanyModal(true);
                                                        setShowToDropdown(false);
                                                    }}
                                                    className="px-3 py-2.5 text-sm font-bold text-[#FF5722] hover:bg-orange-500/10 cursor-pointer border-t border-inherit flex items-center gap-1.5"
                                                >
                                                    <Plus size={15} />
                                                    <span>Add New Customer</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Active Customer Details summary */}
                                {customerDetails.name && (
                                    <div className="mt-2.5 pt-2 border-t border-inherit text-xs space-y-0.5 text-gray-500">
                                        {customerDetails.address && <p>{customerDetails.address}</p>}
                                        <div className="flex items-center gap-2">
                                            {customerDetails.city && <span>{customerDetails.city}</span>}
                                            {customerDetails.phone && <span>&middot; Ph: {customerDetails.phone}</span>}
                                        </div>
                                        {customerDetails.gstNo && <p className="font-semibold text-[#FF5722]">GSTIN: {customerDetails.gstNo}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className={`rounded-xl border ${cardBg} shadow-2xl overflow-visible`}>
                            <div className="overflow-visible">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"} font-bold text-[11px] uppercase tracking-wider`}>
                                            <th className="px-2 py-3 text-center w-16">Actions</th>
                                            <th className="px-3 py-3 min-w-[280px]">Item Description</th>
                                            {isGstEnabled && <th className="px-2 py-3 text-center w-24">HSN</th>}
                                            <th className="px-2 py-3 text-center w-24">Qty</th>
                                            <th className="px-2 py-3 text-center w-20">Unit</th>
                                            <th className="px-3 py-3 text-right w-28">Price</th>
                                            {isGstEnabled && <th className="px-2 py-3 text-center w-20">GST %</th>}
                                            <th className="px-3 py-3 text-right w-28">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-inherit">
                                        {rows.map((row, index) => {
                                            const qtyError = getQtyError(row.qty);
                                            const priceError = getPriceError(row.price);

                                            return (
                                                <tr
                                                    key={index}
                                                    className={`transition ${hoverBg} ${
                                                        activeProductDropdown === index ? "relative z-40" : ""
                                                    }`}
                                                >
                                                    {/* Reorder and Delete Actions */}
                                                    <td className="px-2 py-2 text-center align-top">
                                                        <div className="flex items-center justify-center gap-1 pt-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveUp(index)}
                                                                disabled={index === 0}
                                                                className={`p-1 rounded text-gray-400 hover:text-blue-500 disabled:opacity-30`}
                                                                title="Move Up"
                                                            >
                                                                <ArrowUp className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveDown(index)}
                                                                disabled={index === rows.length - 1}
                                                                className={`p-1 rounded text-gray-400 hover:text-blue-500 disabled:opacity-30`}
                                                                title="Move Down"
                                                            >
                                                                <ArrowDown className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteRow(index)}
                                                                className="p-1 rounded text-gray-400 hover:text-red-500"
                                                                title="Delete Row"
                                                            >
                                                                <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Item Description (Dropdown selector of all backend products) */}
                                                    <td className={`px-3 py-2 align-top ${activeProductDropdown === index ? "relative z-40" : "relative"}`}>
                                                        <div
                                                            className={`relative ${activeProductDropdown === index ? "z-50" : ""}`}
                                                            ref={activeProductDropdown === index ? productDropdownRef : null}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={row.product}
                                                                placeholder="Select or enter item"
                                                                onFocus={() => {
                                                                    setActiveProductDropdown(index);
                                                                    setProductSearch("");
                                                                }}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setRows((prev) =>
                                                                        prev.map((r, i) => (i === index ? { ...r, product: val } : r))
                                                                    );
                                                                    setProductSearch(val);
                                                                    setActiveProductDropdown(index);
                                                                }}
                                                                className={`w-full text-xs font-semibold p-2 rounded-lg border ${inputBg}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setActiveProductDropdown(activeProductDropdown === index ? null : index)
                                                                }
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <ChevronDown size={14} />
                                                            </button>

                                                            {/* Dropdown list of products from backend */}
                                                            {activeProductDropdown === index && (
                                                                <div
                                                                    className={`absolute left-0 top-full mt-1.5 w-full min-w-[340px] rounded-xl border ${dropdownBg} z-50 max-h-64 overflow-y-auto shadow-2xl`}
                                                                >
                                                                    <div className={`p-2 border-b border-inherit sticky top-0 ${isDarkMode ? "bg-[#1A1C24]" : "bg-white"} z-10 rounded-t-xl`}>
                                                                        <input
                                                                            type="text"
                                                                            value={productSearch}
                                                                            onChange={(e) => setProductSearch(e.target.value)}
                                                                            placeholder="Search warehouse products..."
                                                                            className={`w-full text-xs p-1.5 rounded border ${inputBg}`}
                                                                            autoFocus
                                                                        />
                                                                    </div>

                                                                    <div className="py-1">
                                                                        {filteredProducts.map((p) => (
                                                                            <div
                                                                                key={p._id}
                                                                                onClick={() => handleSelectProduct(index, p)}
                                                                                className={`px-3 py-2 text-xs font-medium cursor-pointer transition ${hoverBg} flex items-center justify-between`}
                                                                            >
                                                                                <div className="flex-1 pr-2">
                                                                                    <span className="font-semibold block">{p.name}</span>
                                                                                    <span className="text-[10px] text-gray-500">
                                                                                        {p.unit ? `Unit: ${p.unit} ` : ""}
                                                                                        {p.hsn ? `HSN: ${p.hsn} ` : ""}
                                                                                        {p.gst ? `GST: ${p.gst}%` : ""}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="font-bold text-[#FF5722] whitespace-nowrap">
                                                                                    ₹{parseFloat(p.price || 0).toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                        ))}

                                                                        {filteredProducts.length === 0 && (
                                                                            <div className="px-3 py-2 text-xs text-gray-500">
                                                                                No products found matching "{productSearch}"
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* HSN */}
                                                    {isGstEnabled && (
                                                        <td className="px-2 py-2 text-center align-top">
                                                            <input
                                                                type="text"
                                                                value={row.hsn}
                                                                placeholder="HSN"
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setRows((prev) =>
                                                                        prev.map((r, i) => (i === index ? { ...r, hsn: val } : r))
                                                                    );
                                                                }}
                                                                className={`w-20 text-center text-xs p-1.5 rounded border ${inputBg}`}
                                                            />
                                                        </td>
                                                    )}

                                                    {/* Qty */}
                                                    <td className="px-2 py-2 text-center align-top w-24">
                                                        <div className="flex flex-col items-center">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                maxLength={3}
                                                                value={row.qty}
                                                                placeholder="1"
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key) ||
                                                                        e.ctrlKey ||
                                                                        e.metaKey
                                                                    ) {
                                                                        return;
                                                                    }
                                                                    if (!/^\d$/.test(e.key)) {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                onChange={(e) => {
                                                                    let cleanVal = e.target.value.replace(/\D/g, "");
                                                                    if (cleanVal.length > 1 && cleanVal.startsWith("0")) {
                                                                        cleanVal = cleanVal.replace(/^0+/, "") || "0";
                                                                    }
                                                                    setRows((prev) =>
                                                                        prev.map((r, i) =>
                                                                            i === index
                                                                                ? {
                                                                                      ...r,
                                                                                      qty: cleanVal,
                                                                                      amount: calculateAmount(r.price, cleanVal),
                                                                                  }
                                                                                : r
                                                                        )
                                                                    );
                                                                }}
                                                                className={`w-14 text-center font-bold text-xs p-1.5 rounded border transition-colors outline-none ${
                                                                    qtyError
                                                                        ? "border-red-500 text-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                                        : inputBg
                                                                }`}
                                                            />
                                                            {qtyError && (
                                                                <span className="text-[10px] text-red-500 font-medium leading-tight mt-1 text-center whitespace-nowrap">
                                                                    {qtyError}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Unit */}
                                                    <td className="px-2 py-2 text-center align-top">
                                                        <input
                                                            type="text"
                                                            list={`unit-opts-${index}`}
                                                            value={row.unit}
                                                            placeholder="Pcs"
                                                            onChange={(e) => {
                                                                const unitVal = e.target.value;
                                                                setRows((prev) =>
                                                                    prev.map((r, i) => (i === index ? { ...r, unit: unitVal } : r))
                                                                );
                                                            }}
                                                            className={`w-16 text-center text-xs p-1.5 rounded border ${inputBg}`}
                                                        />
                                                        <datalist id={`unit-opts-${index}`}>
                                                            {UNIT_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </datalist>
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-3 py-2 text-right align-top w-28">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center justify-end">
                                                                <span className="text-gray-400 mr-1 text-xs">₹</span>
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={row.price}
                                                                    placeholder="0.00"
                                                                    onKeyDown={(e) => {
                                                                        if (
                                                                            ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key) ||
                                                                            e.ctrlKey ||
                                                                            e.metaKey
                                                                        ) {
                                                                            return;
                                                                        }
                                                                        if (e.key === ".") {
                                                                            if (e.currentTarget.value.includes(".")) {
                                                                                e.preventDefault();
                                                                            }
                                                                            return;
                                                                        }
                                                                        if (!/^\d$/.test(e.key)) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    onChange={(e) => {
                                                                        let cleaned = e.target.value.replace(/[^0-9.]/g, "");
                                                                        const parts = cleaned.split(".");
                                                                        if (parts.length > 2) {
                                                                            cleaned = parts[0] + "." + parts.slice(1).join("");
                                                                        }
                                                                        if (parts.length === 2 && parts[1].length > 2) {
                                                                            cleaned = parts[0] + "." + parts[1].slice(0, 2);
                                                                        }
                                                                        setRows((prev) =>
                                                                            prev.map((r, i) =>
                                                                                i === index
                                                                                    ? {
                                                                                          ...r,
                                                                                          price: cleaned,
                                                                                          amount: calculateAmount(cleaned, r.qty),
                                                                                      }
                                                                                    : r
                                                                            )
                                                                        );
                                                                    }}
                                                                    className={`w-24 text-right font-medium text-xs p-1.5 rounded border transition-colors outline-none ${
                                                                        priceError
                                                                            ? "border-red-500 text-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                                            : inputBg
                                                                    }`}
                                                                />
                                                            </div>
                                                            {priceError && (
                                                                <span className="text-[10px] text-red-500 font-medium leading-tight mt-1 text-right whitespace-nowrap">
                                                                    {priceError}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* GST % */}
                                                    {isGstEnabled && (
                                                        <td className="px-2 py-2 text-center align-top">
                                                            <select
                                                                value={row.gst}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setRows((prev) =>
                                                                        prev.map((r, i) => (i === index ? { ...r, gst: val } : r))
                                                                    );
                                                                }}
                                                                className={`w-16 text-center text-xs p-1.5 rounded border ${inputBg}`}
                                                            >
                                                                {gstOptions.map((g) => (
                                                                    <option key={g} value={String(g)}>
                                                                        {g}%
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    )}

                                                    {/* Amount */}
                                                    <td className="px-3 py-2 text-right font-bold text-sm whitespace-nowrap align-top pt-2">
                                                        ₹{(
                                                            isValidQty(row.qty) && isValidPrice(row.price)
                                                                ? parseFloat(row.price || "0") * parseFloat(row.qty || "0")
                                                                : 0
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add Row Button */}
                            <div className="p-3 border-t border-inherit flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleAddRow}
                                    className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
                                        isDarkMode
                                            ? "border-white/10 hover:bg-white/5 text-gray-200"
                                            : "border-gray-300 hover:bg-gray-100 text-gray-700 bg-white"
                                    }`}
                                >
                                    <Plus className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Add Row</span>
                                </button>
                            </div>
                        </div>

                        {/* Bottom Action Area: Buttons on Left & Totals on Right */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                            {/* Left: Action buttons */}
                            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                                >
                                    <Save className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>{isSaving ? "Saving..." : "Save"}</span>
                                </button>

                                <button
                                    onClick={handleSaveAs}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                                >
                                    <Copy className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Save As</span>
                                </button>

                                <button
                                    onClick={() => setIsPreviewMode(true)}
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition cursor-pointer"
                                >
                                    <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Preview</span>
                                </button>

                                <button
                                    onClick={handleBack}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                        isDarkMode
                                            ? "bg-[#1E2028] border-white/10 text-gray-200 hover:bg-white/10"
                                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                                    }`}
                                >
                                    <ArrowLeft className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Back</span>
                                </button>
                            </div>

                            {/* Right: Totals */}
                            <div className="text-right space-y-1 w-full md:w-auto min-w-[240px]">
                                <div className="text-xs font-medium text-gray-500 flex justify-between md:justify-end gap-6">
                                    <span>Taxable Value :</span>
                                    <span className="font-bold text-inherit">₹ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="text-xs font-medium text-gray-500 flex justify-between md:justify-end gap-6">
                                    <span>Round Off :</span>
                                    <span className="font-bold text-inherit">
                                        {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                                    </span>
                                </div>
                                {isGstEnabled && (
                                    <div className="text-xs font-medium text-gray-500 flex justify-between md:justify-end gap-6">
                                        <span>GST Total :</span>
                                        <span className="font-bold text-[#FF5722]">₹ {rawGstTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="text-base font-black flex justify-between md:justify-end gap-6 pt-1 border-t border-inherit">
                                    <span>Total :</span>
                                    <span>₹ {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* KrisHub Footer Banner (Solid Orange Bar matching user image) */}
            {!isPreviewMode && (
                <footer className="w-full bg-[#FF5722] text-white py-2.5 text-center text-xs sm:text-sm font-medium tracking-wide mt-6 print:hidden">
                    This app is made with ❤️ by KrisHub Software
                </footer>
            )}

            {/* Add Company / Customer Modal */}
            <Modal isOpen={showAddCompanyModal} onClose={() => setShowAddCompanyModal(false)}>
                <AddCompanyModal
                    existingCompany={companyToEdit}
                    flag={modalFlag}
                    closeModal={() => setShowAddCompanyModal(false)}
                    refreshCompanies={modalFlag === "customer" ? fetchCustomerCompanies : fetchFromCompanies}
                    onCompanyCreated={(newCompany) => {
                        if (modalFlag === "vendor") {
                            setCompanyDetails({
                                _id: newCompany._id || "",
                                name: newCompany.name || "",
                                address: newCompany.address || "",
                                phone: newCompany.phone || "",
                                email: newCompany.email || "",
                                gstNo: newCompany.gstNo || "",
                                upiId: newCompany.upiId || "",
                                logo: newCompany.logo || "",
                            });
                        } else {
                            setCustomerDetails({
                                name: newCompany.name || "",
                                address: newCompany.address || "",
                                city: newCompany.city || "",
                                phone: newCompany.phone || "",
                                email: newCompany.email || "",
                                gstNo: newCompany.gstNo || "",
                            });
                        }
                    }}
                />
            </Modal>

            {/* HSN Modal */}
            <Modal isOpen={hsnModal.open} onClose={() => setHsnModal({ open: false, rowIndex: null })}>
                <HsnModal
                    isOpen={hsnModal.open}
                    initialValue={hsnModal.rowIndex !== null ? rows[hsnModal.rowIndex].hsn : ""}
                    onSave={(value) => {
                        setRows((prev) =>
                            prev.map((r, i) => (i === hsnModal.rowIndex ? { ...r, hsn: value } : r))
                        );
                        setHsnModal({ open: false, rowIndex: null });
                    }}
                    onCancel={() => setHsnModal({ open: false, rowIndex: null })}
                />
            </Modal>
        </div>
    );
}
