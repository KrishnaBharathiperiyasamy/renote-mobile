"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@utilis/apiClient";
import { handleAuthErrorAndToast } from "@utilis/catchhandle";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { validateLocalCompany } from "@utilis/company-validation";
import { PrimaryBtn, SecondaryBtn, inputClass } from "@components/Button";
import { API_ENDPOINTS } from "@constants/api";
import { getLogoUrl } from "@utilis/getLogoUrl";

export default function AddCompanyModal({
    existingCompany = null,
    refreshCompanies,
    flag = "vendor",
    closeModal,
    onCompanyCreated,
}: {
    existingCompany?: any;
    refreshCompanies?: () => void;
    flag?: "vendor" | "customer";
    closeModal: () => void;
    onCompanyCreated?: (company: any) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const isLoggedIn = !!userId && !!token;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isFetchingGst, setIsFetchingGst] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companyTypes] = useState([
        "Agriculture & Food Processing",
        "Construction & Real Estate",
        "Education & Training",
        "Energy & Utilities",
        "Events & Entertainment",
        "Finance & Insurance",
        "Healthcare & Medical",
        "Hospitality & Tourism",
        "IT & Software Services",
        "Manufacturing & Industrial",
        "Retail & Wholesale",
        "Transportation & Logistics",
    ]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [formData, setFormData] = useState({
        gstNo: "",
        panNo: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        companyType: "",
        description: "",
        upiId: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (existingCompany) {
            setSelectedFile(null);
            setFormData({
                gstNo: existingCompany.gstNo || "",
                panNo: existingCompany.panNo || "",
                name: existingCompany.name || "",
                phone: existingCompany.phone || "",
                email: existingCompany.email || "",
                address: existingCompany.address || "",
                city: existingCompany.city || "",
                state: existingCompany.state || "",
                zipCode: existingCompany.zipCode || "",
                companyType: existingCompany.companyType || "",
                description: existingCompany.description || "",
                upiId: existingCompany.upiId || "",
            });
            if (existingCompany.logo) {
                setPreviewUrl(getLogoUrl(existingCompany.logo));
            } else {
                setPreviewUrl(null);
            }
        } else {
            setFormData({
                gstNo: "",
                panNo: "",
                name: "",
                phone: "",
                email: "",
                address: "",
                city: "",
                state: "",
                zipCode: "",
                companyType: "",
                description: "",
                upiId: "",
            });
            setSelectedFile(null);
            setPreviewUrl(null);
        }
        setErrors({});
        setTouched({});
    }, [existingCompany]);

    const validateField = (fieldName: string, value: string, currentData = formData): string | null => {
        const val = (value || "").trim();
        switch (fieldName) {
            case "name":
                if (!val) return "Company name is required.";
                if (val.length < 2) return "Company name must be at least 2 characters.";
                if (val.length > 100) return "Company name cannot exceed 100 characters.";
                return null;
            case "phone":
                if (!val) return "Phone number is required.";
                if (!/^[6-9]\d{9}$/.test(val)) {
                    return "Enter a valid 10-digit mobile number.";
                }
                return null;
            case "email":
                if (!val) return null;
                if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
                    return "Enter a valid email address.";
                }
                return null;
            case "gstNo": {
                if (!val) return null;
                const upperGst = val.toUpperCase();
                const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                if (!gstRegex.test(upperGst)) {
                    return "Enter a valid GST number.";
                }
                const pan = (currentData.panNo || "").trim().toUpperCase();
                if (pan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan) && upperGst.slice(2, 12) !== pan) {
                    return "GST number does not match PAN.";
                }
                return null;
            }
            case "panNo": {
                if (flag !== "vendor" || !val) return null;
                const upperPan = val.toUpperCase();
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(upperPan)) {
                    return "Enter a valid PAN number.";
                }
                const gst = (currentData.gstNo || "").trim().toUpperCase();
                if (gst && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst) && gst.slice(2, 12) !== upperPan) {
                    return "PAN number does not match GST.";
                }
                return null;
            }
            case "upiId":
                if (flag !== "vendor" || !val) return null;
                if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val)) {
                    return "Enter a valid UPI ID.";
                }
                return null;
            case "companyType":
                if (!val || !companyTypes.includes(val)) return "Please select a category.";
                return null;
            case "city":
                if (!val) return "City is required.";
                if (!/^[a-zA-Z\s.'-]{2,50}$/.test(val)) {
                    return "Enter a valid city name.";
                }
                return null;
            case "state":
                if (!val) return null;
                if (!/^[a-zA-Z\s.'-]{2,50}$/.test(val)) {
                    return "Enter a valid state name.";
                }
                return null;
            case "zipCode":
                if (!val) return null;
                if (!/^[1-9][0-9]{5}$/.test(val)) {
                    return "Enter a valid ZIP code.";
                }
                return null;
            case "address":
                if (!val) return null;
                if (val.length > 300) return "Street address cannot exceed 300 characters.";
                return null;
            case "description":
                if (!val) return null;
                if (val.length > 500) return "About company cannot exceed 500 characters.";
                return null;
            default:
                return null;
        }
    };

    const validateAll = (): { isValid: boolean; newErrors: Record<string, string> } => {
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = [
            "name",
            "phone",
            "email",
            "gstNo",
            ...(flag === "vendor" ? ["panNo", "upiId"] : []),
            "companyType",
            "city",
            "state",
            "zipCode",
            "address",
            "description",
        ];

        fieldsToValidate.forEach((f) => {
            const err = validateField(f, (formData as any)[f], formData);
            if (err) newErrors[f] = err;
        });

        if (errors.logo) {
            newErrors.logo = errors.logo;
        }

        return {
            isValid: Object.keys(newErrors).length === 0,
            newErrors,
        };
    };

    const handleBlur = (fieldName: string, value: string) => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));
        const updated = { ...formData, [fieldName]: value };
        const err = validateField(fieldName, value, updated);
        setErrors((prev) => {
            const next = { ...prev };
            if (err) {
                next[fieldName] = err;
            } else {
                delete next[fieldName];
            }
            return next;
        });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);

        // If the field has been interacted with (touched), revalidate immediately
        if (touched[name]) {
            const err = validateField(name, value, updated);
            setErrors((prev) => {
                const next = { ...prev };
                if (err) {
                    next[name] = err;
                } else {
                    delete next[name];
                }
                return next;
            });
        }

        // Cross-revalidation for GST and PAN
        if (name === "panNo" && touched.gstNo) {
            const gstErr = validateField("gstNo", updated.gstNo, updated);
            setErrors((prev) => {
                const next = { ...prev };
                if (gstErr) next.gstNo = gstErr;
                else delete next.gstNo;
                return next;
            });
        }
        if (name === "gstNo" && touched.panNo) {
            const panErr = validateField("panNo", updated.panNo, updated);
            setErrors((prev) => {
                const next = { ...prev };
                if (panErr) next.panNo = panErr;
                else delete next.panNo;
                return next;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

        const isAllowed = allowedMimeTypes.includes(file.type) || allowedExtensions.includes(ext);
        if (!isAllowed) {
            const err = "Only JPEG, PNG, and WEBP images are allowed.";
            setErrors((prev) => ({ ...prev, logo: err }));
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            const err = "Logo file size must be less than 5MB.";
            setErrors((prev) => ({ ...prev, logo: err }));
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // File is valid
        setErrors((prev) => {
            const next = { ...prev };
            delete next.logo;
            return next;
        });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleViewClick = () => {
        if (previewUrl) {
            setShowImageModal(true);
        }
    };

    const validateGST = async () => {
        const rawGst = (formData.gstNo || "").trim().toUpperCase();
        if (!rawGst) {
            setTouched((prev) => ({ ...prev, gstNo: true }));
            setErrors((prev) => ({ ...prev, gstNo: "Enter a valid GST number." }));
            safeToastError("Please enter a GST number");
            return;
        }

        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(rawGst)) {
            setTouched((prev) => ({ ...prev, gstNo: true }));
            setErrors((prev) => ({ ...prev, gstNo: "Enter a valid GST number." }));
            safeToastError("Invalid GSTIN format");
            return;
        }

        const authUserId = localStorage.getItem("authId") || localStorage.getItem("user_id");
        const authToken = localStorage.getItem("token");

        if (!authUserId || !authToken) {
            safeToastError("You must be logged in to validate GST");
            return;
        }

        setIsFetchingGst(true);

        try {
            const response = await apiClient.get(
                API_ENDPOINTS.GST.GET_DETAILS_BY_GST_NO(rawGst)
            );
            const data = response.data;
            if (!data || data.error) {
                const errMsg = data?.error || "GST number not found or invalid";
                setTouched((prev) => ({ ...prev, gstNo: true }));
                setErrors((prev) => ({ ...prev, gstNo: errMsg }));
                safeToastError(errMsg);
                return;
            }

            const newName = data.tradeName || data.companyName || formData.name;
            const newAddress = data.address || formData.address;
            const newCity = data.city || formData.city;
            const newState = data.state || formData.state;
            const newZip = data.zipCode || formData.zipCode;
            const newDesc = data.aboutCompany || formData.description;

            setFormData((prev) => ({
                ...prev,
                gstNo: rawGst,
                name: newName,
                address: newAddress,
                city: newCity,
                state: newState,
                zipCode: newZip,
                description: newDesc,
            }));

            // Clear errors on successfully populated fields
            setErrors((prev) => {
                const next = { ...prev };
                delete next.gstNo;
                if (newName) delete next.name;
                if (newCity) delete next.city;
                if (newState) delete next.state;
                if (newZip) delete next.zipCode;
                return next;
            });

            safeToastSuccess("GST details fetched successfully");
        } catch (error: any) {
            if (handleAuthErrorAndToast(error, "Failed to validate GST")) return;
            const errMsg = error?.response?.data?.error || error?.response?.data?.message || "Failed to validate GST or invalid GST number";
            setTouched((prev) => ({ ...prev, gstNo: true }));
            setErrors((prev) => ({ ...prev, gstNo: errMsg }));
            safeToastError(errMsg);
        } finally {
            setIsFetchingGst(false);
        }
    };

    const handleSubmit = async (closeAfter = true) => {
        if (isSubmitting) return;

        // Perform full validation before submission
        const { isValid, newErrors } = validateAll();
        if (!isValid) {
            setErrors(newErrors);
            const allTouched: Record<string, boolean> = {};
            Object.keys(newErrors).forEach((key) => {
                allTouched[key] = true;
            });
            setTouched((prev) => ({ ...prev, ...allTouched }));
            safeToastError("Please correct the errors in the form before submitting.");
            return;
        }

        setIsSubmitting(true);

        try {
            const currentUserId = localStorage.getItem("user_id");
            const currentToken = localStorage.getItem("token");

            const trimmedData = {
                ...formData,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zipCode: formData.zipCode.trim(),
                gstNo: formData.gstNo.trim().toUpperCase(),
                panNo: formData.panNo.trim().toUpperCase(),
                companyType: formData.companyType.trim(),
                description: formData.description.trim(),
                upiId: formData.upiId.trim(),
                flag,
            };

            // Offline handling if not authenticated
            if (!currentUserId || !currentToken) {
                const vendorCompanies = JSON.parse(localStorage.getItem("vendor_companies") || "[]");
                const customerCompanies = JSON.parse(localStorage.getItem("customer_companies") || "[]");
                const allCompanies = [...vendorCompanies, ...customerCompanies];
                const storageKey = flag === "customer" ? "customer_companies" : "vendor_companies";
                const existing = flag === "customer" ? customerCompanies : vendorCompanies;

                if (!existingCompany && flag === "vendor" && existing.length >= 1) {
                    toast.warn("You can only create 1 vendor company without logging in.");
                    return;
                }

                const localErrors = validateLocalCompany(
                    existingCompany ? { ...existingCompany, ...trimmedData } : trimmedData,
                    allCompanies
                );

                if (localErrors.length > 0) {
                    localErrors.forEach((err) => safeToastError(err));
                    return;
                }

                let updated;
                if (existingCompany) {
                    updated = existing.map((c: any) =>
                        c._id === existingCompany._id
                            ? {
                                ...c,
                                ...trimmedData,
                                panVerificationStatus:
                                    flag === "vendor" && trimmedData.panNo
                                        ? c.panNo === trimmedData.panNo
                                            ? c.panVerificationStatus || "unverified"
                                            : "unverified"
                                        : "unverified",
                            }
                            : c
                    );
                    safeToastSuccess("Updated company locally!");
                    if (onCompanyCreated) {
                        const updatedCompany = updated.find((c: any) => c._id === existingCompany._id);
                        onCompanyCreated(updatedCompany);
                    }
                } else {
                    const newCompany = {
                        ...trimmedData,
                        _id: Date.now().toString(),
                        logo: previewUrl || null,
                        panVerificationStatus: "unverified",
                    };
                    updated = [...existing, newCompany];
                    safeToastSuccess("Created company locally!");
                    if (onCompanyCreated) onCompanyCreated(newCompany);
                }

                localStorage.setItem(storageKey, JSON.stringify(updated));

                if (refreshCompanies) refreshCompanies();
                if (closeAfter) closeModal();
                return;
            }

            // Online handling with backend API
            const data = new FormData();
            Object.entries(trimmedData).forEach(([key, value]) => {
                data.append(key, value);
            });
            if (selectedFile) {
                data.append("logo", selectedFile);
            } else if (existingCompany?.logo) {
                data.append("existingLogo", existingCompany.logo);
            }

            const url = existingCompany
                ? API_ENDPOINTS.COMPANIES.EDIT_BY_ID(existingCompany._id)
                : API_ENDPOINTS.COMPANIES.CREATE_BY_USER_ID(currentUserId);
            const method = existingCompany ? "put" : "post";

            const response = await apiClient[method as "put" | "post"](url, data);
            const savedCompany = response.data.company || response.data;
            safeToastSuccess(`${existingCompany ? "Updated" : "Created"} company successfully!`);
            if (onCompanyCreated) onCompanyCreated(savedCompany);
            if (refreshCompanies) refreshCompanies();
            if (closeAfter) {
                closeModal();
            } else {
                setFormData({
                    gstNo: "",
                    panNo: "",
                    name: "",
                    phone: "",
                    email: "",
                    address: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    companyType: "",
                    description: "",
                    upiId: "",
                });
                setSelectedFile(null);
                setPreviewUrl(null);
                setErrors({});
                setTouched({});
            }
        } catch (err: any) {
            if (handleAuthErrorAndToast(err, "Failed to save company")) return;
            const errMsg = err?.response?.data?.message || err?.message || `Error ${existingCompany ? "updating" : "creating"} company`;
            safeToastError(errMsg);

            // Connect backend field duplicate or validation error to the inline error state
            const lowerMsg = errMsg.toLowerCase();
            if (lowerMsg.includes("company name")) {
                setErrors((prev) => ({ ...prev, name: errMsg }));
                setTouched((prev) => ({ ...prev, name: true }));
            } else if (lowerMsg.includes("gst")) {
                setErrors((prev) => ({ ...prev, gstNo: errMsg }));
                setTouched((prev) => ({ ...prev, gstNo: true }));
            } else if (lowerMsg.includes("pan")) {
                setErrors((prev) => ({ ...prev, panNo: errMsg }));
                setTouched((prev) => ({ ...prev, panNo: true }));
            } else if (lowerMsg.includes("phone")) {
                setErrors((prev) => ({ ...prev, phone: errMsg }));
                setTouched((prev) => ({ ...prev, phone: true }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Desktop Modal */}
            <div className="hidden sm:flex justify-center">
                <div className="w-full max-w-3xl bg-white dark:bg-[#16181E] text-gray-900 dark:text-gray-100 p-4 rounded-xl">
                    <h2 className="text-lg font-bold mb-3 text-center text-gray-900 dark:text-white">
                        {existingCompany ? "Edit Company" : "Add Company"}
                    </h2>
                    <form
                        className="mt-3 grid grid-cols-3 gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(true);
                        }}
                    >
                        {/* Company Logo */}
                        {flag === "vendor" && isLoggedIn && (
                            <div className="col-span-3 flex flex-col gap-1 w-full">
                                <div className="flex flex-row items-center gap-2 w-full">
                                    <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Company Logo</label>
                                    <SecondaryBtn
                                        label="View"
                                        onClick={handleViewClick}
                                        disabled={!previewUrl}
                                        className="px-3 py-1 text-xs"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        id="companyLogo"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                    <SecondaryBtn
                                        label={
                                            <div className="flex items-center gap-1">
                                                <Upload size={13} />
                                                Upload
                                            </div>
                                        }
                                        onClick={handleUploadClick}
                                        className="px-3 py-1 text-xs"
                                    />
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                        (JPG, PNG, WEBP - Max 5MB)
                                    </span>
                                </div>
                                {errors.logo && (
                                    <span className="text-xs text-red-500 font-medium leading-tight">{errors.logo}</span>
                                )}
                            </div>
                        )}

                        {/* GST No */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    name="gstNo"
                                    value={formData.gstNo}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("gstNo", e.target.value)}
                                    placeholder="GST No(Optional)"
                                    className={`${inputClass} pr-20 h-9 w-full text-sm ${
                                        touched.gstNo && errors.gstNo ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.gstNo && errors.gstNo ? { borderColor: "#ef4444" } : undefined}
                                    maxLength={15}
                                />
                                <button
                                    type="button"
                                    onClick={validateGST}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline cursor-pointer disabled:opacity-50"
                                    disabled={isFetchingGst}
                                >
                                    {isFetchingGst ? "Loading..." : "Validate"}
                                </button>
                            </div>
                            {touched.gstNo && errors.gstNo && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.gstNo}</span>
                            )}
                        </div>

                        {/* PAN No */}
                        {flag === "vendor" && (
                            <div className="col-span-1 flex flex-col justify-start">
                                <input
                                    type="text"
                                    name="panNo"
                                    value={formData.panNo}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("panNo", e.target.value)}
                                    placeholder="PAN No (Optional)"
                                    className={`${inputClass} h-9 w-full text-sm ${
                                        touched.panNo && errors.panNo ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.panNo && errors.panNo ? { borderColor: "#ef4444" } : undefined}
                                    maxLength={10}
                                />
                                {touched.panNo && errors.panNo && (
                                    <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.panNo}</span>
                                )}
                            </div>
                        )}

                        {/* Company Name */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("name", e.target.value)}
                                placeholder="Company Name *"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.name && errors.name ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.name && errors.name ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.name && errors.name && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.name}</span>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("phone", e.target.value)}
                                placeholder="Phone Number *"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.phone && errors.phone ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.phone && errors.phone ? { borderColor: "#ef4444" } : undefined}
                                maxLength={10}
                            />
                            {touched.phone && errors.phone && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.phone}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("email", e.target.value)}
                                placeholder="Email(Optional)"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.email && errors.email ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.email && errors.email ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.email && errors.email && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.email}</span>
                            )}
                        </div>

                        {/* Company Type Dropdown */}
                        <div className="relative col-span-1 flex flex-col justify-start w-full">
                            <input
                                type="text"
                                name="companyType"
                                autoComplete="off"
                                value={formData.companyType}
                                onFocus={() => setShowDropdown(true)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => ({ ...prev, companyType: val }));
                                    setShowDropdown(true);
                                    if (touched.companyType) {
                                        const err = validateField("companyType", val, { ...formData, companyType: val });
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            if (err) next.companyType = err;
                                            else delete next.companyType;
                                            return next;
                                        });
                                    }
                                }}
                                onBlur={(e) => {
                                    setTimeout(() => setShowDropdown(false), 200);
                                    handleBlur("companyType", e.target.value);
                                }}
                                placeholder="Select Categories *"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.companyType && errors.companyType ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.companyType && errors.companyType ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.companyType && errors.companyType && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.companyType}</span>
                            )}
                            {showDropdown && companyTypes.length > 0 && (
                                <div className="absolute z-50 top-10 w-full bg-white dark:bg-[#1B1E26] border border-gray-300 dark:border-white/[0.12] rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                                    {companyTypes
                                        .filter((type) =>
                                            type.toLowerCase().includes(formData.companyType.toLowerCase())
                                        )
                                        .map((type) => (
                                            <div
                                                key={type}
                                                className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-800 dark:text-gray-200 cursor-pointer text-sm transition-colors"
                                                onMouseDown={() => {
                                                    setFormData((prev) => ({ ...prev, companyType: type }));
                                                    setShowDropdown(false);
                                                    setErrors((prev) => {
                                                        const next = { ...prev };
                                                        delete next.companyType;
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("description", e.target.value)}
                                placeholder="About your Company(Optional)"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.description && errors.description ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.description && errors.description ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.description && errors.description && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.description}</span>
                            )}
                        </div>

                        {/* UPI ID */}
                        {flag === "vendor" && (
                            <div className="col-span-1 flex flex-col justify-start">
                                <input
                                    type="text"
                                    name="upiId"
                                    value={formData.upiId}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("upiId", e.target.value)}
                                    placeholder="UPI ID (e.g. name@upi) (Optional)"
                                    className={`${inputClass} h-9 w-full text-sm ${
                                        touched.upiId && errors.upiId ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.upiId && errors.upiId ? { borderColor: "#ef4444" } : undefined}
                                />
                                {touched.upiId && errors.upiId && (
                                    <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.upiId}</span>
                                )}
                            </div>
                        )}

                        {/* Address */}
                        <div className="col-span-3 flex flex-col justify-start w-full">
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("address", e.target.value)}
                                placeholder="Street Address(Optional)"
                                className={`${inputClass} h-16 resize-none w-full text-sm ${
                                    touched.address && errors.address ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.address && errors.address ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.address && errors.address && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.address}</span>
                            )}
                        </div>

                        {/* City */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("city", e.target.value)}
                                placeholder="City *"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.city && errors.city ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.city && errors.city ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.city && errors.city && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.city}</span>
                            )}
                        </div>

                        {/* State */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("state", e.target.value)}
                                placeholder="State(Optional)"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.state && errors.state ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.state && errors.state ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.state && errors.state && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.state}</span>
                            )}
                        </div>

                        {/* Zip Code */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("zipCode", e.target.value)}
                                placeholder="Zip Code(Optional)"
                                className={`${inputClass} h-9 w-full text-sm ${
                                    touched.zipCode && errors.zipCode ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.zipCode && errors.zipCode ? { borderColor: "#ef4444" } : undefined}
                                maxLength={6}
                            />
                            {touched.zipCode && errors.zipCode && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.zipCode}</span>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="col-span-3 flex flex-row justify-end gap-2 mt-2 w-full">
                            <SecondaryBtn
                                type="button"
                                label="Cancel"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="w-full px-3 py-2 rounded"
                            />
                            {!existingCompany && (
                                <SecondaryBtn
                                    type="button"
                                    label={isSubmitting ? "Saving..." : "Add & Continue"}
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 rounded"
                                />
                            )}
                            <PrimaryBtn
                                type="submit"
                                label={isSubmitting ? "Saving..." : (existingCompany ? "Update" : "Add")}
                                disabled={isSubmitting}
                                className="w-full px-3 py-2 rounded"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Mobile Modal */}
            <div className="sm:hidden fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-[#16181E] text-gray-900 dark:text-gray-100 border border-transparent dark:border-white/[0.08] rounded-2xl p-5 shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {existingCompany ? "Edit Company" : "Add Company"}
                        </h2>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={isSubmitting}
                            className="w-6 h-6 flex items-center justify-center border border-red-500 bg-red-500 text-white text-base rounded-md hover:bg-red-600 cursor-pointer disabled:opacity-50"
                        >
                            ×
                        </button>
                    </div>
                    <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(true);
                        }}
                    >
                        {/* Company Logo */}
                        {flag === "vendor" && isLoggedIn && (
                            <div className="flex flex-col gap-1 w-full">
                                <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Company Logo</label>
                                <div className="flex gap-2 items-center">
                                    <SecondaryBtn
                                        type="button"
                                        label="View"
                                        onClick={handleViewClick}
                                        disabled={!previewUrl}
                                        className="flex-1"
                                    />
                                    <SecondaryBtn
                                        type="button"
                                        label="Upload"
                                        onClick={handleUploadClick}
                                        className="flex-1"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {errors.logo && (
                                    <span className="text-xs text-red-500 font-medium leading-tight">{errors.logo}</span>
                                )}
                            </div>
                        )}

                        {/* GST No */}
                        <div className="flex flex-col w-full max-w-md">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    name="gstNo"
                                    value={formData.gstNo}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("gstNo", e.target.value)}
                                    placeholder="GST No(Optional)"
                                    className={`${inputClass} pr-20 py-2 text-sm w-full ${
                                        touched.gstNo && errors.gstNo ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.gstNo && errors.gstNo ? { borderColor: "#ef4444" } : undefined}
                                    maxLength={15}
                                />
                                <button
                                    type="button"
                                    onClick={validateGST}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-orange-600 dark:text-orange-400 font-medium hover:underline cursor-pointer disabled:opacity-50"
                                    disabled={isFetchingGst}
                                >
                                    {isFetchingGst ? "Loading..." : "Validate"}
                                </button>
                            </div>
                            {touched.gstNo && errors.gstNo && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.gstNo}</span>
                            )}
                        </div>

                        {/* PAN No */}
                        {flag === "vendor" && (
                            <div className="flex flex-col w-full">
                                <input
                                    type="text"
                                    name="panNo"
                                    value={formData.panNo}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("panNo", e.target.value)}
                                    placeholder="PAN No (Optional)"
                                    className={`${inputClass} ${
                                        touched.panNo && errors.panNo ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.panNo && errors.panNo ? { borderColor: "#ef4444" } : undefined}
                                    maxLength={10}
                                />
                                {touched.panNo && errors.panNo && (
                                    <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.panNo}</span>
                                )}
                            </div>
                        )}

                        {/* Company Name */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("name", e.target.value)}
                                placeholder="Company Name *"
                                className={`${inputClass} ${
                                    touched.name && errors.name ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.name && errors.name ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.name && errors.name && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.name}</span>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("phone", e.target.value)}
                                placeholder="Phone Number *"
                                className={`${inputClass} ${
                                    touched.phone && errors.phone ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.phone && errors.phone ? { borderColor: "#ef4444" } : undefined}
                                maxLength={10}
                            />
                            {touched.phone && errors.phone && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.phone}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col w-full">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("email", e.target.value)}
                                placeholder="Email(Optional)"
                                className={`${inputClass} ${
                                    touched.email && errors.email ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.email && errors.email ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.email && errors.email && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.email}</span>
                            )}
                        </div>

                        {/* Company Type Dropdown */}
                        <div className="relative col-span-1 w-full flex flex-col">
                            <input
                                type="text"
                                name="companyType"
                                autoComplete="off"
                                value={formData.companyType}
                                onFocus={() => setShowDropdown(true)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData((prev) => ({ ...prev, companyType: val }));
                                    setShowDropdown(true);
                                    if (touched.companyType) {
                                        const err = validateField("companyType", val, { ...formData, companyType: val });
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            if (err) next.companyType = err;
                                            else delete next.companyType;
                                            return next;
                                        });
                                    }
                                }}
                                onBlur={(e) => {
                                    setTimeout(() => setShowDropdown(false), 200);
                                    handleBlur("companyType", e.target.value);
                                }}
                                placeholder="Select Categories *"
                                className={`${inputClass} pr-28 h-10 md:h-12 w-full ${
                                    touched.companyType && errors.companyType ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.companyType && errors.companyType ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.companyType && errors.companyType && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.companyType}</span>
                            )}

                            {showDropdown && companyTypes.length > 0 && (
                                <div className="absolute z-50 top-12 w-full bg-white dark:bg-[#1B1E26] border border-gray-300 dark:border-white/[0.12] rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                                    {companyTypes
                                        .filter((type) =>
                                            type.toLowerCase().includes(formData.companyType.toLowerCase())
                                        )
                                        .map((type) => (
                                            <div
                                                key={type}
                                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-800 dark:text-gray-200 cursor-pointer text-sm transition-colors"
                                                onMouseDown={() => {
                                                    setFormData((prev) => ({ ...prev, companyType: type }));
                                                    setShowDropdown(false);
                                                    setErrors((prev) => {
                                                        const next = { ...prev };
                                                        delete next.companyType;
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {type}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("description", e.target.value)}
                                placeholder="About your Company(Optional)"
                                className={`${inputClass} ${
                                    touched.description && errors.description ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.description && errors.description ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.description && errors.description && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.description}</span>
                            )}
                        </div>

                        {/* UPI ID */}
                        {flag === "vendor" && (
                            <div className="flex flex-col w-full">
                                <input
                                    type="text"
                                    name="upiId"
                                    value={formData.upiId}
                                    onChange={handleChange}
                                    onBlur={(e) => handleBlur("upiId", e.target.value)}
                                    placeholder="UPI ID (e.g. name@upi) (Optional)"
                                    className={`${inputClass} ${
                                        touched.upiId && errors.upiId ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                    }`}
                                    style={touched.upiId && errors.upiId ? { borderColor: "#ef4444" } : undefined}
                                />
                                {touched.upiId && errors.upiId && (
                                    <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.upiId}</span>
                                )}
                            </div>
                        )}

                        {/* Address */}
                        <div className="flex flex-col w-full">
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("address", e.target.value)}
                                placeholder="Street Address(Optional)"
                                className={`${inputClass} h-20 resize-none ${
                                    touched.address && errors.address ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.address && errors.address ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.address && errors.address && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.address}</span>
                            )}
                        </div>

                        {/* City */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("city", e.target.value)}
                                placeholder="City *"
                                className={`${inputClass} ${
                                    touched.city && errors.city ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.city && errors.city ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.city && errors.city && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.city}</span>
                            )}
                        </div>

                        {/* State */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("state", e.target.value)}
                                placeholder="State(Optional)"
                                className={`${inputClass} ${
                                    touched.state && errors.state ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.state && errors.state ? { borderColor: "#ef4444" } : undefined}
                            />
                            {touched.state && errors.state && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.state}</span>
                            )}
                        </div>

                        {/* Zip Code */}
                        <div className="flex flex-col w-full">
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                onBlur={(e) => handleBlur("zipCode", e.target.value)}
                                placeholder="Zip Code(Optional)"
                                className={`${inputClass} ${
                                    touched.zipCode && errors.zipCode ? "!border-red-500 focus:!ring-red-400 focus:!border-red-500" : ""
                                }`}
                                style={touched.zipCode && errors.zipCode ? { borderColor: "#ef4444" } : undefined}
                                maxLength={6}
                            />
                            {touched.zipCode && errors.zipCode && (
                                <span className="text-xs text-red-500 font-medium leading-tight mt-1">{errors.zipCode}</span>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 w-full mt-1">
                            {!existingCompany && (
                                <SecondaryBtn
                                    type="button"
                                    label={isSubmitting ? "Saving..." : "Add & Continue"}
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-3 py-2 rounded"
                                />
                            )}
                            <PrimaryBtn
                                type="submit"
                                label={isSubmitting ? "Saving..." : (existingCompany ? "Update" : "Add")}
                                disabled={isSubmitting}
                                className={!existingCompany ? "flex-1 px-3 py-2 rounded" : "w-full px-3 py-2 rounded"}
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Company Image Modal */}
            {showImageModal && (
                <div
                    onClick={() => setShowImageModal(false)}
                    className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50"
                >
                    <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 sm:p-3 shadow-lg hover:bg-red-600 transition cursor-pointer"
                        >
                            ✕
                        </button>

                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl || "/uploads/companies/default-company/logo-1779622107439-878996187.webp"}
                            alt="Company Logo"
                            className="max-w-full max-h-[80vh] object-contain border-4 border-orange-500 rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
}