"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@utilis/apiClient";
import { Info } from "lucide-react";
import { toast } from "react-toastify";
import { Company, AddProductModalProps } from "@app-types/AddProductModal";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import { UNIT_OPTIONS } from "@constants/unitOptions";
import { fetchGstOptions, GST_OPTIONS_DEFAULT } from "@constants/gstOptions";
import { API_ENDPOINTS } from "@constants/api";

interface FormState {
    name: string;
    price: string;
    qty: string;
    unit: string;
    gst: string;
    hsn: string;
    companyId: string;
    dealers: string;
    description: string;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
    onClose,
    onProductAdded,
    product,
    defaultCompanyId,
    companies: propCompanies,
    isDark: propIsDark,
}) => {
    // Theme reactivity: sync from prop, localStorage, documentElement class, or themechange event
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof propIsDark === "boolean") return propIsDark;
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) return saved === "dark";
            return document.documentElement.classList.contains("dark");
        }
        return true;
    });

    useEffect(() => {
        if (typeof propIsDark === "boolean") {
            setIsDarkMode(propIsDark);
        }
    }, [propIsDark]);

    useEffect(() => {
        const handleThemeSync = () => {
            const saved = localStorage.getItem("spa_theme") || localStorage.getItem("poster_theme");
            if (saved) {
                setIsDarkMode(saved === "dark");
            } else {
                setIsDarkMode(document.documentElement.classList.contains("dark"));
            }
        };

        window.addEventListener("themechange", handleThemeSync);
        window.addEventListener("storage", handleThemeSync);

        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => {
            window.removeEventListener("themechange", handleThemeSync);
            window.removeEventListener("storage", handleThemeSync);
            observer.disconnect();
        };
    }, []);

    const [form, setForm] = useState<FormState>({
        name: "",
        price: "",
        qty: "",
        unit: "",
        gst: "",
        hsn: "",
        companyId: defaultCompanyId || "",
        dealers: "",
        description: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const [mode, setMode] = useState<"Single" | "csv">("Single");
    const [showTooltip, setShowTooltip] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [gstOptions, setGstOptions] = useState<number[]>(GST_OPTIONS_DEFAULT);
    const [companies, setCompanies] = useState<Company[]>(propCompanies || []);
    const [loading, setLoading] = useState(false);

    // Fetch GST Options from backend or defaults
    useEffect(() => {
        fetchGstOptions().then((opts) => {
            if (Array.isArray(opts) && opts.length > 0) {
                setGstOptions(opts);
            }
        });
    }, []);

    // Sync companies from prop or fetch if not provided
    useEffect(() => {
        if (propCompanies && propCompanies.length > 0) {
            setCompanies(propCompanies);
            return;
        }

        const getCompanies = async () => {
            const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
            const token = localStorage.getItem("token");
            if (!token || !userId) {
                const localData = localStorage.getItem("vendor_companies");
                setCompanies(localData ? JSON.parse(localData) : []);
                return;
            }

            try {
                const res = await apiClient.get(
                    API_ENDPOINTS.COMPANIES.GET_COMPANY_BY_USER_ID(userId),
                    { params: { flag: "vendor" } }
                );
                setCompanies(res.data.company || []);
            } catch {
                safeToastError("Failed to fetch companies");
            }
        };

        getCompanies();
    }, [propCompanies]);

    // Initialize or sync form when product or defaultCompanyId changes
    useEffect(() => {
        if (product) {
            setForm({
                name: product.name || "",
                price: product.price !== undefined && product.price !== null ? String(product.price) : "",
                qty: product.qty !== undefined && product.qty !== null ? String(product.qty) : "",
                unit: product.unit || "",
                gst: product.gst !== undefined && product.gst !== null ? String(product.gst) : "",
                hsn: product.hsn || "",
                companyId: product.companyId || defaultCompanyId || "",
                description: product.description || "",
                dealers: product.dealers || "",
            });
        } else {
            setForm((prev) => {
                const initialCompany =
                    defaultCompanyId ||
                    prev.companyId ||
                    (companies.length === 1 ? companies[0]._id : "");
                return {
                    ...prev,
                    companyId: initialCompany,
                };
            });
        }
    }, [product, defaultCompanyId, companies]);

    // Validation rule per field
    const validateSingleField = (field: keyof FormState, value: string): string => {
        switch (field) {
            case "companyId": {
                if (!product && (!value || !value.trim())) {
                    return "Please select a company";
                }
                if (value && !/^[0-9a-fA-F]{24}$/.test(value.trim())) {
                    return "Please select a valid company";
                }
                return "";
            }

            case "name": {
                if (!value || !value.trim()) {
                    return "Product name is required";
                }
                return "";
            }

            case "price": {
                const trimmed = value.trim();
                if (!trimmed) {
                    return "Price is required";
                }
                const num = Number(trimmed);
                if (isNaN(num) || num <= 0) {
                    return "Price must be a valid positive number";
                }
                if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
                    return "Price cannot have more than 2 decimal places";
                }
                return "";
            }

            case "qty": {
                const trimmed = value.trim();
                if (!trimmed) {
                    return "Quantity is required";
                }
                const num = Number(trimmed);
                if (isNaN(num) || num <= 0) {
                    return "Quantity must be greater than 0";
                }
                if (!/^\d+(\.\d+)?$/.test(trimmed)) {
                    return "Quantity must be a valid positive number";
                }
                return "";
            }

            case "gst": {
                const trimmed = value.trim();
                if (trimmed !== "") {
                    const num = Number(trimmed);
                    if (isNaN(num) || !gstOptions.includes(num)) {
                        return "Please select a valid GST rate";
                    }
                }
                return "";
            }

            case "hsn": {
                const trimmed = value.trim();
                if (trimmed !== "") {
                    if (!/^\d{2,8}$/.test(trimmed)) {
                        return "HSN code must be 2 to 8 digits";
                    }
                }
                return "";
            }

            case "dealers": {
                const trimmed = value.trim();
                if (trimmed.length > 50) {
                    return "Dealer name cannot exceed 50 characters";
                }
                return "";
            }

            default:
                return "";
        }
    };

    const handleChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        // Clear error immediately as soon as user corrects input
        const fieldError = validateSingleField(field, value);
        setErrors((prev) => {
            if (!fieldError) {
                if (!prev[field]) return prev;
                const next = { ...prev };
                delete next[field];
                return next;
            }
            if (touched[field]) {
                return { ...prev, [field]: fieldError };
            }
            return prev;
        });
    };

    const handleBlur = (field: keyof FormState) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const fieldError = validateSingleField(field, form[field]);
        setErrors((prev) => {
            if (fieldError) {
                return { ...prev, [field]: fieldError };
            }
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validateAll = (): boolean => {
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        const fieldsToValidate: (keyof FormState)[] = [
            "name",
            "price",
            "qty",
            "gst",
            "hsn",
            "dealers",
        ];

        if (!product) {
            fieldsToValidate.unshift("companyId");
        }

        for (const field of fieldsToValidate) {
            newTouched[field] = true;
            const err = validateSingleField(field, form[field]);
            if (err) {
                newErrors[field] = err;
            }
        }

        setTouched((prev) => ({ ...prev, ...newTouched }));
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleFileUpload = async () => {
        if (loading) return;

        if (!form.companyId) {
            setTouched((prev) => ({ ...prev, companyId: true }));
            setErrors((prev) => ({ ...prev, companyId: "Please select a company before uploading" }));
            safeToastError("Please select a company before uploading");
            return;
        }

        if (!file) {
            safeToastError("Please select a file to upload");
            return;
        }

        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            safeToastError("Login required to upload products");
            return;
        }

        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        try {
            setLoading(true);
            const formDataToSend = new FormData();
            formDataToSend.append("file", file);

            let url = "";

            if (fileExtension === "csv" || fileExtension === "xlsx" || fileExtension === "xls") {
                formDataToSend.append("company_id", form.companyId);
                url = API_ENDPOINTS.PRODUCTS.BULK_UPLOAD(userId);
            } else if (fileExtension === "pdf") {
                formDataToSend.append("company_id", form.companyId);
                formDataToSend.append("user_id", userId);
                url = API_ENDPOINTS.PRODUCTS.EXTRACT_PDF;
            } else {
                safeToastError("Invalid file type. Please upload CSV, Excel, or PDF.");
                setLoading(false);
                return;
            }

            const res = await apiClient.post(url, formDataToSend, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            safeToastSuccess(res.data.message || "Products uploaded successfully");
            onProductAdded?.();
            onClose();
        } catch (err: any) {
            safeToastError(err.response?.data?.message || err.message || "Failed to upload file");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (loading) return;

        if (!validateAll()) {
            safeToastError("Please fix the highlighted errors before saving");
            return;
        }

        const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
            safeToastError("Login required to save product");
            return;
        }

        const payload = {
            companyId: form.companyId,
            name: form.name.trim(),
            price: Number(form.price),
            qty: Number(form.qty),
            unit: form.unit.trim(),
            gst: form.gst !== "" ? Number(form.gst) : 0,
            hsn: form.hsn.trim(),
            dealers: form.dealers.trim(),
            description: form.description.trim(),
            userId,
        };

        try {
            setLoading(true);
            let savedProductData: any = null;
            if (product?._id) {
                // Update existing product
                const res = await apiClient.post(
                    API_ENDPOINTS.PRODUCTS.UPDATE(product._id),
                    payload
                );
                savedProductData = res.data?.product;
                safeToastSuccess(res.data?.message || "Product updated successfully");
            } else {
                // Create new product
                const res = await apiClient.post(
                    API_ENDPOINTS.PRODUCTS.CREATE(userId),
                    payload
                );
                savedProductData = res.data?.product;
                safeToastSuccess(res.data?.message || "Product added successfully");
            }

            onProductAdded?.(savedProductData);
            onClose();
        } catch (err: any) {
            safeToastError(err.response?.data?.message || err.message || "Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    // Theme Tokens
    const cardBgClass = isDarkMode
        ? "bg-[#141414] text-white border-[rgba(255,255,255,0.10)]"
        : "bg-white text-gray-900 border-gray-200 shadow-2xl";

    const labelClass = isDarkMode
        ? "text-xs sm:text-sm font-medium text-gray-200 mb-1.5 block"
        : "text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block";

    const titleClass = isDarkMode
        ? "text-base sm:text-lg font-semibold text-white"
        : "text-base sm:text-lg font-semibold text-gray-900";

    const subtitleClass = isDarkMode
        ? "text-xs text-gray-400 mt-0.5"
        : "text-xs text-gray-500 mt-0.5";

    const closeBtnClass = isDarkMode
        ? "text-gray-400 hover:text-white hover:bg-white/[0.08]"
        : "text-gray-400 hover:text-gray-700 hover:bg-gray-100";

    const getInputClass = (fieldName: keyof FormState) => {
        const hasError = !!errors[fieldName];
        if (hasError) {
            return `w-full h-10 px-3.5 text-xs sm:text-sm rounded-lg outline-none transition-all text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border ${
                isDarkMode
                    ? "bg-[#1A1A1D] text-white placeholder:text-gray-500 border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "bg-[#F8F9FC] text-gray-900 placeholder:text-gray-400 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            }`;
        }
        return `w-full h-10 px-3.5 text-xs sm:text-sm rounded-lg outline-none transition-all text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border ${
            isDarkMode
                ? "bg-[#1A1A1D] text-white placeholder:text-gray-500 border-[rgba(255,255,255,0.10)] focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/30"
                : "bg-[#F8F9FC] text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20"
        }`;
    };

    const selectOptionClass = isDarkMode
        ? "bg-[#141414] text-white"
        : "bg-white text-gray-900";

    const selectOptionMutedClass = isDarkMode
        ? "bg-[#141414] text-gray-400"
        : "bg-white text-gray-500";

    const tabInactiveClass = isDarkMode
        ? "bg-[#1E1E22] text-gray-400 hover:text-white border border-[rgba(255,255,255,0.08)]"
        : "bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-200/60";

    const dividerClass = isDarkMode
        ? "border-[rgba(255,255,255,0.08)]"
        : "border-gray-200";

    const cancelBtnClass = isDarkMode
        ? "border-[rgba(255,255,255,0.12)] text-gray-300 hover:bg-white/[0.06] hover:text-white"
        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900";

    const fileChipClass = isDarkMode
        ? "bg-[#18181A] border-[rgba(255,255,255,0.08)] text-gray-200"
        : "bg-gray-100 border-gray-200 text-gray-800";

    const bulkTextClass = isDarkMode ? "text-gray-400" : "text-gray-600";
    const bulkStrongClass = isDarkMode ? "text-gray-200" : "text-gray-900";

    const tooltipCardClass = isDarkMode
        ? "bg-[#171719] border-[rgba(255,255,255,0.12)] text-gray-200"
        : "bg-white border-gray-200 text-gray-700 shadow-xl";

    const tooltipBorderClass = isDarkMode
        ? "border-[rgba(255,255,255,0.08)]"
        : "border-gray-100";

    const renderFieldError = (fieldName: keyof FormState) => {
        if (!errors[fieldName]) return null;
        return (
            <p className="text-red-500 text-[11px] sm:text-xs mt-1.5 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{errors[fieldName]}</span>
            </p>
        );
    };

    return (
        <div className={`border rounded-2xl w-full max-w-lg p-5 sm:p-6 max-h-[88vh] overflow-y-auto shadow-2xl relative hide-scrollbar transition-colors duration-200 ${cardBgClass}`}>
            <style>{`
                /* Ensure cross-browser removal of number spinner arrows */
                input[type=number]::-webkit-outer-spin-button,
                input[type=number]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                    appearance: textfield;
                }
            `}</style>

            {/* Close Icon Button */}
            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-lg font-bold disabled:opacity-40 ${closeBtnClass}`}
                title="Close"
            >
                ✕
            </button>

            {/* Header Title */}
            <div className="mb-4 pr-8">
                <h3 className={titleClass}>
                    {product?._id ? "Edit Product" : "Add Product"}
                </h3>
                <p className={subtitleClass}>
                    {product?._id
                        ? "Update product details in your warehouse"
                        : "Enter product details to add to your warehouse"}
                </p>
            </div>

            {/* Mode Toggle - hide in edit mode */}
            {!product && (
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                            mode === "Single"
                                ? "bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white shadow-[0_2px_8px_rgba(255,87,34,0.3)] font-bold active:scale-95"
                                : tabInactiveClass
                        }`}
                        onClick={() => setMode("Single")}
                    >
                        Single
                    </button>
                    <button
                        type="button"
                        className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                            mode === "csv"
                                ? "bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white shadow-[0_2px_8px_rgba(255,87,34,0.3)] font-bold active:scale-95"
                                : tabInactiveClass
                        }`}
                        onClick={() => setMode("csv")}
                    >
                        Bulk
                    </button>
                </div>
            )}

            {/* Company Selection */}
            {!product && (
                <div className="mb-3.5">
                    <label className={labelClass}>
                        Company<span className="text-[#FF5722] ml-0.5">*</span>
                    </label>
                    <select
                        value={form.companyId}
                        onChange={(e) => handleChange("companyId", e.target.value)}
                        onBlur={() => handleBlur("companyId")}
                        className={`${getInputClass("companyId")} cursor-pointer`}
                    >
                        <option value="" className={selectOptionMutedClass}>
                            Select Company
                        </option>
                        {companies.map((c) => (
                            <option key={c._id} value={c._id} className={selectOptionClass}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {renderFieldError("companyId")}
                </div>
            )}

            {/* Single Entry Form */}
            {mode === "Single" && (
                <div className="flex flex-col gap-3.5">
                    {/* Product Name* */}
                    <div>
                        <label className={labelClass}>
                            Product Name<span className="text-[#FF5722] ml-0.5">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter product name"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            onBlur={() => handleBlur("name")}
                            className={getInputClass("name")}
                        />
                        {renderFieldError("name")}
                    </div>

                    {/* Price* */}
                    <div>
                        <label className={labelClass}>
                            Price<span className="text-[#FF5722] ml-0.5">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            onBlur={() => handleBlur("price")}
                            onWheel={(e) => e.currentTarget.blur()}
                            className={getInputClass("price")}
                        />
                        {renderFieldError("price")}
                    </div>

                    {/* Quantity* & Unit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClass}>
                                Quantity<span className="text-[#FF5722] ml-0.5">*</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="e.g. 10 or 1.5"
                                value={form.qty}
                                onChange={(e) => handleChange("qty", e.target.value)}
                                onBlur={() => handleBlur("qty")}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={getInputClass("qty")}
                            />
                            {renderFieldError("qty")}
                        </div>
                        <div>
                            <label className={labelClass}>Unit</label>
                            <input
                                type="text"
                                list="unit-options"
                                placeholder="Select or type unit"
                                value={form.unit}
                                onChange={(e) => handleChange("unit", e.target.value)}
                                className={getInputClass("unit")}
                            />
                            <datalist id="unit-options">
                                {UNIT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} ({opt.value})
                                    </option>
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* GST % & HSN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className={labelClass}>GST %</label>
                            <select
                                value={form.gst}
                                onChange={(e) => handleChange("gst", e.target.value)}
                                onBlur={() => handleBlur("gst")}
                                className={`${getInputClass("gst")} cursor-pointer`}
                            >
                                <option value="" className={selectOptionMutedClass}>
                                    Select GST (Optional)
                                </option>
                                {gstOptions.map((g) => (
                                    <option key={g} value={String(g)} className={selectOptionClass}>
                                        {g}%
                                    </option>
                                ))}
                            </select>
                            {renderFieldError("gst")}
                        </div>
                        <div>
                            <label className={labelClass}>HSN Code</label>
                            <input
                                type="text"
                                placeholder="e.g. 84713010"
                                maxLength={8}
                                value={form.hsn}
                                onChange={(e) => handleChange("hsn", e.target.value)}
                                onBlur={() => handleBlur("hsn")}
                                className={getInputClass("hsn")}
                            />
                            {renderFieldError("hsn")}
                        </div>
                    </div>

                    {/* Dealers */}
                    <div>
                        <label className={labelClass}>Dealers</label>
                        <input
                            type="text"
                            placeholder="Enter dealer name (optional)"
                            value={form.dealers}
                            maxLength={50}
                            onChange={(e) => handleChange("dealers", e.target.value)}
                            onBlur={() => handleBlur("dealers")}
                            className={getInputClass("dealers")}
                        />
                        {renderFieldError("dealers")}
                    </div>
                </div>
            )}

            {/* Bulk Upload Mode */}
            {mode === "csv" && (
                <div className="flex flex-col gap-3 py-1">
                    <div className="relative flex items-center gap-2.5">
                        <label
                            htmlFor="csv-upload"
                            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white rounded-lg cursor-pointer active:scale-95 transition-all text-xs md:text-sm font-semibold shadow-[0_2px_8px_rgba(255,87,34,0.25)] hover:shadow-[0_4px_12px_rgba(255,87,34,0.35)]"
                        >
                            Choose File
                        </label>

                        {/* Info Icon + Tooltip */}
                        <div
                            className="relative inline-block"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                setShowTooltip(!showTooltip);
                            }}
                        >
                            <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-[#FF5722] transition" />

                            {showTooltip && (
                                <div
                                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 border rounded-xl shadow-2xl p-3 w-[260px] leading-snug break-words text-[11px] ${tooltipCardClass}`}
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <div className="mb-1.5">
                                        <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Expected Format:</p>
                                    </div>

                                    <div className="mb-1.5">
                                        <p className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Columns:</p>
                                        <code className="text-[#FF5722] font-mono text-[10px] break-words block mt-0.5">
                                            name, price, quantity, unit, gst, hsn, dealers
                                        </code>
                                    </div>

                                    <div className={`mb-2 border-t ${tooltipBorderClass} pt-1.5`}>
                                        <p className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Example:</p>
                                        <code className={`break-words ${isDarkMode ? "text-gray-400" : "text-gray-600"} font-mono text-[10px] block mt-0.5`}>
                                            Apple, 50, 10, kg, 5, 08081010, Krishub Store
                                        </code>
                                    </div>

                                    <div className={`border-t ${tooltipBorderClass} pt-1.5 text-right`}>
                                        <a
                                            href="/sample-products.csv"
                                            download
                                            className="text-[#FF5722] hover:underline text-[10px] font-medium"
                                        >
                                            Download sample
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv, .xlsx, .xls, .pdf"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                setFile(e.target.files[0]);
                                toast.info(`Selected file: ${e.target.files[0].name}`);
                            }
                        }}
                    />

                    {file && (
                        <div className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${fileChipClass}`}>
                            <span className="truncate max-w-[85%]">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                                className="text-gray-400 hover:text-red-500 text-xs ml-2"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <p className={`${bulkTextClass} text-xs leading-relaxed`}>
                        Upload a <strong className={bulkStrongClass}>CSV</strong>, <strong className={bulkStrongClass}>Excel</strong>, or <strong className={bulkStrongClass}>PDF</strong> file with product details.
                        <br />
                        <span className={`${isDarkMode ? "text-gray-500" : "text-gray-400"} text-[11px]`}>
                            (PDFs are parsed with AI. Select a company before upload.)
                        </span>
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`flex gap-3 justify-end mt-6 pt-3 border-t ${dividerClass}`}>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className={`px-4 py-2 border rounded-lg text-xs md:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${cancelBtnClass}`}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={mode === "Single" ? handleSave : handleFileUpload}
                    disabled={loading}
                    className={`px-5 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF6B00] hover:from-[#FF7043] hover:to-[#FF5722] text-white rounded-xl text-xs md:text-sm font-bold active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.45)] cursor-pointer flex items-center justify-center gap-2 min-w-[130px] ${
                        loading ? "opacity-60 cursor-not-allowed shadow-none" : ""
                    }`}
                >
                    {loading && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {loading
                        ? mode === "Single"
                            ? product?._id
                                ? "Updating..."
                                : "Saving..."
                            : "Uploading..."
                        : mode === "Single"
                            ? product?._id
                                ? "Update Product"
                                : "Save Product"
                            : "Upload"}
                </button>
            </div>
        </div>
    );
};

export default AddProductModal;
