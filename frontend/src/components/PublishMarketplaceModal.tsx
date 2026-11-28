"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Store,
  CheckCircle,
  Phone,
  MessageSquare,
  MapPin,
  Tag,
  RefreshCw,
  Globe,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import apiClient, { clearApiCache } from "@utilis/apiClient";
import { API_ENDPOINTS, getPosterImageSrc } from "@constants/api";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import { validateAndSanitizePrice } from "@components/PosterCanvasView";

interface PublishMarketplaceModalProps {
  isOpen: boolean;
  poster: any;
  onClose: () => void;
  onSuccess?: (updatedPoster: any) => void;
}

const CATEGORIES = [
  "Laptops & Computers",
  "Electronics & Tech",
  "IT & Software Services",
  "Retail & Wholesale",
  "Manufacturing & Industrial",
  "Healthcare & Medical",
  "Fashion & Apparel",
  "Education & Training",
  "Events & Entertainment",
  "General / Others",
];

const sanitizeTo10Digits = (val: string): string => {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

export default function PublishMarketplaceModal({
  isOpen,
  poster,
  onClose,
  onSuccess,
}: PublishMarketplaceModalProps) {
  const [isPublished, setIsPublished] = useState(false);
  const [category, setCategory] = useState("Laptops & Computers");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    if (poster && isOpen) {
      // Always default to true when the marketplace modal is opened so the listing publishes
      setIsPublished(true);
      setCategory(poster.marketplaceSubcategory || poster.marketplaceCategory || "Laptops & Computers");
      setCity(poster.marketplaceCity || poster.company_id?.city || "");
      setPhone(sanitizeTo10Digits(poster.contactPhone || poster.company_id?.phone || ""));
      setWhatsapp(poster.whatsappNumber || poster.contactPhone || poster.company_id?.phone || "");
      const initialPrice =
        poster.marketplacePrice !== undefined && poster.marketplacePrice !== null
          ? String(poster.marketplacePrice)
          : poster.product_price !== undefined
          ? String(poster.product_price)
          : poster.price !== undefined
          ? String(poster.price)
          : "";
      const priceRes = validateAndSanitizePrice(initialPrice);
      setPrice(priceRes.value);
      setPriceError(priceRes.error);
      setDuplicateWarning(null);
      setPublishSuccess(false);
    }
  }, [poster, isOpen]);

  const priceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerPriceError = (msg: string | null) => {
    if (priceTimeoutRef.current) clearTimeout(priceTimeoutRef.current);
    setPriceError(msg);
    if (msg) {
      priceTimeoutRef.current = setTimeout(() => setPriceError(null), 1500);
    }
  };

  const handlePriceChange = (val: string) => {
    const res = validateAndSanitizePrice(val);
    setPrice(res.value);
    if (res.error) triggerPriceError(res.error);
    else setPriceError(null);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Enter"
    ) {
      return;
    }
    const currentVal = price || "";
    const isSelectionFull =
      e.currentTarget.selectionStart === 0 &&
      e.currentTarget.selectionEnd === currentVal.length;

    if (
      e.key === "0" &&
      (!currentVal ||
        currentVal === "" ||
        isSelectionFull ||
        (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0))
    ) {
      e.preventDefault();
      triggerPriceError("invalid");
      return;
    }
    if (e.key === "-") {
      e.preventDefault();
      triggerPriceError("invalid");
      return;
    }
    if (!/^[0-9.]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      triggerPriceError("invalid");
      return;
    }
    const intDigits = currentVal.split(".")[0];
    if (
      intDigits.length >= 8 &&
      e.currentTarget.selectionStart === e.currentTarget.selectionEnd &&
      /^[0-9]$/.test(e.key)
    ) {
      e.preventDefault();
      triggerPriceError("invalid");
      return;
    }
  };

  const dynamicCategories = React.useMemo(() => {
    const list = [...CATEGORIES];
    const itemCat = poster?.marketplaceSubcategory || poster?.marketplaceCategory;
    if (itemCat && !list.includes(itemCat)) {
      list.unshift(itemCat);
    }
    return list;
  }, [poster]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeTo10Digits(e.target.value);
    setPhone(cleaned);
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  if (!isOpen || !poster) return null;

  const isInitiallyPublished = Boolean(poster.isPublishedToMarketplace);
  const isFormUnchanged =
    isInitiallyPublished &&
    isPublished === true &&
    category === (poster.marketplaceSubcategory || poster.marketplaceCategory || "Electronics & Accessories") &&
    city.trim() === (poster.marketplaceCity || poster.company_id?.city || "").trim() &&
    phone.trim() === sanitizeTo10Digits(poster.contactPhone || poster.company_id?.phone || "").trim() &&
    whatsapp.trim() === (poster.whatsappNumber || poster.contactPhone || poster.company_id?.phone || "").trim() &&
    price.trim() === (poster.marketplacePrice !== undefined && poster.marketplacePrice !== null ? String(poster.marketplacePrice) : String(poster.product_price ?? poster.price ?? "")).trim() &&
    !poster._hasPendingContentChanges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const posterTargetId = poster._id || poster.posterId;
    if (!posterTargetId) {
      safeToastError("Poster ID not found. Please save the poster first.");
      return;
    }

    const cleanPhone = sanitizeTo10Digits(phone);
    const cleanWhatsapp = whatsapp.replace(/[\s\-\(\)]/g, "");
    const phone10Regex = /^[0-9]{10}$/;
    const whatsappRegex = /^(\+?\d{1,4})?[0-9]{10,14}$/;

    if (cleanPhone && !phone10Regex.test(cleanPhone)) {
      safeToastError("Contact Phone must be exactly a 10-digit number.");
      return;
    }

    if (isPublished) {
      const hasProductImage = Boolean(
        (
          poster?.product_image ||
          poster?.productImage ||
          (Array.isArray(poster?.product_gallery_images) && poster.product_gallery_images[0]) ||
          ""
        ).trim()
      );
      if (!hasProductImage) {
        safeToastError("Please upload a product image before publishing your poster.");
        return;
      }

      if (!category.trim()) {
        safeToastError("Category is required. Please select a category for the marketplace listing.");
        return;
      }

      if (!city.trim()) {
        safeToastError("Location / City is required. Please enter a city for the marketplace listing.");
        return;
      }

      if (price.trim()) {
        const priceRes = validateAndSanitizePrice(price);
        if (priceRes.value !== price) {
          setPrice(priceRes.value);
        }
      }
      if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        safeToastError("Display Price is required. Please enter a valid price in INR.");
        return;
      }

      if (!cleanPhone) {
        safeToastError("Contact Phone is required. Please enter a 10-digit phone number.");
        return;
      }

      if (!phone10Regex.test(cleanPhone)) {
        safeToastError("Contact Phone must be exactly a 10-digit number.");
        return;
      }

      if (cleanWhatsapp && !whatsappRegex.test(cleanWhatsapp)) {
        safeToastError("Please enter a valid WhatsApp number (minimum 10 digits).");
        return;
      }
    } else {
      if (cleanPhone && !phone10Regex.test(cleanPhone)) {
        safeToastError("Contact Phone must be exactly a 10-digit number.");
        return;
      }
      if (cleanWhatsapp && !whatsappRegex.test(cleanWhatsapp)) {
        safeToastError("Please enter a valid WhatsApp number.");
        return;
      }
    }

    try {
      setLoading(true);
      setDuplicateWarning(null);

      const payload: any = {
        isPublishedToMarketplace: isPublished,
        marketplaceCategory: category.trim(),
        marketplaceSubcategory: category.trim(),
        marketplaceCity: city.trim(),
        contactPhone: cleanPhone,
        whatsappNumber: cleanWhatsapp || cleanPhone,
        marketplacePrice: price.trim() && !isNaN(Number(price)) ? Number(price) : null,
      };

      // Pass current poster content and styling to ensure DB stays synchronized
      if (poster.poster_title || poster.title) {
        payload.poster_title = poster.poster_title || poster.title;
      }
      if (poster.product_name || poster.productName) {
        payload.product_name = poster.product_name || poster.productName;
      }
      if (poster.product_description !== undefined || poster.description !== undefined) {
        payload.product_description = poster.product_description ?? poster.description;
      }
      if (poster.product_price !== undefined || poster.price !== undefined) {
        const p = poster.product_price !== undefined ? poster.product_price : poster.price;
        payload.product_price = p ? Number(p) : 0;
      }
      if (poster.product_image || poster.productImage) {
        payload.product_image = poster.product_image || poster.productImage;
      }
      if (poster.company_logo || poster.companyLogo) {
        payload.company_logo = poster.company_logo || poster.companyLogo;
      }
      if (poster.template) payload.template = poster.template;
      if (poster.templateCategory) payload.templateCategory = poster.templateCategory;
      if (poster.colorThemeId) payload.colorThemeId = poster.colorThemeId;
      if (poster.custom_colors || poster.customAccentColor) {
        payload.custom_colors = poster.custom_colors || poster.customAccentColor;
      }
      if (poster.bgTypeId) payload.bgTypeId = poster.bgTypeId;
      if (poster.customBgColor !== undefined) payload.customBgColor = poster.customBgColor;
      if (poster.backgroundImage !== undefined) payload.backgroundImage = poster.backgroundImage;
      if (poster.fontFamilyId) payload.fontFamilyId = poster.fontFamilyId;
      if (poster.neonEffect !== undefined) payload.neonEffect = poster.neonEffect;

      const res = await apiClient.patch(API_ENDPOINTS.MARKETPLACE.PUBLISH(posterTargetId), payload);
      clearApiCache();
      const updatedData = res.data?.data || { ...poster, ...payload };
      safeToastSuccess(res.data?.message || (isPublished ? "Marketplace listing updated successfully!" : "Listing removed from marketplace"));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("marketplace-updated", { detail: updatedData }));
        window.dispatchEvent(new CustomEvent("poster-link-updated", { detail: updatedData }));
      }

      if (onSuccess) {
        onSuccess(updatedData);
      }
      if (isPublished) {
        setPublishSuccess(true);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error("Failed to update marketplace status:", err);
      const isDuplicate = err.response?.status === 409 || err.response?.data?.isDuplicate;
      const msg = err.response?.data?.message || err.message || "Failed to update marketplace listing";
      if (isDuplicate) {
        setDuplicateWarning(msg);
        safeToastError(msg);
      } else {
        safeToastError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (publishSuccess) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md p-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle className="w-8 h-8 stroke-[2]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
            Published to Marketplace!
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            &quot;{poster.poster_title || poster.title || poster.poster_name || poster.product_name || "Your poster"}&quot; is now publicly active on reNote Marketplace.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPublishSuccess(false);
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                window.open("/pages/marketplace", "_blank");
                setPublishSuccess(false);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] rounded-xl shadow-lg shadow-[#FF5722]/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 stroke-[2]" />
              View in Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FF5722]/10 via-[#FF5722]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5722] text-white flex items-center justify-center shadow-md shadow-[#FF5722]/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                reNote Marketplace Listing
                <Sparkles className="w-[18px] h-[18px] stroke-[2] text-[#FF5722]" />
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Publish publicly for all companies & buyers to discover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Selected Poster Preview Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-black/40 shrink-0 border border-black/10 dark:border-white/10 relative">
              <img
                src={getPosterImageSrc(poster.product_image || poster.productImage || "")}
                alt={poster.product_name || "Poster preview"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {poster.poster_title || poster.title || poster.poster_name || "Poster Listing"}
              </h4>
              <p className="text-xs font-semibold text-[#FF5722] truncate mt-0.5">
                {poster.product_name || poster.poster_name || "Product"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium truncate">
                  {category}
                </span>
                {price && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{Number(price).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Toggle Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isPublished
              ? "bg-orange-50/80 border-orange-200 dark:bg-[#281611] dark:border-[#FF5722]/30"
              : "bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className={`w-5 h-5 stroke-[2] ${isPublished ? "text-[#FF5722]" : "text-gray-400"}`} />
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">
                    Public Marketplace Listing
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isPublished ? "Visible to all buyers on reNote Marketplace" : "Currently hidden from public market page"}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5722]"></div>
              </label>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Tag className="w-[18px] h-[18px] stroke-[2] text-[#FF5722] shrink-0" />
                <span>Category</span>
                <span className="text-[#FF5722] font-bold text-xs" title="Required">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF5722] focus:border-transparent outline-none"
              >
                {dynamicCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-[18px] h-[18px] stroke-[2] text-[#FF5722] shrink-0" />
                <span>Location / City</span>
                <span className="text-[#FF5722] font-bold text-xs" title="Required">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Coimbatore, Chennai"
                className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF5722] outline-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <span>Display Price (₹)</span>
                <span className="text-[#FF5722] font-bold text-xs" title="Required">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                placeholder="Price in INR"
                className={`w-full text-xs bg-gray-50 dark:bg-gray-800 border ${
                  priceError
                    ? "border-red-400 dark:border-red-500/70 focus:ring-red-400"
                    : "border-gray-200 dark:border-gray-700 focus:ring-[#FF5722]"
                } rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 outline-none transition-colors`}
              />
            </div>

            {/* Contact Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Phone className="w-[18px] h-[18px] stroke-[2] text-[#FF5722] shrink-0" />
                  <span>Contact Phone</span>
                  <span className="text-[#FF5722] font-bold text-xs" title="Required">*</span>
                </label>
                {phone.length > 0 && (
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      phone.length === 10
                        ? "text-emerald-500 font-semibold"
                        : "text-amber-500"
                    }`}
                  >
                    {phone.length}/10 digits
                  </span>
                )}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                placeholder="10-digit mobile number"
                className={`w-full text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF5722] outline-none transition-all ${
                  phone.length > 0 && phone.length < 10
                    ? "border-amber-400 dark:border-amber-500/50"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              />
              {phone.length > 0 && phone.length < 10 && (
                <p className="text-[10px] text-amber-500 mt-1">
                  Must be exactly 10 digits ({10 - phone.length} more digit{10 - phone.length > 1 ? "s" : ""} needed)
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-[18px] h-[18px] stroke-[2] text-emerald-500 shrink-0" />
              <span>WhatsApp Direct Chat Number</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 15))}
              placeholder="WhatsApp number with country code (e.g. 919092024444)"
              className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Duplicate or Unchanged Notice */}
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <Sparkles className="w-[18px] h-[18px] stroke-[2] text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Duplicate Publish Prevention</p>
                <p className="text-[11px] mt-0.5 text-amber-600 dark:text-amber-400">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {isFormUnchanged && !duplicateWarning && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-[18px] h-[18px] stroke-[2] text-emerald-500 shrink-0" />
                <span>Active on Marketplace {poster.publishedVersion ? `(v${poster.publishedVersion})` : ""}</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Unchanged</span>
            </div>
          )}

          {/* Buttons & View in Marketplace action */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {isInitiallyPublished ? (
              <button
                type="button"
                onClick={() => window.open("/pages/marketplace", "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition cursor-pointer"
                title="View listing in ReNote Marketplace"
              >
                <ExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                <span className="hidden sm:inline">View in</span> Marketplace
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF5722] to-[#E63900] hover:from-[#FF7043] hover:to-[#FF5722] rounded-xl shadow-lg shadow-[#FF5722]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save marketplace settings"
              >
                {loading ? (
                  <RefreshCw className="w-[18px] h-[18px] stroke-[2] animate-spin" />
                ) : (
                  <CheckCircle className="w-[18px] h-[18px] stroke-[2]" />
                )}
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
