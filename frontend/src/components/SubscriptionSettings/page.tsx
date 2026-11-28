"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@utilis/apiClient";
import { API_ENDPOINTS } from "@constants/api";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import {
  Crown,
  Calendar,
  CreditCard,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Shield,
} from "lucide-react";

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  monthlyPrice?: number;
  annualPrice?: number;
  price?: number;
  duration?: string;
  limits?: {
    postersPerMonth?: number;
    posterLinks?: number;
    linkExpiryDays?: number;
    videoUploadsPerMonth?: number;
    totalVideoStorageMB?: number;
    companies?: number;
  };
  features?: string[];
}

export interface Subscription {
  _id?: string;
  planSlug?: string;
  planId?: Plan;
  billing?: "monthly" | "annual" | "unlimited" | string;
  status?: "active" | "pending" | "cancelled" | "expired" | "halted" | string;
  isActive?: boolean;
  endDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Payment {
  _id: string;
  planSlug: string;
  amount: number;
  currency: string;
  status: string;
  billing: string;
  method: string;
  createdAt: string;
}

const paymentStatusColors: Record<string, string> = {
  captured: "bg-green-100 text-green-700",
  created: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-blue-100 text-blue-700",
};

function SubscriptionSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentPage, setPaymentPage] = useState(1);
  const [totalPaymentPages, setTotalPaymentPages] = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.HISTORY);
      setCurrentPlan(res.data.currentPlan || null);
    } catch (err: unknown) {
      console.warn("Failed to load subscription on mount:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (page: number) => {
    try {
      setPaymentsLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.SUBSCRIPTIONS.PAYMENTS, {
        params: { page, limit: 10 },
      });
      setPayments(res.data.payments || []);
      setTotalPaymentPages(res.data.totalPages || 1);
      setPaymentPage(res.data.page || 1);
    } catch {
      // silently fail for payments
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await apiClient.post(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL, {});
      safeToastSuccess("Subscription cancelled successfully");
      setShowCancelConfirm(false);
      fetchSubscription();
      fetchPayments(1);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to cancel subscription";
      safeToastError(errorMsg);
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPayments(1);
  }, []);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Lifetime Access";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Lifetime Access";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amountInPaise: number) => {
    return `₹${((amountInPaise || 0) / 100).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Render current plan details from API response
  const rawPlan = (currentPlan?.planId as Plan) || (currentPlan as Plan | null);
  const planName = rawPlan?.name || (currentPlan?.planSlug ? String(currentPlan.planSlug).toUpperCase() : "Free");
  const isUnlimitedPlan = rawPlan?.slug === "unlimited" || currentPlan?.billing === "unlimited" || planName.toLowerCase().includes("unlimited");

  const limitsObj = (rawPlan?.limits as Record<string, number> | undefined) || {};
  const maxCompanies = isUnlimitedPlan ? -1 : (limitsObj.companies ?? limitsObj.maxFromCompanies);
  const maxPosters = isUnlimitedPlan ? -1 : (limitsObj.postersPerMonth ?? limitsObj.maxPostersPerMonth);
  const maxPosterLinks = isUnlimitedPlan ? -1 : (limitsObj.posterLinks ?? limitsObj.maxPosterLinks);
  const expiryDays = isUnlimitedPlan ? 36500 : (limitsObj.linkExpiryDays ?? limitsObj.posterLinkExpiryDays ?? 7);
  const maxVideos = isUnlimitedPlan ? -1 : (limitsObj.videoUploadsPerMonth ?? limitsObj.maxVideoUploadsPerMonth);
  const maxStorage = isUnlimitedPlan ? -1 : (limitsObj.totalVideoStorageMB ?? limitsObj.maxVideoStorageMB);

  const formatLimitVal = (val: string | number | undefined | null) => {
    if (val === -1 || val === "-1" || Number(val) < 0 || Number(val) >= 9999) return "Unlimited";
    return val ?? "—";
  };

  const formatStorageVal = (val: string | number | undefined | null) => {
    if (val === -1 || val === "-1" || Number(val) < 0 || Number(val) >= 9999) return "Unlimited";
    return `${val ?? 75}MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Active Plan Card */}
      <div className="bg-white dark:bg-[#16181E] rounded-2xl shadow-sm border border-gray-100 dark:border-white/[0.08] overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Crown className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Your Plan</h2>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${currentPlan?.isActive !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
            >
              {currentPlan?.isActive !== false ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {planName}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <CreditCard className="w-[18px] h-[18px] stroke-[2]" />
                  {isUnlimitedPlan
                    ? "Permanent Unlimited Access (Full Access)"
                    : rawPlan?.price ? `₹${rawPlan.price}/${rawPlan.duration || "mo"}` : "₹0 (Free Plan)"}
                </p>
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Calendar className="w-[18px] h-[18px] stroke-[2]" />
                  {isUnlimitedPlan
                    ? "Permanent Access (Lifetime)"
                    : currentPlan?.endDate
                      ? (currentPlan.isActive
                        ? `Renews on ${formatDate(currentPlan.endDate)}`
                        : `Ended on ${formatDate(currentPlan.endDate)}`)
                      : "Free Plan (Lifetime Access)"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push("/pages/subscription")}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-[18px] h-[18px] stroke-[2]" />
                Change Plan
              </button>

              {currentPlan?.isActive && planName.toLowerCase() !== "free" && !isUnlimitedPlan && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-5 py-2.5 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-sm"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Plan Limits */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "From Companies", value: formatLimitVal(maxCompanies) },
              { label: "Posters/mo", value: formatLimitVal(maxPosters) },
              { label: "Poster Links", value: formatLimitVal(maxPosterLinks) },
              { label: "Link Expiry", value: isUnlimitedPlan ? "Permanent" : `${expiryDays}d` },
              { label: "Videos/mo", value: formatLimitVal(maxVideos) },
              { label: "Video Storage", value: formatStorageVal(maxStorage) },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3 text-center"
              >
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181B26] border border-gray-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Cancel Subscription?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your subscription will be cancelled immediately and you&apos;ll be
              downgraded to the Free plan. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.08] rounded-lg transition"
                disabled={cancelling}
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 cursor-pointer"
              >
                {cancelling && <Loader2 className="w-[18px] h-[18px] stroke-[2] animate-spin" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white dark:bg-[#16181E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.08] flex items-center gap-3">
          <Shield className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment History</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No payments yet</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#14161E] text-gray-500 dark:text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Plan</th>
                    <th className="px-6 py-3 text-left">Billing</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Method</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{formatDate(p.createdAt)}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">{p.planSlug}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">{p.billing}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatAmount(p.amount)}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 capitalize">{p.method || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[p.status] || "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300"
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
              {payments.map((p) => (
                <div key={p._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">{formatAmount(p.amount)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[p.status] || "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300"
                        }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{p.planSlug} · {p.billing}</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPaymentPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {paymentPage} of {totalPaymentPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPayments(paymentPage - 1)}
                    disabled={paymentPage <= 1 || paymentsLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300 disabled:opacity-40 transition cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-[18px] h-[18px] stroke-[2]" />
                  </button>
                  <button
                    onClick={() => fetchPayments(paymentPage + 1)}
                    disabled={paymentPage >= totalPaymentPages || paymentsLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] text-gray-700 dark:text-gray-300 disabled:opacity-40 transition cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-[18px] h-[18px] stroke-[2]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SubscriptionSettings;
