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
    Building2,
    Check,
    Eye,
    Search,
    Edit3,
} from "lucide-react";
import { API_ENDPOINTS, DATA_API_BASE_URL } from "@constants/api";
import { getLogoUrl } from "@utilis/getLogoUrl";
import { UNIT_OPTIONS } from "@constants/unitOptions";
import { fetchGstOptions, GST_OPTIONS_DEFAULT } from "@constants/gstOptions";
import { Company, Invoice, Product } from "@app-types/createInvoice";
import apiClient from "@utilis/apiClient";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import HsnModal from "@components/HsnModal";
import { useRouter, useSearchParams } from "next/navigation";
import AddCompanyModal from "@components/AddCompanyModal";
import { useUser } from "@context/UserContext";
import Modal from "@components/Modal";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import { formatInvoiceID, getNextInvoiceSequenceID, numberToWords } from "@utilis/formatInvoice";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./createInvoice.css";

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

interface InvoiceRow {
    product: string;
    price: string;
    qty: string;
    unit: string;
    unitFromSuggestion: boolean;
    gst: string;
    amount: number;
    hsn: string;
}

function CreateInvoice() {
    const { isLoggedIn } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    const [isGstEnabled, setIsGstEnabled] = useState(false);
    const [selectedCopyType, setSelectedCopyType] = useState<string>("ORIGINAL FOR RECIPIENT");
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

    const [fromCompanies, setFromCompanies] = useState<Company[]>([]);
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

    const [companies, setCompanies] = useState<Company[]>([]);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [toSearch, setToSearch] = useState("");

    const [invoiceIdDisplay, setInvoiceIdDisplay] = useState<string>("I/26-27/0010");
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // Products from backend
    const [allAvailableProducts, setAllAvailableProducts] = useState<any[]>([]);
    const [activeProductDropdown, setActiveProductDropdown] = useState<number | null>(null);
    const [productSearch, setProductSearch] = useState<string>("");

    // Rows
    const [rows, setRows] = useState<InvoiceRow[]>([
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

    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<any>(null);
    const [modalFlag, setModalFlag] = useState<"vendor" | "customer">("customer");

    const [hsnModal, setHsnModal] = useState<{ open: boolean; rowIndex: number | null }>({
        open: false,
        rowIndex: null,
    });

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dates
    const [invoiceDate, setInvoiceDate] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>("");
    const [termsText, setTermsText] = useState<string>(
        "Payment is due within 10 days of invoice date. Please include the invoice number in your payment reference."
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
            if (list.length > 0 && !companyDetails.name) {
                // optionally keep placeholder or preselect first
            }
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

    const fetchNextInvoiceId = async (): Promise<string | null> => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const { data } = await apiClient.get(
                API_ENDPOINTS.INVOICES.NEXT_ID(userId),
                { headers }
            );

            return formatInvoiceID(data.invoiceID) || "I/26-27/0010";
        } catch (error: any) {
            const guestInvoices = JSON.parse(localStorage.getItem("guestInvoices") || "[]");
            return getNextInvoiceSequenceID(guestInvoices) || "I/26-27/0010";
        }
    };

    const fetchInvoices = async () => {
        if (!id) return;
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const { data } = await apiClient.get(
                API_ENDPOINTS.INVOICES.GET_BY_USER_ID(userId),
                {
                    params: { page: 1, limit: 50, search: id },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const allInvoices: Invoice[] = data.invoices || [];
            setInvoices(allInvoices);
            const invoice = allInvoices.find((inv: Invoice) => inv._id === id || inv.invoiceID === id);
            if (!invoice) return;
            setSelectedInvoice(invoice);

            const fromCompany = invoice.company_id?.[0] || invoice.company || null;
            if (fromCompany) {
                setCompanyDetails({
                    _id: fromCompany._id || "",
                    name: fromCompany.name || "",
                    address: fromCompany.address || "",
                    phone: fromCompany.phone || "",
                    email: fromCompany.email || "",
                    gstNo: fromCompany.gstNo || "",
                    upiId: fromCompany.upiId || "",
                    logo: fromCompany.logo || "",
                });
            }

            const customer = invoice.customers?.[0];
            if (customer) {
                setCustomerDetails({
                    name: customer.name || "",
                    address: customer.address || "",
                    city: customer.city || "",
                    phone: customer.phoneNumber || "",
                    email: customer.email || "",
                    gstNo: (customer as any).gstNo || "",
                });
            }

            if (invoice.products && invoice.products.length > 0) {
                const productRows = invoice.products.map((p: Product) => {
                    const qty = Number(p.quantity) || 1;
                    const price = Number(p.price) || 0;
                    return {
                        product: p.name || "",
                        price: p.price?.toString() || "",
                        qty: p.quantity?.toString() || "1",
                        gst: p.gst?.toString() || "18",
                        unit: p.unit?.toString() || "Pcs",
                        unitFromSuggestion: !!p.unit,
                        hsn: p.hsn || "",
                        amount: qty * price,
                    };
                });
                setRows(productRows);
            }

            setIsGstEnabled(invoice.products?.some((p: Product) => (p.gst || 0) > 0) ?? false);
            setInvoiceIdDisplay(formatInvoiceID(invoice.invoiceID) || "I/26-27/0010");
        } catch (err: any) {
            handleAuthErrorAndToast(err, "Failed to fetch invoice");
        }
    };

    useEffect(() => {
        const init = async () => {
            const today = new Date();
            setInvoiceDate(today.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));
            const due = new Date(today);
            due.setDate(due.getDate() + 10);
            setDueDate(due.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));

            if (id) {
                await fetchInvoices();
                if (mode === "preview") {
                    setIsPreviewMode(true);
                }
            } else {
                const nextId = await fetchNextInvoiceId();
                if (nextId) setInvoiceIdDisplay(nextId);
            }
        };

        init();
        fetchCustomerCompanies();
        fetchFromCompanies();
        fetchAllProducts();
    }, [id, mode]);

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
                          product: product.name || "",
                          price: priceStr,
                          qty: currentQty,
                          unit: product.unit || r.unit || "Pcs",
                          unitFromSuggestion: true,
                          gst: product.gst != null ? String(product.gst) : (r.gst || "18"),
                          hsn: product.hsn || r.hsn || "",
                          amount: pNum * qNum,
                      }
                    : r
            )
        );
        setActiveProductDropdown(null);
        setProductSearch("");
    };

    const handleAddRow = () => {
        setRows((prev) => [
            ...prev,
            { product: "", price: "", qty: "1", unit: "Pcs", unitFromSuggestion: false, gst: "18", amount: 0, hsn: "" },
        ]);
    };

    const handleDeleteRow = (index: number) => {
        if (rows.length === 1) {
            setRows([{ product: "", price: "", qty: "1", unit: "Pcs", unitFromSuggestion: false, gst: "18", amount: 0, hsn: "" }]);
            return;
        }
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        setRows((prev) => {
            const updated = [...prev];
            [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
            return updated;
        });
    };

    const handleMoveDown = (index: number) => {
        if (index === rows.length - 1) return;
        setRows((prev) => {
            const updated = [...prev];
            [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
            return updated;
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
        if (!validateRows(rows)) return;
        setIsSaving(true);

        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId") || "";

            if (!companyDetails._id) {
                const matched = fromCompanies.find((c) => c.name === companyDetails.name) || fromCompanies[0];
                if (matched && matched._id) {
                    companyDetails._id = matched._id;
                    companyDetails.name = matched.name;
                }
            }
            if (!companyDetails._id) {
                safeToastError("Please select a vendor company in FROM");
                setIsSaving(false);
                return;
            }
            if (!customerDetails.name?.trim()) {
                safeToastError("Please select or enter customer details in TO");
                setIsSaving(false);
                return;
            }

            const payload: any = {
                products: rows.map((row) => ({
                    name: row.product,
                    quantity: Number(row.qty),
                    price: Number(row.price),
                    unit: row.unit || "Pcs",
                    amount: row.amount,
                    gst: isGstEnabled ? Number(row.gst || 0) : 0,
                    hsn: row.hsn || "",
                })),
                company_id: companyDetails._id ? [companyDetails._id] : [],
                company: companyDetails,
                customers: [
                    {
                        name: customerDetails.name || "",
                        address: customerDetails.address || "",
                        city: customerDetails.city || "",
                        phoneNumber: customerDetails.phone || "",
                        email: customerDetails.email || "",
                        gstNo: customerDetails.gstNo || "",
                    },
                ],
            };

            if (mode === "edit" && id && !overrideNewId) {
                if (!token) {
                    const guestInvoices: Invoice[] = JSON.parse(localStorage.getItem("guestInvoices") || "[]");
                    const updated = guestInvoices.map((inv) => {
                        if (inv.invoiceLocalId === id || inv.invoiceID === id) {
                            return { ...inv, ...payload };
                        }
                        return inv;
                    });
                    localStorage.setItem("guestInvoices", JSON.stringify(updated));
                    safeToastSuccess("Invoice updated locally!");
                    setIsSaving(false);
                    return;
                }

                const { data } = await apiClient.put(API_ENDPOINTS.INVOICES.UPDATE(id), payload, {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                });
                const updatedInvoice = data.invoice;
                setSelectedInvoice(updatedInvoice);
                safeToastSuccess("Invoice updated successfully!");
                setIsSaving(false);
                if (id) {
                    router.push(`/pages/createInvoice?mode=preview&id=${id}`);
                }
                return;
            }

            // Create new
            const nextId = (overrideNewId ? await fetchNextInvoiceId() : invoiceIdDisplay) || "I/26-27/0010";
            setInvoiceIdDisplay(nextId);

            if (!token) {
                const guestInvoices = JSON.parse(localStorage.getItem("guestInvoices") || "[]");
                const newInvoice = {
                    invoiceID: nextId,
                    isLocal: true,
                    company: companyDetails,
                    customers: payload.customers,
                    products: payload.products,
                    createdAt: new Date().toISOString(),
                    invoiceLocalId: Date.now().toString(),
                };
                guestInvoices.push(newInvoice);
                localStorage.setItem("guestInvoices", JSON.stringify(guestInvoices));
                setSelectedInvoice(newInvoice);
                safeToastSuccess(`Invoice ${nextId} saved successfully!`);
                setIsSaving(false);
                router.push(`/pages/createInvoice?mode=preview&id=${newInvoice.invoiceLocalId}`);
                return;
            }

            const { data } = await apiClient.post(
                API_ENDPOINTS.INVOICES.CREATE(userId),
                { ...payload, invoiceID: nextId },
                {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                }
            );
            const savedInvoice = data.invoice;
            setSelectedInvoice(savedInvoice);
            safeToastSuccess(`Invoice ${savedInvoice?.invoiceID || nextId} saved successfully!`);
            if (savedInvoice?._id) {
                router.push(`/pages/createInvoice?mode=preview&id=${savedInvoice._id}`);
            }
        } catch (error: any) {
            handleAuthErrorAndToast(error, "Failed to save invoice");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAs = async () => {
        const freshId = await fetchNextInvoiceId();
        if (freshId) {
            setInvoiceIdDisplay(freshId);
        }
        await handleSave(true);
    };

    const handlePrint = () => {
        if (isPrinting) return;
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => setIsPrinting(false), 800);
        }, 100);
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const invoiceTargetId = id || selectedInvoice?._id;
            const token = localStorage.getItem("token");
            if (invoiceTargetId) {
                toast.info("Generating invoice PDF download...");
                try {
                    const headers: any = {};
                    if (token) headers.Authorization = `Bearer ${token}`;
                    const res = await apiClient.get(API_ENDPOINTS.INVOICES.DOWNLOAD(invoiceTargetId), {
                        headers,
                        responseType: "blob",
                    });
                    const blob = new Blob([res.data], { type: "application/pdf" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const fileName = `invoice-${(invoiceIdDisplay || "INV").replace(/^#/, "").replace(/[\/\\]/g, "-")}.pdf`;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    safeToastSuccess("Invoice downloaded successfully! 📄");
                    setIsDownloading(false);
                    return;
                } catch (pdfErr) {
                    console.warn("Backend PDF download fallback to client render:", pdfErr);
                }
            }

            const billElement = document.getElementById("invoice-bill-printable") || (document.querySelector(".print-sheet") as HTMLElement);
            if (!billElement) {
                safeToastError("Invoice document not found for download");
                return;
            }

            toast.info("Generating invoice PDF download...");
            const canvas = await html2canvas(billElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1024,
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 8;
            const targetWidth = pageWidth - (margin * 2);
            let targetHeight = (canvas.height * targetWidth) / canvas.width;
            if (targetHeight > pageHeight - (margin * 2)) {
                targetHeight = pageHeight - (margin * 2);
            }
            pdf.addImage(imgData, "PNG", margin, margin, targetWidth, targetHeight);
            const fileName = `invoice-${(invoiceIdDisplay || "INV").replace(/^#/, "").replace(/[\/\\]/g, "-")}.pdf`;
            pdf.save(fileName);
            safeToastSuccess("Invoice downloaded successfully! 📄");
        } catch (error: any) {
            console.error("Download error:", error);
            safeToastError("Failed to download invoice");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleBack = () => {
        if (isPreviewMode) {
            setIsPreviewMode(false);
        } else {
            window.history.back();
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
                {/* 1. If in Preview Mode, render printable preview */}
                {isPreviewMode ? (
                    <div>
                        {/* Preview Top Controls */}
                        <div className={`mb-4 p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 print:hidden ${cardBg}`}>
                            <button
                                onClick={() => setIsPreviewMode(false)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                    isDarkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                <Edit3 className="w-[18px] h-[18px] stroke-[2]" />
                                <span>Back to Edit</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                                        isDarkMode ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Printer className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Print</span>
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                                        isDarkMode ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <Download className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Download PDF</span>
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow-sm transition"
                                >
                                    <Save className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>{isSaving ? "Saving..." : "Save"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Printable A4 Document Sheet */}
                        <div id="invoice-bill-printable" className="print-sheet max-w-[820px] w-full mx-auto bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 print:border-none print:shadow-none print:rounded-none overflow-hidden print:overflow-visible">
                            {/* Copy Tabs */}
                            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50/50 print:hidden">
                                <div className="border border-orange-200 bg-orange-50/40 rounded-lg p-1.5 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                                        <span className="text-xs font-bold text-gray-800 whitespace-nowrap px-1">Invoice Copy:</span>
                                        {[
                                            { label: "Original (Recipient)", value: "ORIGINAL FOR RECIPIENT" },
                                            { label: "Duplicate (Transporter)", value: "DUPLICATE FOR TRANSPORTER" },
                                            { label: "Triplicate (Supplier)", value: "TRIPLICATE FOR SUPPLIER" },
                                            { label: "All Copies", value: "ALL COPIES" },
                                        ].map((copy) => (
                                            <button
                                                key={copy.value}
                                                type="button"
                                                onClick={() => setSelectedCopyType(copy.value)}
                                                className={`px-3 py-1 rounded text-[11px] font-bold transition whitespace-nowrap ${
                                                    selectedCopyType === copy.value
                                                        ? "bg-[#FF5722] text-white shadow-sm"
                                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                                }`}
                                            >
                                                {copy.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 sm:p-6 md:p-8 space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                                    <div className="w-1/4"></div>
                                    <div className="text-center w-2/4">
                                        <span className="text-base sm:text-lg font-black text-gray-900 tracking-wide">
                                            INVOICE NO: <span className="text-[#FF5722]">{invoiceIdDisplay}</span>
                                        </span>
                                    </div>
                                    <div className="w-1/4 flex justify-end">
                                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-400 rounded px-2.5 py-0.5">
                                            {selectedCopyType === "ALL COPIES" ? "ORIGINAL FOR RECIPIENT" : selectedCopyType}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b-2 border-[#FF5722]">
                                    <div className="flex items-start gap-3 w-full sm:max-w-[65%]">
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-white flex items-center justify-center shadow-xs border border-gray-200 overflow-hidden flex-shrink-0">
                                            <img
                                                src={companyDetails.logo ? getLogoUrl(companyDetails.logo) : "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
                                                alt={companyDetails.name || "KrishTech Computers"}
                                                className="w-full h-full object-contain p-1"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    if (!target.src.includes("logo-1779622107439-878996187.webp")) {
                                                        target.src = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h2 className="text-base sm:text-lg font-bold text-gray-900">{companyDetails.name || "Company Name"}</h2>
                                            {companyDetails.address && <p className="text-xs text-gray-600">{companyDetails.address}</p>}
                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                                {companyDetails.phone && <span>Ph: {companyDetails.phone}</span>}
                                                {companyDetails.email && <span>&middot; {companyDetails.email}</span>}
                                            </div>
                                            {isGstEnabled && companyDetails.gstNo && (
                                                <p className="text-xs font-bold text-[#FF5722]">GSTIN: {companyDetails.gstNo}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-left sm:text-right flex-shrink-0">
                                        <h1 className="text-2xl sm:text-3xl font-black text-[#FF5722] tracking-wide uppercase">
                                            TAX INVOICE
                                        </h1>
                                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                            <div>
                                                <span className="font-bold text-gray-800">Date :</span> {invoiceDate}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-800">Valid Till :</span> {dueDate}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-50/40 border border-orange-200 rounded-lg p-3">
                                    <span className="text-[11px] font-bold text-[#FF5722] uppercase tracking-wider block mb-1">
                                        BILLED TO
                                    </span>
                                    <div className="space-y-0.5 text-xs text-gray-700">
                                        <p className="font-bold text-gray-900 text-sm">{customerDetails.name || "Customer / Client Name"}</p>
                                        {customerDetails.address && <p>{customerDetails.address}</p>}
                                        {customerDetails.city && <p>{customerDetails.city}</p>}
                                        <div className="flex items-center gap-2">
                                            {customerDetails.phone && <span>Ph: {customerDetails.phone}</span>}
                                            {customerDetails.email && <span>&middot; {customerDetails.email}</span>}
                                        </div>
                                        {isGstEnabled && customerDetails.gstNo && (
                                            <p className="font-bold text-[#FF5722]">GSTIN: {customerDetails.gstNo}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-[#FF5722] text-white font-bold text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-2 py-2 text-center w-8">SL.</th>
                                                <th className="px-3 py-2">DESCRIPTION</th>
                                                {isGstEnabled && <th className="px-2 py-2 text-center">HSN</th>}
                                                <th className="px-2 py-2 text-center">QTY</th>
                                                <th className="px-2 py-2 text-center">UNIT</th>
                                                <th className="px-3 py-2 text-right">RATE</th>
                                                {isGstEnabled && <th className="px-2 py-2 text-center">GST %</th>}
                                                <th className="px-3 py-2 text-right">AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rows.map((row, index) => (
                                                <tr key={index} className="hover:bg-orange-50/20">
                                                    <td className="px-2 py-2 text-center text-gray-600 font-medium">{String(index + 1).padStart(2, "0")}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-900">{row.product || "-"}</td>
                                                    {isGstEnabled && <td className="px-2 py-2 text-center text-gray-700">{row.hsn || "-"}</td>}
                                                    <td className="px-2 py-2 text-center text-gray-700 font-medium">{row.qty}</td>
                                                    <td className="px-2 py-2 text-center text-gray-700">{row.unit}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-gray-900">₹{parseFloat(row.price || "0").toFixed(2)}</td>
                                                    {isGstEnabled && <td className="px-2 py-2 text-center text-gray-700">{row.gst}%</td>}
                                                    <td className="px-3 py-2 text-right font-bold text-gray-900">
                                                        ₹{(parseFloat(row.price || "0") * parseFloat(row.qty || "0")).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                                    <div className="w-full sm:w-[50%] space-y-1">
                                        <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">AMOUNT IN WORDS:</span>
                                        <div className="bg-orange-50/40 border border-orange-200 rounded-lg p-2.5 text-xs font-semibold text-gray-900 leading-relaxed min-h-[42px] flex items-center">
                                            {grandTotal > 0 ? numberToWords(grandTotal) : "Zero Rupees Only"}
                                        </div>
                                    </div>

                                    <div className="w-full sm:w-[45%] md:w-[40%] space-y-1 text-xs">
                                        <div className="flex justify-between py-0.5 text-gray-600">
                                            <span className="font-medium">Taxable Value</span>
                                            <span className="font-semibold text-gray-900">₹ {subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5 text-gray-600">
                                            <span className="font-medium">Round Off</span>
                                            <span className="font-semibold text-gray-900">₹ {roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span>
                                        </div>
                                        {isGstEnabled && (
                                            <>
                                                {isInterState ? (
                                                    <div className="flex justify-between py-0.5 text-gray-600">
                                                        <span className="font-medium">IGST (18%)</span>
                                                        <span className="font-semibold text-gray-900">₹ {igstAmount.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between py-0.5 text-gray-600">
                                                            <span className="font-medium">CGST (9%)</span>
                                                            <span className="font-semibold text-gray-900">₹ {cgstAmount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between py-0.5 text-gray-600">
                                                            <span className="font-medium">SGST (9%)</span>
                                                            <span className="font-semibold text-gray-900">₹ {sgstAmount.toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        <div className="flex justify-between py-1.5 mt-1 border-t-2 border-gray-900 text-sm md:text-base font-black text-gray-900">
                                            <span>Total</span>
                                            <span>₹ {grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-gray-200">
                                    <div className="space-y-1 flex-1 max-w-[65%]">
                                        <span className="text-[11px] font-bold text-[#FF5722] uppercase tracking-wider block">PAYMENT INFO</span>
                                        <p className="text-xs text-gray-700"><span className="font-semibold">UPI ID:</span> {companyDetails.upiId || "Not specified"}</p>
                                        <p className="text-xs text-gray-700"><span className="font-semibold">Pay to:</span> {companyDetails.name || "Company"}</p>
                                    </div>
                                    {qrDataUrl && (
                                        <div className="flex flex-col items-center">
                                            <img src={qrDataUrl} alt="UPI QR Code" className="w-20 h-20 object-contain border border-gray-200 rounded p-1" />
                                            <span className="text-[9px] text-gray-500 font-medium mt-1">Scan to pay via UPI</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#FF5722] text-white text-center py-2 text-xs sm:text-sm font-bold tracking-wide">
                                Thank you for your business
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 2. Interactive Invoice Form matching user image */
                    <div className="space-y-4">
                        {/* Top Bar: GST toggle (left) | Invoice ID (center) | Dates (right) */}
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

                                {/* Center: Invoice Sequence ID */}
                                <div className="text-center">
                                    <input
                                        type="text"
                                        value={invoiceIdDisplay}
                                        onChange={(e) => setInvoiceIdDisplay(e.target.value)}
                                        className={`text-center font-black text-lg sm:text-xl tracking-wide bg-transparent border-0 border-b border-dashed ${
                                            isDarkMode ? "border-gray-600 text-white focus:border-[#FF5722]" : "border-gray-300 text-gray-900 focus:border-[#FF5722]"
                                        } focus:ring-0 px-2 py-0.5`}
                                    />
                                </div>

                                {/* Right: Dates */}
                                <div className="text-right text-xs space-y-0.5">
                                    <div className="font-bold">{invoiceDate || "20/10/2026"}</div>
                                    <div className="text-gray-500 font-medium">Valid Till: {dueDate || "30/10/2026"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Two Columns: From & To */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From : Card */}
                            <div className={`p-4 rounded-xl border ${cardBg} relative`}>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                                    From :
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
                                        <div className={`absolute left-0 top-full mt-1.5 w-full rounded-xl border ${dropdownBg} z-40 max-h-64 overflow-y-auto`}>
                                            {/* Search */}
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

                            {/* To : Card */}
                            <div className={`p-4 rounded-xl border ${cardBg} relative`}>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                                    To :
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
                                            {/* Search */}
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
                                                                <span className="text-gray-500 mr-1 text-xs">₹</span>
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
                                    className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition"
                                >
                                    <Save className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>{isSaving ? "Saving..." : "Save"}</span>
                                </button>

                                <button
                                    onClick={handleSaveAs}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition"
                                >
                                    <Copy className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Save As</span>
                                </button>

                                <button
                                    onClick={() => setIsPreviewMode(true)}
                                    className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center gap-1.5 shadow transition"
                                >
                                    <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                    <span>Preview</span>
                                </button>

                                <button
                                    onClick={handleBack}
                                    className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
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

            {/* KrisHub Footer Banner (Solid Orange Bar at bottom matching user image) */}
            <footer className="w-full bg-[#FF5722] text-white py-2.5 text-center text-xs sm:text-sm font-medium tracking-wide mt-6 print:hidden">
                This app is made with ❤️ by KrisHub Software
            </footer>

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

export default CreateInvoice;