"use client"
import { PrimaryBtn, IconBtn, OrangeSpinner } from "@components/Button";
import Header from "@components/header/page";
import { API_ENDPOINTS } from "@constants/api";
import Modal from "@components/Modal";
import AddCompanyModal from "@components/AddCompanyModal";
import React from "react";
import { toast } from "react-toastify";
import FilterPanel from "@components/FilterPanel/page";
import { Filters } from "@app-types/FilterProps";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import { Invoices } from "@app-types/invoiceHomepage";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { useUser } from "@context/UserContext";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Filter, Eye, Link2, Pencil, Trash2, Heart, Search, ChevronLeft, ChevronRight, CheckSquare, Upload, Download, FileSpreadsheet, Printer, X } from "lucide-react";
import apiClient from "@utilis/apiClient";
import { useFinancialYear } from "@context/FinancialYearContext";
import { formatInvoiceID } from "@utilis/formatInvoice";

function Invoice() {
    const [internalDark, setInternalDark] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) return saved === "dark";
            return document.documentElement.classList.contains("dark");
        }
        return true;
    });

    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) {
                setInternalDark(saved === "dark");
            } else {
                setInternalDark(document.documentElement.classList.contains("dark"));
            }
        };
        window.addEventListener("themechange", handleThemeSync);
        window.addEventListener("storage", handleThemeSync);
        return () => {
            window.removeEventListener("themechange", handleThemeSync);
            window.removeEventListener("storage", handleThemeSync);
        };
    }, []);

    const isDarkMode = internalDark;
    const themeBg = isDarkMode ? "bg-[#0D0E12] text-[#E0E2EC]" : "bg-[#F8F9FC] text-[#111827]";

    const { isLoggedIn } = useUser();
    const { filterByFY, currentFYLabel, selectedFY, currentOption } = useFinancialYear();
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [invoices, setInvoices] = useState<Invoices[] | null>(null);
    const displayedInvoices = useMemo(() => filterByFY(invoices || []), [filterByFY, invoices]);
    const [isFilterVisible, setFilterVisible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem("selectedInvoiceCompany") || "";
        }
        return "";
    });
    const [loading, setLoading] = useState(true);

    // Consolidated HSN Summary Modal State
    const [showHsnSummaryModal, setShowHsnSummaryModal] = useState(false);
    const [selectedHsnMonth, setSelectedHsnMonth] = useState<string>("ALL");

    // Helper to extract GST state code
    const getGstCode = (item?: any): string => {
        if (!item) return "";
        const gst = (item.gstNo || item.gstin || "").trim();
        if (gst.length >= 2 && /^\d{2}/.test(gst)) return gst.slice(0, 2);
        return (item.state || "").trim().toLowerCase();
    };

    // Consolidated Month-wise HSN Aggregation
    const calculateConsolidatedHsn = () => {
        const sourceInvoices = displayedInvoices || [];
        
        const monthMap = new Map<string, string>();
        sourceInvoices.forEach((inv: any) => {
            if (inv.createdAt) {
                const d = new Date(inv.createdAt);
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                    monthMap.set(key, label);
                }
            }
        });

        const filteredInvoices = sourceInvoices.filter((inv: any) => {
            if (selectedHsnMonth === "ALL") return true;
            if (!inv.createdAt) return true;
            const d = new Date(inv.createdAt);
            if (isNaN(d.getTime())) return true;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            return key === selectedHsnMonth;
        });

        const hsnAggMap = new Map<string, {
            hsn: string;
            taxableValue: number;
            centralTaxRate: number;
            centralTaxAmount: number;
            stateTaxRate: number;
            stateTaxAmount: number;
            igstRate: number;
            igstAmount: number;
            totalTaxAmount: number;
        }>();

        filteredInvoices.forEach((inv: any) => {
            const seller = Array.isArray(inv.company_id) ? inv.company_id[0] : inv.company_id;
            const buyer = Array.isArray(inv.customers) ? inv.customers[0] : inv.customers;
            const sellerCode = getGstCode(seller);
            const buyerCode = getGstCode(buyer);
            const isInterState = Boolean(sellerCode && buyerCode && sellerCode !== buyerCode);

            const products = inv.products || [];
            products.forEach((p: any) => {
                const hsnCode = (p.hsn || "OTHER").trim() || "OTHER";
                const qty = parseFloat(p.quantity || p.qty || 0);
                const price = parseFloat(p.price || 0);
                const taxableVal = qty * price;
                const gstRate = parseFloat(p.gst || 0);

                const existing = hsnAggMap.get(hsnCode) || {
                    hsn: hsnCode,
                    taxableValue: 0,
                    centralTaxRate: isInterState ? 0 : gstRate / 2,
                    centralTaxAmount: 0,
                    stateTaxRate: isInterState ? 0 : gstRate / 2,
                    stateTaxAmount: 0,
                    igstRate: isInterState ? gstRate : 0,
                    igstAmount: 0,
                    totalTaxAmount: 0,
                };

                existing.taxableValue += taxableVal;

                if (isInterState) {
                    const igstAmt = (taxableVal * gstRate) / 100;
                    existing.igstAmount += igstAmt;
                    existing.igstRate = gstRate;
                    existing.totalTaxAmount += igstAmt;
                } else {
                    const halfRate = gstRate / 2;
                    const halfTax = (taxableVal * halfRate) / 100;
                    existing.centralTaxRate = halfRate;
                    existing.centralTaxAmount += halfTax;
                    existing.stateTaxRate = halfRate;
                    existing.stateTaxAmount += halfTax;
                    existing.totalTaxAmount += (halfTax * 2);
                }

                hsnAggMap.set(hsnCode, existing);
            });
        });

        const hsnList = Array.from(hsnAggMap.values());
        const totalTaxable = hsnList.reduce((acc, r) => acc + r.taxableValue, 0);
        const totalCGST = hsnList.reduce((acc, r) => acc + r.centralTaxAmount, 0);
        const totalSGST = hsnList.reduce((acc, r) => acc + r.stateTaxAmount, 0);
        const totalIGST = hsnList.reduce((acc, r) => acc + r.igstAmount, 0);
        const totalTaxSum = hsnList.reduce((acc, r) => acc + r.totalTaxAmount, 0);

        return {
            monthOptions: Array.from(monthMap.entries()).map(([key, label]) => ({ key, label })),
            hsnList,
            totalTaxable,
            totalCGST,
            totalSGST,
            totalIGST,
            totalTaxSum,
        };
    };

    const handleDownloadHsnCSV = () => {
        const { hsnList, totalTaxable, totalCGST, totalSGST, totalIGST, totalTaxSum } = calculateConsolidatedHsn();
        if (hsnList.length === 0) {
            toast.warn("No HSN summary data available to download");
            return;
        }

        let csv = "HSN/SAC,Taxable Value (INR),CGST Rate (%),CGST Amount (INR),SGST Rate (%),SGST Amount (INR),IGST Rate (%),IGST Amount (INR),Total Tax Amount (INR)\n";

        hsnList.forEach((row) => {
            csv += `"${row.hsn}",${row.taxableValue.toFixed(2)},${row.centralTaxRate}%,${row.centralTaxAmount.toFixed(2)},${row.stateTaxRate}%,${row.stateTaxAmount.toFixed(2)},${row.igstRate}%,${row.igstAmount.toFixed(2)},${row.totalTaxAmount.toFixed(2)}\n`;
        });

        csv += `"TOTAL",${totalTaxable.toFixed(2)},-,${totalCGST.toFixed(2)},-,${totalSGST.toFixed(2)},-,${totalIGST.toFixed(2)},${totalTaxSum.toFixed(2)}\n`;

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Consolidated_HSN_Summary_${selectedHsnMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Consolidated HSN CSV downloaded!");
    };

    const handlePrintHsnSummary = () => {
        window.print();
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [modalFlag, setModalFlag] = useState<"vendor" | "customer">("customer");
    const [filters, setFilters] = useState<Filters>(() => {
        const savedCompany = typeof window !== "undefined" ? sessionStorage.getItem("selectedInvoiceCompany") || "" : "";
        return {
            minPrice: "",
            maxPrice: "",
            startDate: "",
            endDate: "",
            sortOption: "",
            favoritesOnly: false,
            allCompanies: !savedCompany,
            companyId: savedCompany || undefined,
        };
    });

    const router = useRouter()

    const fetchInvoices = useCallback((
        appliedFilters = filters,
        companyId?: string,
        page = 1,
        search?: string
    ) => {
        setLoading(true);

        const searchValue = search !== undefined ? search : searchQuery;
        const storedUserId = typeof window !== "undefined" ? (localStorage.getItem("user_id") || localStorage.getItem("authId")) : null;


        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!storedUserId && !token) {
            const localData = localStorage.getItem("guestInvoices");
            setInvoices(localData ? JSON.parse(localData) : []);
            setLoading(false);
            return;
        }
        const userId = storedUserId || "default";

        // 🧩 Build query params
        const queryParams = new URLSearchParams();
        if (appliedFilters.minPrice) queryParams.append("minPrice", appliedFilters.minPrice);
        if (appliedFilters.maxPrice) queryParams.append("maxPrice", appliedFilters.maxPrice);
        if (appliedFilters.startDate) {
            queryParams.append("startDate", appliedFilters.startDate);
        } else if (selectedFY !== "ALL" && currentOption?.startDate) {
            queryParams.append("startDate", currentOption.startDate.toISOString());
        }

        if (appliedFilters.endDate) {
            queryParams.append("endDate", appliedFilters.endDate);
        } else if (selectedFY !== "ALL" && currentOption?.endDate) {
            queryParams.append("endDate", currentOption.endDate.toISOString());
        }
        if (appliedFilters.sortOption) queryParams.append("sort", appliedFilters.sortOption);
        if (appliedFilters.favoritesOnly) queryParams.append("isHeart", "true");
        if (searchValue) queryParams.append("search", searchValue);
        if (!appliedFilters.allCompanies && companyId)
            queryParams.append("companyId", companyId);
        queryParams.append("page", page.toString());
        queryParams.append("limit", "100");

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 🌐 Fetch from API
        apiClient
            .get(`${API_ENDPOINTS.INVOICES.GET_BY_USER_ID(userId)}?${queryParams}`, {
                headers,
            })
            .then((res) => {
                const mapInvoices = (list: any[]) =>
                    list.map((inv: any) => {
                        const totalRaw =
                            inv.total != null
                                ? inv.total
                                : inv.products?.reduce((sum: number, row: any) => {
                                      if (row.amount != null) return sum + Number(row.amount);
                                      const price = Number(row.price) || 0;
                                      const qty = Number(row.quantity) || 0;
                                      const gst = Number(row.gst) || 0;
                                      return sum + price * qty * (1 + gst / 100);
                                  }, 0) ?? 0;
                        return { ...inv, total: Number(Number(totalRaw).toFixed(2)), id: inv._id };
                    });

                const invoicesWithTotal = mapInvoices(res.data.invoices || []);
                setInvoices(invoicesWithTotal);
                setCurrentPage(res.data.pagination?.page || 1);
                setTotalPages(res.data.pagination?.totalPages || 1);
            })
            .catch((err) => {
                const localData = localStorage.getItem("guestInvoices");
                if (localData) {
                    setInvoices(JSON.parse(localData));
                } else {
                    if (handleAuthErrorAndToast(err, "Failed to fetch invoices")) return;
                    setInvoices([]);
                }
            })
            .finally(() => setLoading(false));
    }, [filters, searchQuery, selectedFY, currentOption]);

    const handleCompanyChange = (value: string) => {
        if (value === "add" || value === "add_customer") {
            setModalFlag(value === "add_customer" ? "customer" : "vendor");
            setShowAddCompanyModal(true);
            return;
        }

        setSelectedCompany(value);
        setFilters((prev) => ({
            ...prev,
            allCompanies: value === "",
            companyId: value || undefined,
        }));

        // Persist selection
        sessionStorage.setItem("selectedInvoiceCompany", value);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("xmlFile", file);

        try {
            setLoading(true);
            const userId = localStorage.getItem("user_id")!;
            const token = localStorage.getItem("token");

            const res = await apiClient.post(
                API_ENDPOINTS.INVOICES.IMPORT_XML(userId),
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            safeToastSuccess(`${res.data.invoices.length} invoice(s) uploaded successfully!`);
            await fetchInvoices();
            await getCompanies();
        } catch {
            safeToastError("Failed to upload XML file.");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getCompanies = () => {
        setLoading(true);
        const storedUserId = typeof window !== "undefined" ? (localStorage.getItem("user_id") || localStorage.getItem("authId")) : null;

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!storedUserId && !token) {
            const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
            setCompanies(localCompanies);
            setLoading(false);
            return;
        }


        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        apiClient
            .get(API_ENDPOINTS.COMPANIES.GET_COMPANY_BY_USER_ID(storedUserId || "default"), {
                params: { flag: "vendor" },
                headers,
            })
            .then((response) => {
                const fetchedCompanies = response.data.company || [];
                setCompanies(fetchedCompanies);
                const savedCompany = sessionStorage.getItem("selectedInvoiceCompany");
                if (savedCompany && fetchedCompanies.some((c: any) => c._id === savedCompany)) {
                    setSelectedCompany(savedCompany);
                    setFilters((prev) => ({
                        ...prev,
                        allCompanies: false,
                        companyId: savedCompany,
                    }));
                } else {
                    setSelectedCompany("");
                }
            })
            .catch(() => {
                const localCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
                setCompanies(localCompanies);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getCompanies();
    }, []);

    useEffect(() => {
        const savedPage = sessionStorage.getItem("invoice_page");
        if (savedPage)
            setCurrentPage(Number(savedPage));
        const timer = setTimeout(() => {
            sessionStorage.removeItem("invoice_page");
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const isFirstInvoiceRun = useRef(true);
    useEffect(() => {
        if (isFirstInvoiceRun.current) {
            isFirstInvoiceRun.current = false;
            fetchInvoices(filters, selectedCompany, currentPage, searchQuery);
            return;
        }
        const timer = setTimeout(() => {
            fetchInvoices(filters, selectedCompany, currentPage, searchQuery);
        }, 350);
        return () => clearTimeout(timer);
    }, [filters, searchQuery, currentPage, selectedCompany, selectedFY, currentOption, fetchInvoices]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFY]);


    const handleCreateNew = () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");

        // Check if user is not logged in
        if (!token || !userId) {
            const localData = localStorage.getItem("guestInvoices");
            const guestInvoices = localData ? JSON.parse(localData) : [];

            if (guestInvoices.length >= 3) {
                toast.warn("Limit exceeded to create more invoices. Login is required.");
                return;
            }
        }
        router.push("/pages/createInvoice");
    };

    const handlePreview = (inv: Invoices) => {
        sessionStorage.setItem("invoice_page", currentPage.toString());
        const id = inv._id || inv.invoiceLocalId;
        router.push(`/pages/createInvoice?mode=preview&id=${id}`);
    };

    const handleShare = async (inv: Invoices) => {
        const id = inv._id || inv.invoiceLocalId;
        const shareUrl = `${window.location.origin}/pages/createInvoice?mode=preview&id=${id}`;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                safeToastSuccess("Invoice preview link copied to clipboard!");
            } else {
                safeToastSuccess("Invoice preview link: " + shareUrl);
            }
        } catch {
            safeToastSuccess("Invoice preview link: " + shareUrl);
        }
    };

    const handleEdit = (inv: Invoices) => {
        sessionStorage.setItem("invoice_page", currentPage.toString());
        const id = inv._id || inv.invoiceLocalId;
        router.push(`/pages/createInvoice?mode=edit&id=${id}`);
    };

    const handleDownloadPDF = async (inv: Invoices) => {
        const id = inv._id || inv.invoiceLocalId;
        if (!id) return;
        toast.info("Downloading invoice PDF...");
        const token = localStorage.getItem("token");
        try {
            const headers: any = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await apiClient.get(API_ENDPOINTS.INVOICES.DOWNLOAD(id), {
                headers,
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileName = `invoice-${(inv.invoiceID || id).replace(/^#/, "").replace(/[\/\\]/g, "-")}.pdf`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Invoice PDF downloaded successfully!");
        } catch (err) {
            console.error("Error downloading PDF:", err);
            router.push(`/pages/createInvoice?mode=preview&id=${id}`);
        }
    };

    const toggleFilterPanel = () => {
        setFilterVisible(!isFilterVisible);
    };

    const confirmDelete = async () => {
        const idsToDelete = selectedInvoiceIds.length > 0
            ? selectedInvoiceIds
            : deleteTarget
                ? [deleteTarget._id || deleteTarget.invoiceLocalId]
                : [];

        if (idsToDelete.length === 0) return;

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");

        const adjustPagination = async (allInvoices: Invoices[]) => {
            const totalPages = Math.ceil(allInvoices.length / pageSize);
            let newPage = currentPage;

            const startIdx = (currentPage - 1) * pageSize;
            const invoicesOnCurrentPage = allInvoices.slice(startIdx, startIdx + pageSize);

            if (invoicesOnCurrentPage.length === 0) {
                if (allInvoices.length > startIdx) {
                    newPage = currentPage;
                } else if (currentPage < totalPages) {
                    newPage = currentPage + 1;
                } else if (currentPage > 1) {
                    newPage = currentPage - 1;
                } else {
                    newPage = 1;
                }
            }

            setCurrentPage(newPage);
            await fetchInvoices(filters, undefined, newPage, searchQuery);
        };

        // ----------------- GUEST / LOCAL -----------------
        if (!token || !userId) {
            const guestInvoices: Invoices[] = JSON.parse(localStorage.getItem("guestInvoices") || "[]");

            const updatedInvoices = guestInvoices
                .filter(inv => !idsToDelete.includes(inv.invoiceLocalId) && !idsToDelete.includes(inv.invoiceID))
                .map(inv => {
                    const total =
                        inv.products?.reduce(
                            (sum, row) =>
                                sum + Number(row.amount ?? ((Number(row.price) || 0) * (Number(row.quantity) || 0))),
                            0
                        ) ?? 0;
                    return { ...inv, total };
                });

            localStorage.setItem("guestInvoices", JSON.stringify(updatedInvoices));
            safeToastSuccess(`${idsToDelete.length} invoice(s) deleted locally!`);

            setSelectedInvoiceIds([]);
            setDeleteTarget(null);
            setSelectionMode(false);
            setShowConfirm(false);

            await adjustPagination(updatedInvoices);
            return;
        }

        // ----------------- LOGGED-IN USERS -----------------
        try {
            const { data } = await apiClient.post(
                API_ENDPOINTS.INVOICES.DELETE_MULTIPLE,
                { ids: idsToDelete },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            safeToastSuccess(`${data.deletedCount} invoice(s) deleted successfully`);

            // Remaining invoices after deletion
            const remainingInvoices = (invoices ?? []).filter(inv => !idsToDelete.includes(inv._id));
            setSelectedInvoiceIds([]);
            setDeleteTarget(null);
            setSelectionMode(false);
            setShowConfirm(false);

            await adjustPagination(remainingInvoices);

        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Server Error")) return;
        }
    };

    const handleExportXML = async (selectedInvoices?: any[] | string[]) => {
        try {
            const ids: string[] =
                selectedInvoices && selectedInvoices.length > 0
                    ? selectedInvoices.map((inv) =>
                        typeof inv === "string" ? inv : inv._id || inv.invoiceID
                    ).filter((id) => typeof id === "string" && id.length > 0)
                    : selectedInvoiceIds.length > 0
                        ? selectedInvoiceIds
                        : deleteTarget
                            ? [deleteTarget._id || deleteTarget.invoiceLocalId]
                            : [];

            if (ids.length === 0) {
                toast.warn("Please select at least one invoice to export.");
                return;
            }

            const token = localStorage.getItem("token");
            const endpoint = API_ENDPOINTS.INVOICES.EXPORT_XML;

            const response = await apiClient.post(
                endpoint,
                { ids },
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], { type: "application/xml" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "invoices.xml";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setSelectedInvoiceIds([])
            setSelectionMode(false)
            safeToastSuccess("Invoices exported successfully!");
        } catch (error) {
            if (handleAuthErrorAndToast(error, "Server Error")) return
            safeToastError("Failed to export invoices.");
        }
    };

    const toggleInvoiceFavorite = async (invoiceId: string) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const res = await apiClient.patch(
                API_ENDPOINTS.INVOICES.TOGGLE_FAVORITE(invoiceId),
                {},
                { headers }
            );
            const data = res.data;

            // Update frontend state
            setInvoices((prev) =>
                (prev ?? []).map((inv) =>
                    inv._id === invoiceId ? { ...inv, isHeart: data.isHeart } : inv
                )
            );
            safeToastSuccess("Favourite status updated");
        } catch {
            // Local fallback
            setInvoices((prev) =>
                (prev ?? []).map((inv) =>
                    inv._id === invoiceId ? { ...inv, isHeart: !inv.isHeart } : inv
                )
            );
            safeToastSuccess("Favourite status updated");
        }
    };

    const toggleSelect = (inv: Invoices) => {
        const id = inv._id || inv.invoiceLocalId;
        if (!id) return; // safety check

        setSelectedInvoiceIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (!invoices) return;
        if (selectedInvoiceIds.length === invoices.length) {
            setSelectedInvoiceIds([]);
        } else {
            setSelectedInvoiceIds(
                invoices.map((inv) => inv._id || inv.invoiceLocalId).filter(Boolean) as string[]
            );
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    return (
        <div className={`min-h-screen ${themeBg} flex flex-col font-sans transition-colors duration-200 pb-16`}>
            <Header />

            {/* ════════════════ 2. INVOICE TOOLBAR ════════════════ */}
            <div className="hidden md:block w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-2">
                <div className="flex flex-row gap-3 items-center justify-between w-full">
                    {/* Left: Combined Search Input & Company Selector */}
                    <div className={`flex w-[520px] border ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26]" : "border-gray-300 bg-white"} rounded-xl overflow-hidden shadow-sm transition-colors group`}>
                        {/* 1. Search Input (FIRST) */}
                        <div className="relative flex-1 min-w-0">
                            <input
                                type="text"
                                disabled={selectedInvoiceIds.length > 0}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className={`flex-1 w-full px-4 py-2 pr-9 text-sm outline-none border-none rounded-l-xl ${isDarkMode ? "bg-[#1B1E26] text-white placeholder-gray-500" : "bg-white text-gray-800 placeholder-gray-400"}
                   focus:ring-2 focus:ring-orange-400 transition-all`}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Search className="w-[18px] h-[18px] stroke-[2] text-gray-400" />
                            </span>
                        </div>

                        {/* 2. Dropdown (NEXT) */}
                        <select
                            disabled={selectedInvoiceIds.length > 0}
                            value={selectedCompany}
                            onChange={(e) => handleCompanyChange(e.target.value)}
                            className={`px-3 py-2 text-sm ${isDarkMode ? "bg-[#181B26] text-gray-200 border-[#2B3044]" : "bg-gray-50 text-gray-800 border-gray-300"} border-l outline-none hover:bg-gray-100 dark:hover:bg-[#1E2232] 
                 disabled:opacity-50 rounded-r-xl md:min-w-[220px]
                 focus:ring-2 focus:ring-orange-400 transition-all font-semibold cursor-pointer`}
                        >
                            <option value="" className="font-semibold text-[#FF5722]">
                                All Companies
                            </option>
                            {companies.map((company) => (
                                <option key={company._id} value={company._id} className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-800"}>
                                    {company.name}
                                </option>
                            ))}
                            <option value="add" className="font-semibold text-[#FF5722]">
                                ➕ Add Company
                            </option>
                            <option value="add_customer" className="font-semibold text-[#FF5722]">
                                ➕ Add Customer
                            </option>
                        </select>
                    </div>
                    {isLoggedIn && (
                        <IconBtn
                            onClick={toggleFilterPanel}
                            disabled={selectedInvoiceIds.length > 0}
                            label={<Filter className={`w-5 h-5 stroke-[2] ${isDarkMode ? "text-gray-300" : "text-gray-500"}`} />}
                        />
                    )}
                    <div className="flex w-auto ml-auto gap-2">
                        {selectedInvoiceIds.length > 0 && (
                            <>
                                <IconBtn
                                    label={<Trash2 className="w-5 h-5 stroke-[2] text-red-500" />}
                                    onClick={() => {
                                        setDeleteTarget(null);
                                        setShowConfirm(true);
                                    }}
                                />
                                {isLoggedIn && selectedInvoiceIds.length > 0 && (
                                    <IconBtn
                                        onClick={() => handleExportXML(selectedInvoiceIds)}
                                        label={<Download className="w-5 h-5 stroke-[2]" />}
                                    />
                                )}
                            </>
                        )}
                        <IconBtn
                            disabled={selectedInvoiceIds.length > 0}
                            onClick={() => setShowHsnSummaryModal(true)}
                            label={<FileSpreadsheet className="w-5 h-5 stroke-[2] text-orange-600" />}
                        />
                        {isLoggedIn && (
                            <>
                                <input
                                    type="file"
                                    accept=".xml"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <IconBtn
                                    disabled={selectedInvoiceIds.length > 0}
                                    onClick={handleUploadClick}
                                    label={<Upload className="w-5 h-5 stroke-[2]" />}
                                />
                            </>
                        )}
                        <PrimaryBtn
                            onClick={handleCreateNew}
                            disabled={selectedInvoiceIds.length > 0}
                            label="Create New"
                        />
                    </div>
                </div>
            </div>

            {/* MOBILE LAYOUT */}
            <main className="md:hidden">
                <div className="md:hidden flex flex-col gap-3 items-start p-3">
                    <div className={`flex w-full border ${isDarkMode ? "border-white/[0.08] bg-[#1B1E26]" : "border-gray-300 bg-white"} rounded-xl overflow-hidden shadow-sm`}>
                        {/* 1. Mobile Search Input (FIRST) */}
                        <div className="relative flex-1 min-w-0">
                            <input
                                type="text"
                                disabled={selectionMode}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className={`w-full px-3 py-2 pr-10 text-sm outline-none rounded-l-xl border-none ${isDarkMode ? "bg-[#1B1E26] text-white placeholder-gray-500" : "bg-white text-gray-800 placeholder-gray-400"}
               focus:ring-2 focus:ring-orange-400
               disabled:opacity-50 transition-all`}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Search className="w-[18px] h-[18px] stroke-[2] text-gray-400" />
                            </span>
                        </div>

                        {/* 2. Mobile Company Dropdown (NEXT) */}
                        <select
                            disabled={selectionMode}
                            value={selectedCompany}
                            onChange={(e) => handleCompanyChange(e.target.value)}
                            className={`w-1/2 shrink-0 px-2 py-1 text-xs ${isDarkMode ? "bg-[#181B26] text-gray-200 border-[#2B3044]" : "bg-gray-50 text-gray-800 border-gray-300"} border-l outline-none rounded-r-xl hover:bg-gray-100 dark:hover:bg-[#1E2232] transition-colors disabled:opacity-50 font-semibold`} 
                        >
                            <option value="" className="text-[#FF5722] font-semibold">
                                All Companies
                            </option>
                            {companies.map((company) => (
                                <option key={company._id} value={company._id} className={isDarkMode ? "bg-[#16181E] text-white" : "bg-white text-gray-800"}>
                                    {company.name}
                                </option>
                            ))}
                            <option value="add" className="text-[#FF5722] font-semibold">
                                ➕ Add Company
                            </option>
                            <option value="add_customer" className="text-[#FF5722] font-semibold">
                                ➕ Add Customer
                            </option>
                        </select>
                    </div>
                </div>

                {/* Mobile/Tablet fixed bottom action bar */}
                <div className={`fixed ${totalPages > 1 ? "bottom-[52px]" : "bottom-0"} left-0 right-0 z-30 md:hidden ${isDarkMode ? "bg-[#16181E] border-white/[0.08]" : "bg-white border-gray-200"} border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-3 py-2`}>
                    {selectionMode ? (
                        <div className="flex items-center gap-2 w-full">
                            <button
                                onClick={() => {
                                    setSelectionMode(false);
                                    setSelectedInvoiceIds([]);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium active:bg-orange-600 transition-all cursor-pointer"
                            >
                                <CheckSquare className="w-[18px] h-[18px] stroke-[2]" />
                                Cancel
                            </button>
                            {selectedInvoiceIds.length > 0 && (
                                <>
                                    <IconBtn
                                        label={<Trash2 className="w-5 h-5 stroke-[2] text-red-500" />}
                                        onClick={() => {
                                             setDeleteTarget(null);
                                             setShowConfirm(true);
                                        }}
                                    />
                                    {isLoggedIn && (
                                        <IconBtn
                                            onClick={() => handleExportXML(selectedInvoiceIds)}
                                            label={<Download className="w-5 h-5 stroke-[2]" />}
                                        />
                                    )}
                                </>
                            )}
                            <label className="ml-auto flex items-center gap-2 cursor-pointer text-orange-600 font-semibold">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-orange-500"
                                    checked={!!invoices && selectedInvoiceIds.length === invoices.length}
                                    onChange={selectAll}
                                />
                                <div>Select All</div>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <button
                                onClick={() => setSelectionMode(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-[#1B1E26] text-gray-600 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.08] active:bg-gray-100 transition-all cursor-pointer"
                            >
                                <CheckSquare className="w-[18px] h-[18px] stroke-[2]" />
                                Select
                            </button>

                            {isLoggedIn && (
                                <IconBtn
                                    onClick={toggleFilterPanel}
                                    label={<Filter className="w-5 h-5 stroke-[2] text-gray-500 dark:text-gray-300" />}
                                />
                            )}

                            <IconBtn
                                onClick={() => setShowHsnSummaryModal(true)}
                                label={<FileSpreadsheet className="w-5 h-5 stroke-[2] text-orange-600" />}
                            />

                            {isLoggedIn && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <IconBtn
                                        label={<Upload className="w-5 h-5 stroke-[2]" />}
                                        onClick={handleUploadClick}
                                    />
                                </>
                            )}

                            <div className="ml-auto">
                                <PrimaryBtn onClick={handleCreateNew} label="Create New" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Invoice List (Mobile) */}
                <div className="md:hidden flex flex-col gap-3 p-3 pb-32">
                    {loading || invoices === null ? (
                        <div className="flex items-center justify-center h-[60vh] w-full">
                            <OrangeSpinner size={40} />
                        </div>
                    ) : displayedInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/empty-icon.png"
                                alt="No invoices"
                                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mb-3 opacity-80"
                            />
                            <p className="text-gray-500 text-sm sm:text-base md:text-lg font-medium leading-snug">
                                No invoices found for the selected Financial Year
                            </p>
                        </div>
                    ) : (
                        displayedInvoices.map((inv, index) => (
                            <div
                                key={inv.id || `invoice-${index}`}
                                className="grid grid-cols-[1fr_auto] items-center border rounded-lg p-4 shadow-sm gap-x-4
    border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                                onClick={() => {
                                    if (selectionMode)
                                        toggleSelect(inv);
                                    else
                                        handlePreview(inv);
                                }}
                            >
                                <div className="grid grid-rows-[auto_auto] gap-y-2">
                                    <div className="flex justify-start items-center gap-[10px]">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                                            {formatInvoiceID(inv.invoiceID)}
                                            <button
                                                className="focus:outline-none"
                                                disabled={selectionMode}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleInvoiceFavorite(inv._id! || inv.invoiceLocalId!);
                                                }}
                                            >
                                                <Heart
                                                    className={`w-[18px] h-[18px] stroke-[2] transition-colors ${selectionMode
                                                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                                        : inv.isHeart
                                                            ? "text-red-500 fill-red-500"
                                                            : "text-gray-500 hover:text-orange-500"
                                                        }`}
                                                />
                                            </button>
                                        </h2>
                                        <span className="text-orange-600 font-semibold">₹{inv.total}</span>
                                    </div>

                                    <div className="px-2 py-2 text-gray-700 dark:text-gray-300 bg-orange-50/40 dark:bg-orange-950/20 rounded-md text-sm">
                                        {/* You can show customers if you saved them in invoice */}
                                        {inv.customers?.map((cust: any) => cust.name).join(", ") ||
                                            "No customer"}
                                    </div>
                                </div>

                                <div className="flex flex-row gap-1.5 justify-center items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePreview(inv);
                                        }}
                                        disabled={selectionMode}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectionMode
                                            ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                            : "text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                            }`}
                                        title="Preview"
                                    >
                                        <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShare(inv);
                                        }}
                                        disabled={selectionMode}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectionMode
                                            ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                            : "text-gray-600 dark:text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                            }`}
                                        title="Share"
                                    >
                                        <Link2 className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(inv);
                                        }}
                                        disabled={selectionMode}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectionMode
                                            ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                            : "text-gray-600 dark:text-gray-300 hover:text-[#FF5722] hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                            }`}
                                        title="Edit"
                                    >
                                        <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadPDF(inv);
                                        }}
                                        disabled={selectionMode}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectionMode
                                            ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                            : "text-gray-600 dark:text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                            }`}
                                        title="Download PDF"
                                    >
                                        <Download className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget(inv);
                                            setShowConfirm(true);
                                        }}
                                        disabled={selectionMode}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectionMode
                                            ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                            : "text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            }`}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                    </button>

                                    {selectionMode && (
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoiceIds.includes(inv._id! || inv.invoiceLocalId!)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleSelect(inv)}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Desktop invoice view */}
            <div className="hidden md:block max-w-[1600px] mx-auto w-full text-sm px-4 sm:px-6 mt-4">
                {loading || invoices === null ? (
                    <div className="flex items-center justify-center h-[60vh] w-full">
                        <OrangeSpinner size={40} />
                    </div>
                ) : displayedInvoices.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-[60vh] text-center ${isDarkMode ? "bg-[#16181E] border border-white/[0.08]" : "bg-gradient-to-br from-orange-50 to-white"} rounded-2xl shadow-inner`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/empty-icon.png"
                            alt="No invoices"
                            className="w-36 h-36 mb-4 opacity-70"
                        />
                        <div className="space-y-1">
                            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} text-lg font-semibold`}>
                                No invoices found for the selected Financial Year
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={`rounded-2xl border ${isDarkMode ? "border-white/[0.08] bg-[#16181E]" : "border-gray-200 bg-white"} overflow-y-auto max-h-[70vh] hide-scrollbar shadow-2xl transition-colors`}>
                        <table className="w-full table-fixed border-collapse">
                            <thead className={`${isDarkMode ? "bg-[#14161E] border-white/[0.08] text-[#94A3B8]" : "bg-gray-50 border-gray-200 text-gray-600"} border-b sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider`}>
                                <tr>
                                    <th className="px-5 py-4 w-8">
                                        <input
                                            type="checkbox"
                                            checked={displayedInvoices.length > 0 && selectedInvoiceIds.length === displayedInvoices.length}
                                            onChange={selectAll}
                                            className="accent-orange-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-5 py-4 w-40 text-left">Invoice ID</th>
                                    <th className="px-5 py-4 w-64 text-left">Customer Name</th>
                                    <th className="px-5 py-4 w-32 text-center">Total</th>
                                    <th className="px-5 py-4 w-40 text-center">Created At</th>
                                    <th className="px-5 py-4 w-36 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedInvoices.map((inv, i) => (
                                    <tr
                                        key={inv._id || `invoice-${i}`}
                                        onClick={() => {
                                            if (selectedInvoiceIds.length > 0)
                                                toggleSelect(inv);
                                            else
                                                handlePreview(inv);
                                        }}
                                        className={`border-b ${isDarkMode ? "border-white/[0.05]" : "border-gray-100"} transition-colors ${
                                            i % 2 === 0
                                                ? isDarkMode ? "bg-[#16181E]" : "bg-white"
                                                : isDarkMode ? "bg-[#13151B]" : "bg-gray-50"
                                        } ${isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-gray-100"} cursor-pointer`}
                                        style={{ height: "60px" }}
                                    >
                                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoiceIds.includes(inv._id! || inv.invoiceLocalId!)}
                                                onChange={() => toggleSelect(inv)}
                                                className="accent-orange-500 cursor-pointer"
                                            />
                                        </td>

                                        <td className={`px-5 py-3 flex items-center gap-2 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                            <button
                                                className="focus:outline-none"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleInvoiceFavorite(inv._id! || inv.invoiceLocalId!);
                                                }}
                                                disabled={selectedInvoiceIds.length > 0}
                                                title={inv.isHeart ? "Remove from favorites" : "Add to favorites"}
                                            >
                                                <Heart
                                                    className={`w-[18px] h-[18px] stroke-[2] transition-colors ${inv.isHeart
                                                        ? "text-red-500 fill-red-500"
                                                        : isDarkMode ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-400"
                                                        }`}
                                                />
                                            </button>
                                            <span className="font-semibold text-xs sm:text-sm">
                                                {formatInvoiceID(inv.invoiceID)}
                                            </span>
                                        </td>

                                        <td className={`px-5 py-3 text-xs sm:text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            {inv.customers?.map((cust: any) => cust.name).join(", ") || "No customer"}
                                        </td>

                                        <td className="px-5 py-3 font-bold text-[#FF5722] text-center text-xs sm:text-sm">
                                            ₹{inv.total}
                                        </td>

                                        <td className={`px-5 py-3 text-center text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                            {new Date(inv.createdAt).toLocaleDateString("en-US")}
                                        </td>

                                        <td className="px-5 py-3 flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={(e) => (e.stopPropagation(), handlePreview(inv))}
                                                disabled={selectedInvoiceIds.length > 0}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectedInvoiceIds.length > 0
                                                    ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                                    : isDarkMode ? "text-gray-300 hover:text-blue-400 hover:bg-blue-950/30" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                    }`}
                                                title="Preview Invoice"
                                            >
                                                <Eye className="w-[18px] h-[18px] stroke-[2]" />
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShare(inv);
                                                }}
                                                disabled={selectedInvoiceIds.length > 0}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectedInvoiceIds.length > 0
                                                    ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                                    : isDarkMode ? "text-gray-300 hover:text-emerald-400 hover:bg-emerald-950/30" : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                                                    }`}
                                                title="Copy Preview Link"
                                            >
                                                <Link2 className="w-[18px] h-[18px] stroke-[2]" />
                                            </button>

                                            <button
                                                onClick={(e) => (e.stopPropagation(), handleEdit(inv))}
                                                disabled={selectedInvoiceIds.length > 0}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectedInvoiceIds.length > 0
                                                    ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                                    : isDarkMode ? "text-gray-300 hover:text-[#FF5722] hover:bg-orange-950/30" : "text-gray-600 hover:text-[#FF5722] hover:bg-orange-50"
                                                    }`}
                                                title="Edit Invoice"
                                            >
                                                <Pencil className="w-[18px] h-[18px] stroke-[2]" />
                                            </button>

                                            <button
                                                onClick={(e) => (e.stopPropagation(), handleDownloadPDF(inv))}
                                                disabled={selectedInvoiceIds.length > 0}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectedInvoiceIds.length > 0
                                                    ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                                    : isDarkMode ? "text-gray-300 hover:text-indigo-400 hover:bg-indigo-950/30" : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                    }`}
                                                title="Download PDF"
                                            >
                                                <Download className="w-[18px] h-[18px] stroke-[2]" />
                                            </button>

                                            <button
                                                onClick={(e) => (e.stopPropagation(), setDeleteTarget(inv), setShowConfirm(true))}
                                                disabled={selectedInvoiceIds.length > 0}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${selectedInvoiceIds.length > 0
                                                    ? "text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed"
                                                    : isDarkMode ? "text-gray-300 hover:text-red-400 hover:bg-red-950/30" : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                    }`}
                                                title="Delete Invoice"
                                            >
                                                <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className={`py-4 flex justify-center items-center gap-2 text-sm ${isDarkMode ? "bg-[#16181E] border-white/[0.08] text-white" : "bg-white border-gray-200 text-gray-800"} border-t z-20 overflow-x-auto shadow-md transition-colors mt-auto`}>

                    {/* Previous Button */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${isDarkMode ? "bg-[#1B1E26] text-gray-300" : "bg-gray-100 text-gray-700"} hover:bg-orange-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow cursor-pointer`}
                        title="Previous page"
                    >
                        <ChevronLeft className="w-[18px] h-[18px] stroke-[2]" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) =>
                        <button
                            key={pageNum}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full font-semibold shadow transition cursor-pointer
            ${pageNum === currentPage ? 'bg-orange-500 text-white' : isDarkMode ? 'bg-[#1B1E26] text-gray-300 hover:bg-orange-500 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white'}`}
                            onClick={() => handlePageChange(pageNum)}
                        >
                            {pageNum}
                        </button>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full ${isDarkMode ? "bg-[#1B1E26] text-gray-300" : "bg-gray-100 text-gray-700"} hover:bg-orange-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow cursor-pointer`}
                        title="Next page"
                    >
                        <ChevronRight className="w-[18px] h-[18px] stroke-[2]" />
                    </button>
                </div>
            )}

            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
                <ConfirmationPopUp
                    message={
                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {selectedInvoiceIds.length > 0
                                    ? invoices
                                        ?.filter(inv => selectedInvoiceIds.includes(inv._id!))
                                        .map(inv => inv.invoiceID)
                                        .join(", ") || ""
                                    : deleteTarget?.invoiceID || "this invoice"}
                            </strong>
                            ?
                        </p>
                    }
                    onYes={confirmDelete}
                    onNo={() => setShowConfirm(false)}
                />
            </Modal>
            <Modal isOpen={isFilterVisible} onClose={() => setFilterVisible(false)}>
                <FilterPanel
                    filters={filters}
                    onApply={(newFilters: Filters) => {
                        setFilters(newFilters);
                        fetchInvoices(newFilters, selectedCompany, 1, searchQuery);
                    }}
                    onReset={() => {
                        const resetFilters: Filters = {
                            minPrice: "",
                            maxPrice: "",
                            startDate: "",
                            endDate: "",
                            sortOption: "",
                            favoritesOnly: false,
                            allCompanies: false,
                        };
                        setFilters(resetFilters);
                        fetchInvoices(resetFilters, selectedCompany, 1, searchQuery);
                    }}
                    onClose={() => setFilterVisible(false)}
                />
            </Modal>

            {/* In-page Add Company / Customer Modal */}
            <Modal isOpen={showAddCompanyModal} onClose={() => setShowAddCompanyModal(false)}>
                <AddCompanyModal
                    flag={modalFlag}
                    closeModal={() => setShowAddCompanyModal(false)}
                    refreshCompanies={async () => {
                        await getCompanies();
                        fetchInvoices();
                    }}
                    onCompanyCreated={(newCompany) => {
                        if (modalFlag === "vendor" && newCompany?._id) {
                            handleCompanyChange(newCompany._id);
                        } else {
                            fetchInvoices();
                        }
                    }}
                />
            </Modal>

            {/* Consolidated Month-wise HSN Summary Modal */}
            {showHsnSummaryModal && (() => {
                const { monthOptions, hsnList, totalTaxable, totalCGST, totalSGST, totalIGST, totalTaxSum } = calculateConsolidatedHsn();
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-none print:max-h-none print:inset-0 print:absolute print:rounded-none">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-orange-50 print:bg-white print:border-b-2 print:border-gray-800">
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5 text-orange-600 print:hidden" />
                                        Consolidated Month-wise HSN/SAC Tax Summary
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5 print:hidden">
                                        Aggregated tax breakdown for all invoices across selected month ({currentFYLabel})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowHsnSummaryModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition print:hidden"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filters & Actions Bar */}
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-700">Select Month:</label>
                                    <select
                                        value={selectedHsnMonth}
                                        onChange={(e) => setSelectedHsnMonth(e.target.value)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-400"
                                    >
                                        <option value="ALL">All Months ({currentFYLabel})</option>
                                        {monthOptions.map((m) => (
                                            <option key={m.key} value={m.key}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintHsnSummary}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition shadow-sm cursor-pointer"
                                        title="Print or Save as PDF"
                                    >
                                        <Printer className="w-[18px] h-[18px] stroke-[2] text-gray-600" />
                                        Print / PDF
                                    </button>

                                    <button
                                        onClick={handleDownloadHsnCSV}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md transition shadow-sm cursor-pointer"
                                        title="Download CSV file"
                                    >
                                        <Download className="w-[18px] h-[18px] stroke-[2]" />
                                        Download CSV
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content / Table */}
                            <div className="p-5 overflow-y-auto max-h-[60vh] print:max-h-none print:overflow-visible">
                                {hsnList.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500">
                                        <p className="font-semibold text-base">No HSN data found for the selected period</p>
                                        <p className="text-xs mt-1">Invoices in this period do not contain registered HSN items.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto print:overflow-visible">
                                        <table className="w-full text-xs border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-800 font-semibold text-center border-b border-gray-300">
                                                    <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-center align-middle">HSN/SAC</th>
                                                    <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-right align-middle">Taxable Value (₹)</th>
                                                    <th colSpan={2} className="border border-gray-300 px-3 py-1.5 text-center">Central Tax (CGST)</th>
                                                    <th colSpan={2} className="border border-gray-300 px-3 py-1.5 text-center">State Tax (SGST)</th>
                                                    <th colSpan={2} className="border border-gray-300 px-3 py-1.5 text-center">Integrated Tax (IGST)</th>
                                                    <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-right align-middle">Total Tax Amount (₹)</th>
                                                </tr>
                                                <tr className="bg-gray-100 text-gray-800 font-semibold text-center border-b border-gray-300">
                                                    <th className="border border-gray-300 px-2 py-1 text-center">Rate</th>
                                                    <th className="border border-gray-300 px-2 py-1 text-right">Amount (₹)</th>
                                                    <th className="border border-gray-300 px-2 py-1 text-center">Rate</th>
                                                    <th className="border border-gray-300 px-2 py-1 text-right">Amount (₹)</th>
                                                    <th className="border border-gray-300 px-2 py-1 text-center">Rate</th>
                                                    <th className="border border-gray-300 px-2 py-1 text-right">Amount (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {hsnList.map((row, idx) => (
                                                    <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                                        <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">{row.hsn}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right font-medium">₹{row.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center">{row.centralTaxRate ? `${row.centralTaxRate}%` : "—"}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right">₹{row.centralTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center">{row.stateTaxRate ? `${row.stateTaxRate}%` : "—"}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right">₹{row.stateTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center">{row.igstRate ? `${row.igstRate}%` : "—"}</td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right">₹{row.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-900">₹{row.totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-orange-100 font-extrabold border-t-2 border-orange-500 text-orange-950">
                                                    <td className="border border-gray-300 px-3 py-2 text-center uppercase tracking-wider">Total</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right">₹{totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center">—</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-right">₹{totalCGST.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center">—</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-right">₹{totalSGST.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center">—</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-right">₹{totalIGST.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right text-base text-orange-700">₹{totalTaxSum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default Invoice;