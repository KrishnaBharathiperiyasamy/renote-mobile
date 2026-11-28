"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield, Lock, Users, Building2, BarChart3,
  Settings, LogOut, Search, Trash2, Ban, CheckCircle,
  Download, Upload, ToggleLeft, ToggleRight,
  RefreshCw, Eye, EyeOff, TrendingUp,
  FileText, Receipt, Image, Package, Pencil, X,
  ChevronRight, User, RotateCcw, Clock,
  CreditCard, Activity, UserCog, SlidersHorizontal, Share2,
  Crown, Tag, Plus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { io, Socket } from "socket.io-client";
import { isAxiosError } from "axios";
import { API_ENDPOINTS, DATA_API_BASE_URL } from "@constants/api";
import apiClient from "@utilis/apiClient";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import {
  getSAToken, setSAToken, clearSAToken,
  isSAAuthenticated, saFetch,
} from "@utilis/superAdminAuth";

// ─── Types ───
interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalPosters: number;
  totalInvoices: number;
  totalQuotations: number;
  totalProducts: number;
  newUsersWeek: number;
  newUsersMonth: number;
  activeCompanies: number;
}

interface GrowthPoint { _id: string; count: number; }

interface SACompany {
  _id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  companyType: string;
  flag: string;
  isDeleted: boolean;
  createdAt: string;
  userId?: { _id: string; authId: string };
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerCounts?: { invoices: number; estimations: number; posters: number; products: number };
}

interface OwnerGroup {
  authId: string;
  mongoUserId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  companies: SACompany[];
}

interface SAUser {
  _id: string;
  authId: string;
  createdAt: string;
  companiesCount: number;
  invoicesCount: number;
  postersCount: number;
  estimationsCount: number;
  productsCount: number;
  name: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  lastLoggedInAt: string | null;
  role: string;
}

type Tab = "dashboard" | "companies" | "users" | "payments" | "analytics" | "system" | "account" | "categories";

interface DeletedUser {
  backupId: string;
  userName: string;
  deletedAt: string;
  expiresAt: string;
  remainingMs: number;
  counts: Record<string, number>;
}

// ─── Component ───
export default function SuperAdminDashboard() {
  // Auth state
  const [authStep, setAuthStep] = useState<"login" | "totp" | "dashboard">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [preToken, setPreToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [companies, setCompanies] = useState<SACompany[]>([]);
  const [users, setUsers] = useState<SAUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [maintenance, setMaintenance] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState<string>("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<"all" | "vendor" | "customer">("all");
  const [companySortBy, setCompanySortBy] = useState<"user" | "name" | "category" | "status">("user");
  const [showCompanyFilters, setShowCompanyFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<SACompany | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", city: "", companyType: "", address: "", state: "", zipCode: "", gstNo: "", upiId: "", description: "" });
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
  const [expandedCompanyGroup, setExpandedCompanyGroup] = useState<string | null>(null);

  // TOTP action verification state
  const [totpModal, setTotpModal] = useState<{ action: string; args: unknown[] } | null>(null);
  const [actionTotpCode, setActionTotpCode] = useState("");
  const [actionTotpError, setActionTotpError] = useState("");
  const [actionTotpLoading, setActionTotpLoading] = useState(false);

  // Delete restore state
  const [deleteResult, setDeleteResult] = useState<{ backupId: string; ownerName: string; counts: Record<string, number> } | null>(null);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);

  // Trial modal state
  const [trialModal, setTrialModal] = useState<{ mongoUserId: string; ownerName: string } | null>(null);
  const [trialMonths, setTrialMonths] = useState<1 | 3 | 6>(1);

  // Subscription / Payments state
  const [subStats, setSubStats] = useState<{ activeSubscriptions: number; planCounts: Record<string, number>; totalRevenue: number; mrr: number; churnLast30Days: number; recentPayments: any[] } | null>(null);
  const [saSubscriptions, setSaSubscriptions] = useState<any[]>([]);
  const [saSubPage, setSaSubPage] = useState(1);
  const [saSubTotalPages, setSaSubTotalPages] = useState(1);
  const [saSubStatusFilter, setSaSubStatusFilter] = useState("");
  const [saSubPlanFilter, setSaSubPlanFilter] = useState("");
  const [saPayments, setSaPayments] = useState<any[]>([]);
  const [saPayPage, setSaPayPage] = useState(1);
  const [saPayTotalPages, setSaPayTotalPages] = useState(1);
  const [saPayStatusFilter, setSaPayStatusFilter] = useState("");
  const [saPayPlanFilter, setSaPayPlanFilter] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [payViewMode, setPayViewMode] = useState<"overview" | "subscriptions" | "payments">("overview");

  // Subscription modify modal state
  const [modifySubModal, setModifySubModal] = useState<{ userId: string; userName: string; currentPlan: string; currentBilling: string; currentStatus: string } | null>(null);
  const [modPlanSlug, setModPlanSlug] = useState("pro");
  const [modDurationMonths, setModDurationMonths] = useState<number>(1);
  const [modIsUnlimited, setModIsUnlimited] = useState(false);
  const [modStatus, setModStatus] = useState("active");

  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Check existing session on mount ───
  useEffect(() => {
    if (isSAAuthenticated()) setAuthStep("dashboard");
  }, []);

  // ─── Socket.IO ───
  useEffect(() => {
    if (authStep !== "dashboard") return;

    const baseUrl = DATA_API_BASE_URL.replace(/\/api$/, "");
    const socket = io(`${baseUrl}/superadmin`, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("company:blocked", () => fetchCompanies());
    socket.on("company:unblocked", () => fetchCompanies());
    socket.on("company:updated", () => fetchCompanies());
    socket.on("company:deleted", () => { fetchCompanies(); fetchStats(); });
    socket.on("user:deleted", () => { fetchCompanies(); fetchUsers(); fetchStats(); });
    socket.on("user:blocked", () => { fetchCompanies(); fetchUsers(); });
    socket.on("user:unblocked", () => { fetchCompanies(); fetchUsers(); });
    socket.on("user:restored", () => { fetchCompanies(); fetchUsers(); fetchStats(); });
    socket.on("maintenance:toggled", (data: { enabled: boolean }) => setMaintenance(data.enabled));
    socket.on("system:restored", () => { fetchStats(); fetchCompanies(); });
    socket.on("subscription:created", () => fetchSubStats());
    socket.on("subscription:cancelled", () => fetchSubStats());
    socket.on("payment:received", () => fetchSubStats());
    socket.on("payment:failed", () => fetchSubStats());

    return () => { socket.disconnect(); };
  }, [authStep]);

  // ─── Auth handlers ───
  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.SUPERADMIN.LOGIN, {
        username,
        password,
      }, {
        headers: { "Content-Type": "application/json" },
      });
      setPreToken(data.preToken);
      setAuthStep("totp");
    } catch (error) {
      if (isAxiosError(error)) {
        setAuthError(error.response?.data?.message || "Login failed");
      } else {
        setAuthError("Network error");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.SUPERADMIN.VERIFY_TOTP, {
        code: totpCode,
        preToken,
      }, {
        headers: { "Content-Type": "application/json" },
      });
      setSAToken(data.access_token);
      setAuthStep("dashboard");
    } catch (error) {
      if (isAxiosError(error)) {
        setAuthError(error.response?.data?.message || "TOTP verification failed");
      } else {
        setAuthError("Network error");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSAToken();
    setAuthStep("login");
    setUsername("");
    setPassword("");
    setTotpCode("");
    setPreToken("");
    setStats(null);
    setCompanies([]);
  };

  // ─── Data fetchers ───
  const fetchStats = useCallback(async () => {
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.STATS);
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats);
      setUserGrowth(data.userGrowth || []);
    } catch { /* ignore */ }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.COMPANIES);
      if (!res.ok) return;
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USERS);
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, []);



  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.MAINTENANCE);
      if (!res.ok) return;
      const data = await res.json();
      setMaintenance(data.maintenance);
    } catch { /* ignore */ }
  }, []);

  const fetchDeletedUsers = useCallback(async () => {
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USER_BACKUPS);
      if (!res.ok) return;
      const data = await res.json();
      setDeletedUsers(data.backups || []);
    } catch { /* ignore */ }
  }, []);

  const fetchSubStats = useCallback(async () => {
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.SUBSCRIPTION_STATS);
      if (!res.ok) return;
      const data = await res.json();
      setSubStats(data);
    } catch { /* ignore */ }
  }, []);

  const fetchSaSubscriptions = useCallback(async (page = 1, status = "", plan = "") => {
    try {
      setSubLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (status) params.set("status", status);
      if (plan) params.set("planSlug", plan);
      const res = await saFetch(`${API_ENDPOINTS.SUPERADMIN.SUBSCRIPTIONS}?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setSaSubscriptions(data.subscriptions || []);
      setSaSubPage(data.page);
      setSaSubTotalPages(data.totalPages);
    } catch { /* ignore */ } finally { setSubLoading(false); }
  }, []);

  const fetchSaPayments = useCallback(async (page = 1, status = "", plan = "") => {
    try {
      setSubLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (status) params.set("status", status);
      if (plan) params.set("planSlug", plan);
      const res = await saFetch(`${API_ENDPOINTS.SUPERADMIN.PAYMENTS}?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setSaPayments(data.payments || []);
      setSaPayPage(data.page);
      setSaPayTotalPages(data.totalPages);
    } catch { /* ignore */ } finally { setSubLoading(false); }
  }, []);

  // Load data on dashboard entry
  useEffect(() => {
    if (authStep !== "dashboard") return;
    setLoading(true);
    Promise.all([fetchStats(), fetchCompanies(), fetchUsers(), fetchMaintenance(), fetchDeletedUsers()])
      .finally(() => setLoading(false));
  }, [authStep, fetchStats, fetchCompanies, fetchUsers, fetchMaintenance, fetchDeletedUsers]);

  // Load subscription stats when payments tab is activated
  useEffect(() => {
    if (authStep === "dashboard" && activeTab === "payments" && !subStats) {
      fetchSubStats();
    }
  }, [authStep, activeTab, subStats, fetchSubStats]);

  // ─── Categories Management State & Handlers ───
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catNameInput, setCatNameInput] = useState("");
  const [catIconInput, setCatIconInput] = useState("Sparkles");
  const [catOrderInput, setCatOrderInput] = useState(0);
  const [subcatList, setSubcatList] = useState<string[]>([]);
  const [newSubcatInput, setNewSubcatInput] = useState("");

  const fetchAdminCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await saFetch(API_ENDPOINTS.CATEGORIES.GET_ADMIN);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        setDbCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (authStep === "dashboard" && activeTab === "categories") {
      fetchAdminCategories();
    }
  }, [authStep, activeTab, fetchAdminCategories]);

  const handleSaveCategory = async () => {
    if (!catNameInput.trim()) return safeToastError("Category name is required");
    try {
      const payload = {
        name: catNameInput.trim(),
        icon: catIconInput || "Sparkles",
        subcategories: subcatList,
        order: Number(catOrderInput) || 0,
      };

      let res;
      if (editingCategory) {
        res = await saFetch(API_ENDPOINTS.CATEGORIES.UPDATE(editingCategory._id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await saFetch(API_ENDPOINTS.CATEGORIES.CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        return safeToastError(data?.message || "Failed to save category");
      }

      safeToastSuccess(editingCategory ? "Category updated successfully" : "Category created successfully");
      setShowCategoryModal(false);
      fetchAdminCategories();
    } catch (err: any) {
      safeToastError(err.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await saFetch(API_ENDPOINTS.CATEGORIES.DELETE(id), { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return safeToastError(data?.message || "Failed to delete category");
      }
      safeToastSuccess("Category deleted successfully");
      fetchAdminCategories();
    } catch (err: any) {
      safeToastError(err.message || "Failed to delete category");
    }
  };

  const handleToggleCategoryActive = async (cat: any) => {
    try {
      const res = await saFetch(API_ENDPOINTS.CATEGORIES.UPDATE(cat._id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return safeToastError(data?.message || "Failed to update status");
      }
      safeToastSuccess(`Category ${!cat.isActive ? "activated" : "deactivated"}`);
      fetchAdminCategories();
    } catch (err) {
      safeToastError("Failed to update status");
    }
  };

  // ─── Actions ───
  const handleBlockCompany = async (id: string, block: boolean) => {
    setActionLoading(id);
    try {
      const url = block
        ? API_ENDPOINTS.SUPERADMIN.COMPANY_BLOCK(id)
        : API_ENDPOINTS.SUPERADMIN.COMPANY_UNBLOCK(id);
      await saFetch(url, { method: "PUT" });
      await fetchCompanies();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm("Delete this company and ALL related data? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      await saFetch(API_ENDPOINTS.SUPERADMIN.COMPANY_DELETE(id), { method: "DELETE" });
      await Promise.all([fetchCompanies(), fetchStats()]);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const openEditCompany = (c: SACompany) => {
    setEditCompany(c);
    setEditForm({ name: c.name, phone: c.phone, email: c.email, city: c.city, companyType: c.companyType, address: "", state: "", zipCode: "", gstNo: "", upiId: "", description: "" });
  };

  const handleSaveCompany = async () => {
    if (!editCompany) return;
    setActionLoading(editCompany._id);
    try {
      await saFetch(API_ENDPOINTS.SUPERADMIN.COMPANY_EDIT(editCompany._id), {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      setEditCompany(null);
      await fetchCompanies();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleResetOwnerPassword = async (id: string) => {
    if (!confirm("Send a password reset email to this company's owner?")) return;
    setActionLoading(id);
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.COMPANY_RESET_PASSWORD(id), { method: "POST" });
      const data = await res.json();
      alert(data.message || "Reset email sent");
    } catch { /* ignore */ }
    setActionLoading(null);
  };



  const handleDeleteOwner = (mongoUserId: string, ownerName: string) => {
    setTotpModal({ action: "deleteOwner", args: [mongoUserId, ownerName] });
    setActionTotpCode("");
    setActionTotpError("");
  };

  const handleBlockOwner = (mongoUserId: string, block: boolean) => {
    setTotpModal({ action: "blockOwner", args: [mongoUserId, block] });
    setActionTotpCode("");
    setActionTotpError("");
  };

  const handleResetUserPassword = (mongoUserId: string) => {
    setTotpModal({ action: "resetUserPassword", args: [mongoUserId] });
    setActionTotpCode("");
    setActionTotpError("");
  };

  const handleRestoreUser = (backupId: string) => {
    setTotpModal({ action: "restoreUser", args: [backupId] });
    setActionTotpCode("");
    setActionTotpError("");
  };

  const handleDeleteUserBackup = async (backupId: string) => {
    if (!confirm("Permanently delete this backup? This action cannot be undone.")) return;
    setActionLoading(backupId);
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USER_BACKUP_DELETE(backupId), { method: "DELETE" });
      if (res.ok) {
        await fetchDeletedUsers();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete backup");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenModifySub = (userId: string, userName: string, currentPlan: string, currentBilling: string, currentStatus: string) => {
    setModifySubModal({ userId, userName, currentPlan, currentBilling, currentStatus });
    setModPlanSlug(currentPlan || "pro");
    setModIsUnlimited(currentBilling === "unlimited" || currentPlan === "business" || currentPlan === "unlimited");
    setModStatus(currentStatus || "active");
    setModDurationMonths(1);
  };

  const handleSaveModifySub = async () => {
    if (!modifySubModal) return;
    setActionLoading("modify-sub");
    try {
      const res = await saFetch(API_ENDPOINTS.SUPERADMIN.SUBSCRIPTION_MODIFY(modifySubModal.userId), {
        method: "PUT",
        body: JSON.stringify({
          planSlug: modPlanSlug,
          durationMonths: modIsUnlimited ? 9999 : modDurationMonths,
          isUnlimited: modIsUnlimited,
          status: modStatus,
          billing: modIsUnlimited ? "unlimited" : "monthly",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Subscription updated successfully!");
        setModifySubModal(null);
        await Promise.all([fetchSaSubscriptions(saSubPage, saSubStatusFilter, saSubPlanFilter), fetchUsers(), fetchSubStats()]);
      } else {
        alert(data.message || "Failed to update subscription");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrantTrialOpen = (mongoUserId: string, ownerName: string) => {
    setTrialModal({ mongoUserId, ownerName });
    setTrialMonths(1);
  };

  const handleGrantTrialConfirm = () => {
    if (!trialModal) return;
    setTotpModal({ action: "grantTrial", args: [trialModal.mongoUserId, trialMonths] });
    setActionTotpCode("");
    setActionTotpError("");
    setTrialModal(null);
  };

  // Verify TOTP then execute the pending action
  const executeVerifiedAction = async () => {
    if (actionTotpCode.length !== 6) return;
    setActionTotpLoading(true);
    setActionTotpError("");
    try {
      // Verify TOTP first
      const verifyRes = await saFetch(API_ENDPOINTS.SUPERADMIN.VERIFY_ACTION_TOTP, {
        method: "POST",
        body: JSON.stringify({ code: actionTotpCode }),
      });
      if (!verifyRes.ok) {
        const d = await verifyRes.json();
        setActionTotpError(d.message || "Invalid TOTP code");
        setActionTotpLoading(false);
        return;
      }

      const pending = totpModal;
      setTotpModal(null);
      setActionTotpCode("");

      if (!pending) return;

      // Execute the action
      if (pending.action === "deleteOwner") {
        const [mongoUserId, ownerName] = pending.args as [string, string];
        setActionLoading(mongoUserId);
        try {
          const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USER_DELETE(mongoUserId), { method: "DELETE" });
          const data = await res.json();
          if (res.ok && data.backupId) {
            setDeleteResult({ backupId: data.backupId, ownerName: ownerName, counts: data.counts || {} });
          }
          await Promise.all([fetchCompanies(), fetchStats(), fetchDeletedUsers()]);
        } catch { /* ignore */ }
        setActionLoading(null);
      } else if (pending.action === "blockOwner") {
        const [mongoUserId, block] = pending.args as [string, boolean];
        setActionLoading(mongoUserId);
        try {
          const url = block ? API_ENDPOINTS.SUPERADMIN.USER_BLOCK(mongoUserId) : API_ENDPOINTS.SUPERADMIN.USER_UNBLOCK(mongoUserId);
          await saFetch(url, { method: "PUT" });
          await fetchCompanies();
        } catch { /* ignore */ }
        setActionLoading(null);
      } else if (pending.action === "resetUserPassword") {
        const [mongoUserId] = pending.args as [string];
        setActionLoading(mongoUserId);
        try {
          const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USER_RESET_PASSWORD(mongoUserId), { method: "POST" });
          const data = await res.json();
          alert(data.message || "Reset email sent");
        } catch { /* ignore */ }
        setActionLoading(null);
      } else if (pending.action === "restoreUser") {
        const [backupId] = pending.args as [string];
        setActionLoading("restore-user");
        try {
          const res = await saFetch(API_ENDPOINTS.SUPERADMIN.USER_RESTORE(backupId), { method: "POST" });
          const data = await res.json();
          if (res.ok) {
            alert(`User restored successfully!\n${data.restored?.join("\n") || ""}`);
            setDeleteResult(null);
            await Promise.all([fetchCompanies(), fetchStats(), fetchDeletedUsers()]);
          } else {
            alert(data.message || "Restore failed");
          }
        } catch { /* ignore */ }
        setActionLoading(null);
      } else if (pending.action === "grantTrial") {
        const [mongoUserId, months] = pending.args as [string, number];
        setActionLoading(mongoUserId);
        try {
          const res = await saFetch(API_ENDPOINTS.SUPERADMIN.GRANT_PRO_TRIAL(mongoUserId), {
            method: "POST",
            body: JSON.stringify({ months }),
          });
          const data = await res.json();
          if (res.ok) {
            alert(data.message || `Pro trial granted for ${months} month(s)`);
          } else {
            alert(data.message || "Failed to grant trial");
          }
        } catch { /* ignore */ }
        setActionLoading(null);
      }
    } catch {
      setActionTotpError("Network error");
    }
    setActionTotpLoading(false);
  };

  const handleToggleMaintenance = async () => {
    setActionLoading("maintenance");
    try {
      await saFetch(API_ENDPOINTS.SUPERADMIN.MAINTENANCE, {
        method: "POST",
        body: JSON.stringify({ enabled: !maintenance }),
      });
      setMaintenance(!maintenance);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleBackup = async () => {
    setActionLoading("backup");
    try {
      const token = getSAToken();
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.BACKUP, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renote-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleRestore = async (file: File) => {
    setActionLoading("restore");
    try {
      const formData = new FormData();
      formData.append("backup", file);
      formData.append("confirm", "RESTORE");
      const token = getSAToken();
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.RESTORE, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Restore complete:\n${data.restored?.join("\n")}`);
        await Promise.all([fetchStats(), fetchCompanies()]);
      } else {
        alert(data.message || "Restore failed");
      }
    } catch { /* ignore */ }
    setActionLoading(null);
    setRestoreConfirmOpen(false);
  };

  const handleDownloadUserBackup = async (backupId: string, userName: string, deletedAt: string) => {
    try {
      const token = getSAToken();
      const res = await fetch(API_ENDPOINTS.SUPERADMIN.USER_BACKUP_DOWNLOAD(backupId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (userName || "Unknown").replace(/\s+/g, "_");
      const dateStr = new Date(deletedAt).toISOString().slice(0, 19).replace(/:/g, "-") + "Z";
      a.download = `${safeName}_${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleShareWhatsApp = (userName: string, deletedAt: string, counts: Record<string, number>) => {
    const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);
    const date = new Date(deletedAt);
    const text = `reNote User Backup\nUser: ${userName}\nDate: ${date.toLocaleDateString()}\nItems: ${totalItems} (${counts.companies || 0} companies, ${counts.invoices || 0} invoices, ${counts.quotations || 0} estimations, ${counts.posters || 0} posters, ${counts.products || 0} products)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  // ─── Derived: unique categories ───
  const companyCategories = Array.from(new Set(companies.map((c) => c.companyType).filter(Boolean))).sort();

  // ─── Filtered data ───
  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) || c.ownerName?.toLowerCase().includes(q) || c.ownerEmail?.toLowerCase().includes(q);
    const matchesStatus = companyStatusFilter === "all" || (companyStatusFilter === "active" && !c.isDeleted) || (companyStatusFilter === "blocked" && c.isDeleted);
    const matchesCategory = companyCategoryFilter === "all" || c.companyType === companyCategoryFilter;
    const matchesType = companyTypeFilter === "all" || c.flag === companyTypeFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesType;
  });

  // ─── Sorted companies (vendors first within each sort) ───
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const flagOrder = (f: string) => (f === "vendor" ? 0 : 1);
    const flagDiff = flagOrder(a.flag) - flagOrder(b.flag);
    if (companySortBy === "user") return flagDiff || (a.ownerName || "").localeCompare(b.ownerName || "");
    if (companySortBy === "name") return flagDiff || a.name.localeCompare(b.name);
    if (companySortBy === "category") return flagDiff || (a.companyType || "").localeCompare(b.companyType || "");
    if (companySortBy === "status") return flagDiff || Number(a.isDeleted) - Number(b.isDeleted);
    return flagDiff;
  });

  // ─── Group sorted companies by owner (vendors first within each group) ───
  const companyOwnerGroups: { ownerName: string; ownerEmail: string; companies: SACompany[]; counts: { invoices: number; estimations: number; posters: number; products: number } }[] = (() => {
    const map = new Map<string, { ownerName: string; ownerEmail: string; companies: SACompany[]; counts: { invoices: number; estimations: number; posters: number; products: number } }>();
    for (const c of sortedCompanies) {
      const key = c.userId?.authId || c._id;
      if (!map.has(key)) map.set(key, { ownerName: c.ownerName || "Unknown", ownerEmail: c.ownerEmail || "", companies: [], counts: c.ownerCounts || { invoices: 0, estimations: 0, posters: 0, products: 0 } });
      map.get(key)!.companies.push(c);
    }
    const groups = Array.from(map.values()).sort((a, b) => a.ownerName.localeCompare(b.ownerName));
    for (const g of groups) {
      g.companies.sort((a, b) => (a.flag === "vendor" ? 0 : 1) - (b.flag === "vendor" ? 0 : 1));
    }
    return groups;
  })();

  const activeFilterCount = (companyStatusFilter !== "all" ? 1 : 0) + (companyCategoryFilter !== "all" ? 1 : 0) + (companyTypeFilter !== "all" ? 1 : 0);

  // Group companies by owner for hierarchy view
  const ownerGroups: OwnerGroup[] = (() => {
    const map = new Map<string, OwnerGroup>();
    for (const c of filteredCompanies) {
      const key = c.userId?.authId || c._id;
      if (!map.has(key)) {
        map.set(key, { authId: key, mongoUserId: c.userId?._id || "", ownerName: c.ownerName || "Unknown", ownerEmail: c.ownerEmail || "", ownerPhone: c.ownerPhone || "", companies: [] });
      }
      map.get(key)!.companies.push(c);
    }
    return Array.from(map.values()).sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  })();

  // ─── Filtered users (from dedicated users endpoint) ───
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  const toggleOwner = (authId: string) => {
    setExpandedOwner((prev) => (prev === authId ? null : authId));
  };

  const toggleCompanyGroup = (key: string) => {
    setExpandedCompanyGroup((prev) => (prev === key ? null : key));
  };



  // ─── Login Screen ───
  if (authStep === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 pr-12"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              onClick={handleLogin}
              disabled={authLoading || !username || !password}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {authLoading ? "Verifying..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TOTP Screen ───
  if (authStep === "totp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="w-10 h-10 text-orange-500" />
            <h1 className="text-2xl font-bold text-white">2FA Verification</h1>
          </div>
          <p className="text-gray-400 text-center text-sm mb-6">
            Enter the 6-digit code from Google Authenticator
          </p>
          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && totpCode.length === 6 && handleVerifyTotp()}
              className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:border-orange-500"
              placeholder="000000"
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button
              onClick={handleVerifyTotp}
              disabled={authLoading || totpCode.length !== 6}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {authLoading ? "Verifying..." : "Verify"}
            </button>
            <button
              onClick={() => { setAuthStep("login"); setAuthError(""); setTotpCode(""); }}
              className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  const sidebarItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { key: "users", label: "Users", icon: <Users className="w-5 h-5" /> },
    { key: "companies", label: "Global Companies", icon: <Building2 className="w-5 h-5" /> },
    { key: "payments", label: "Payments", icon: <CreditCard className="w-5 h-5" /> },
    { key: "categories", label: "Categories", icon: <Tag className="w-5 h-5" /> },
    { key: "analytics", label: "Analytics", icon: <Activity className="w-5 h-5" /> },
    { key: "system", label: "System Control", icon: <Settings className="w-5 h-5" /> },
    { key: "account", label: "Account Profile", icon: <UserCog className="w-5 h-5" /> },
  ];

  const pageTitle: Record<Tab, string> = {
    dashboard: "Dashboard",
    companies: "Global Companies",
    users: "Users",
    payments: "Payments",
    categories: "Categories & Subcategories",
    analytics: "Analytics",
    system: "System Control",
    account: "Account Profile",
  };

  const pageSubtitle: Record<Tab, string> = {
    dashboard: "Overview of reNote platform metrics.",
    companies: "All registered companies across the platform.",
    users: "Manage all registered platform users.",
    payments: "Subscription and payment management.",
    categories: "Manage dynamic marketplace categories and subcategories taxonomy.",
    analytics: "Platform usage and growth analytics.",
    system: "Maintenance, backup and restore controls.",
    account: "Manage your super admin profile.",
  };

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: <Users className="w-6 h-6" />, color: "text-blue-400" },
        { label: "Companies", value: stats.totalCompanies, icon: <Building2 className="w-6 h-6" />, color: "text-green-400" },
        { label: "Posters", value: stats.totalPosters, icon: <Image className="w-6 h-6" />, color: "text-purple-400" },
        { label: "Invoices", value: stats.totalInvoices, icon: <Receipt className="w-6 h-6" />, color: "text-yellow-400" },
        { label: "Estimations", value: stats.totalQuotations, icon: <FileText className="w-6 h-6" />, color: "text-pink-400" },
        { label: "Products", value: stats.totalProducts, icon: <Package className="w-6 h-6" />, color: "text-cyan-400" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0f1422] border-r border-gray-800 flex flex-col fixed h-full z-40">
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">reNote Central</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Platform Control</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button key={item.key} onClick={() => { setActiveTab(item.key); setSearchQuery(""); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.key ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{pageTitle[activeTab]}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pageSubtitle[activeTab]}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${maintenance ? "bg-red-500" : "bg-emerald-500"}`} />
              <span className="text-xs font-medium text-gray-300">{maintenance ? "MAINTENANCE" : "SYSTEM LIVE"}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm font-bold">SA</div>
          </div>
        </header>

        <main className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Dashboard Page ── */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 rounded-2xl shadow-2xl">
                    {statCards.map((s) => (
                      <div key={s.label} className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                        <div className={`${s.color} mb-2`}>{s.icon}</div>
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl shadow-2xl">
                      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-green-400 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-sm">New this week</span></div>
                        <p className="text-3xl font-bold text-white">{stats.newUsersWeek}</p>
                        <p className="text-xs text-gray-400">users registered</p>
                      </div>
                      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-sm">New this month</span></div>
                        <p className="text-3xl font-bold text-white">{stats.newUsersMonth}</p>
                        <p className="text-xs text-gray-400">users registered</p>
                      </div>
                      <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-purple-400 mb-1"><Building2 className="w-4 h-4" /><span className="text-sm">Active companies</span></div>
                        <p className="text-3xl font-bold text-white">{stats.activeCompanies}</p>
                        <p className="text-xs text-gray-400">not blocked</p>
                      </div>
                    </div>
                  )}
                  {userGrowth.length > 0 && (
                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4">User Signups (Last 30 Days)</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="_id" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px" }} labelStyle={{ color: "#3b82f6" }} itemStyle={{ color: "#fff" }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* ── Companies Page ── */}
              {activeTab === "companies" && (
                <div className="space-y-5">
                    {/* Search + Filter Bar */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-lg">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search companies by name, owner, email..." className="w-full pl-11 pr-4 py-2.5 bg-[#111827] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm" />
                        </div>
                        <button onClick={() => setShowCompanyFilters((p) => !p)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${showCompanyFilters || activeFilterCount > 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-[#111827] border-gray-800 text-gray-400 hover:text-white"}`}>
                          <SlidersHorizontal className="w-4 h-4" />
                          Filters{activeFilterCount > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
                        </button>
                        <span className="text-sm text-gray-500 hidden sm:block">{sortedCompanies.length} companies</span>
                      </div>

                      {/* Filter Panel */}
                      {showCompanyFilters && (
                        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#111827] border border-gray-800 rounded-xl">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Type</label>
                            <select value={companyTypeFilter} onChange={(e) => setCompanyTypeFilter(e.target.value as "all" | "vendor" | "customer")} className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                              <option value="all">All Types</option>
                              <option value="vendor">Vendor</option>
                              <option value="customer">Customer</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</label>
                            <select value={companyStatusFilter} onChange={(e) => setCompanyStatusFilter(e.target.value as "all" | "active" | "blocked")} className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                              <option value="all">All Status</option>
                              <option value="active">Active</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Category</label>
                            <select value={companyCategoryFilter} onChange={(e) => setCompanyCategoryFilter(e.target.value)} className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                              <option value="all">All Categories</option>
                              {companyCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Sort By</label>
                            <select value={companySortBy} onChange={(e) => setCompanySortBy(e.target.value as "user" | "name" | "category" | "status")} className="bg-[#0a0e1a] border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                              <option value="user">Owner (User)</option>
                              <option value="name">Company Name</option>
                              <option value="category">Category</option>
                              <option value="status">Status</option>
                            </select>
                          </div>
                          {activeFilterCount > 0 && (
                            <button onClick={() => { setCompanyStatusFilter("all"); setCompanyCategoryFilter("all"); setCompanyTypeFilter("all"); }} className="self-end text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5">
                              Clear Filters
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  {/* Companies grouped by owner */}
                  {companySortBy === "user" ? (
                    <div className="space-y-3">
                      {companyOwnerGroups.map((group) => {
                        const groupKey = group.ownerName + group.ownerEmail;
                        const isExpanded = expandedCompanyGroup === groupKey;
                        const oc = group.counts;
                        return (
                        <div key={groupKey} className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                          <button type="button" onClick={() => toggleCompanyGroup(groupKey)} className="w-full flex items-center gap-3 px-5 py-3.5 bg-[#0f1422] hover:bg-[#131928] transition-colors cursor-pointer text-left">
                            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}><ChevronRight className="w-4 h-4 text-gray-500" /></div>
                            <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-blue-400" /></div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-white">{group.ownerName}</span>
                              {group.ownerEmail && <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{group.ownerEmail}</span>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{group.companies.filter((c) => c.flag === "vendor").length} Vendor</span>
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">{group.companies.filter((c) => c.flag !== "vendor").length} Customer</span>
                              <span className="hidden sm:inline-block w-px h-4 bg-gray-700" />
                              <span title="Invoices" className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400"><Receipt className="w-3.5 h-3.5" />{oc.invoices}</span>
                              <span title="Estimations" className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-pink-500/10 text-pink-400"><FileText className="w-3.5 h-3.5" />{oc.estimations}</span>
                              <span title="Products" className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-cyan-500/10 text-cyan-400"><Package className="w-3.5 h-3.5" />{oc.products}</span>
                              <span title="Posters" className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs bg-purple-500/10 text-purple-300"><Image className="w-3.5 h-3.5" />{oc.posters}</span>
                            </div>
                          </button>
                          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="border-t border-gray-800/60">
                          {/* User Stats Row */}
                          <div className="flex flex-wrap items-center gap-4 px-5 py-2.5 bg-[#0d1119] border-b border-gray-800/40">
                            <div className="flex items-center gap-1.5 text-xs"><Receipt className="w-3.5 h-3.5 text-yellow-400" /><span className="text-gray-400">Invoices</span><span className="font-semibold text-white">{oc.invoices}</span></div>
                            <div className="flex items-center gap-1.5 text-xs"><FileText className="w-3.5 h-3.5 text-pink-400" /><span className="text-gray-400">Estimations</span><span className="font-semibold text-white">{oc.estimations}</span></div>
                            <div className="flex items-center gap-1.5 text-xs"><Package className="w-3.5 h-3.5 text-cyan-400" /><span className="text-gray-400">Products</span><span className="font-semibold text-white">{oc.products}</span></div>
                            <div className="flex items-center gap-1.5 text-xs"><Image className="w-3.5 h-3.5 text-purple-400" /><span className="text-gray-400">Posters</span><span className="font-semibold text-white">{oc.posters}</span></div>
                          </div>
                          {/* Desktop Table */}
                          <div className="hidden md:block">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-800/50 text-gray-600 text-[10px] uppercase tracking-wider">
                                  <th className="text-left py-2 px-5">Company Name</th>
                                  <th className="text-left py-2 px-5">Type</th>
                                  <th className="text-left py-2 px-5">Category</th>
                                  <th className="text-left py-2 px-5">Contact</th>
                                  <th className="text-left py-2 px-5">Location</th>
                                  <th className="text-left py-2 px-5">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.companies.map((c) => (
                                  <tr key={c._id} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                                    <td className="py-3 px-5">
                                      <p className="font-medium text-white text-sm">{c.name}</p>
                                      <p className="text-[10px] text-gray-600 mt-0.5">ID: {c._id.slice(0, 20)}...</p>
                                    </td>
                                    <td className="py-3 px-5"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.flag === "vendor" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>{c.flag === "vendor" ? "Vendor" : "Customer"}</span></td>
                                    <td className="py-3 px-5"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{c.companyType || "N/A"}</span></td>
                                    <td className="py-3 px-5"><p className="text-sm text-white">{c.phone || "—"}</p><p className="text-xs text-gray-500">{c.email || "—"}</p></td>
                                    <td className="py-3 px-5 text-gray-300 text-sm">{c.city || "—"}</td>
                                    <td className="py-3 px-5"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.isDeleted ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}>{c.isDeleted ? "Blocked" : "Active"}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Mobile Cards */}
                          <div className="md:hidden p-3 space-y-2">
                            {group.companies.map((c) => (
                              <div key={c._id} className="bg-[#0a0e1a] border border-gray-800/50 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div><h4 className="font-medium text-sm text-white">{c.name}</h4><p className="text-[10px] text-gray-600">{c.flag === "vendor" ? "Vendor" : "Customer"} · {c.companyType || "N/A"}</p></div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.isDeleted ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{c.isDeleted ? "Blocked" : "Active"}</span>
                                </div>
                                <p className="text-xs text-gray-400">{c.phone || "—"} · {c.city || "—"}</p>
                              </div>
                            ))}
                          </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {companyOwnerGroups.length === 0 && <p className="text-center text-gray-600 py-12">No companies found</p>}
                    </div>
                  ) : (
                    /* Flat table when not sorting by user */
                    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                      <div className="hidden md:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                              <th className="text-left py-3 px-5">Company Name</th>
                              <th className="text-left py-3 px-5">Owner</th>
                              <th className="text-left py-3 px-5">Type</th>
                              <th className="text-left py-3 px-5">Category</th>
                              <th className="text-left py-3 px-5">Contact</th>
                              <th className="text-left py-3 px-5">Location</th>
                              <th className="text-left py-3 px-5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedCompanies.map((c) => (
                              <tr key={c._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                <td className="py-4 px-5">
                                  <p className="font-semibold text-white text-sm">{c.name}</p>
                                  <p className="text-[11px] text-gray-600 mt-0.5">ID: {c._id.slice(0, 20)}...</p>
                                </td>
                                <td className="py-4 px-5 text-sm text-gray-300">{c.ownerName || "—"}</td>
                                <td className="py-4 px-5"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.flag === "vendor" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>{c.flag === "vendor" ? "Vendor" : "Customer"}</span></td>
                                <td className="py-4 px-5"><span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">{c.companyType || "N/A"}</span></td>
                                <td className="py-4 px-5"><p className="text-sm text-white">{c.phone || "—"}</p><p className="text-xs text-gray-500">{c.email || "—"}</p></td>
                                <td className="py-4 px-5 text-gray-300 text-sm">{c.city || "—"}</td>
                                <td className="py-4 px-5"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${c.isDeleted ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}>{c.isDeleted ? "Blocked" : "Active"}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden p-4 space-y-3">
                        {sortedCompanies.map((c) => (
                          <div key={c._id} className="bg-[#0a0e1a] border border-gray-800 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-sm text-white">{c.name}</h3>
                                <p className="text-[10px] text-gray-600 mt-0.5">{c.ownerName || "Unknown"}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.isDeleted ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{c.isDeleted ? "Blocked" : "Active"}</span>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-400">
                              <p><span className="text-gray-600">Category:</span> {c.companyType || "N/A"}</p>
                              <p><span className="text-gray-600">Contact:</span> {c.phone || "—"} · {c.email || "—"}</p>
                              <p><span className="text-gray-600">Location:</span> {c.city || "—"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {sortedCompanies.length === 0 && <p className="text-center text-gray-600 py-12">No companies found</p>}
                    </div>
                  )}
                </div>
              )}

              {/* ── Users Page ── */}
              {activeTab === "users" && (
                <div className="flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
                  <div className="flex-1 overflow-y-auto space-y-6 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users by name, email, phone..." className="w-full pl-11 pr-4 py-2.5 bg-[#111827] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{filteredUsers.length} users</span>
                      <button onClick={fetchUsers} disabled={usersLoading} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Refresh Users">
                        <RefreshCw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="text-left py-3 px-5">User</th>
                            <th className="text-left py-3 px-5">Email</th>
                            <th className="text-left py-3 px-5">Phone</th>
                            <th className="text-left py-3 px-5">Role</th>
                            <th className="text-left py-3 px-5">Companies</th>
                            <th className="text-left py-3 px-5">Status</th>
                            <th className="text-right py-3 px-5">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => (
                            <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center"><User className="w-4 h-4 text-blue-400" /></div>
                                  <div>
                                    <span className="font-semibold text-sm text-white">{u.name}</span>
                                    {u.lastLoggedInAt && <p className="text-[10px] text-gray-600">Last login: {new Date(u.lastLoggedInAt).toLocaleDateString()}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-gray-400 text-sm">{u.email || "—"}</td>
                              <td className="py-4 px-5 text-gray-400 text-sm">{u.phone || "—"}</td>
                              <td className="py-4 px-5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === "PARAM" ? "bg-orange-500/15 text-orange-400" : "bg-gray-500/15 text-gray-400"}`}>{u.role || "USER"}</span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{u.companiesCount}</span>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${u.isBlocked ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{u.isBlocked ? "Blocked" : "Active"}</span>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleGrantTrialOpen(u._id, u.name)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-400/10 transition-colors disabled:opacity-50" title="Grant Pro Trial"><Crown className="w-[18px] h-[18px] stroke-[2]" /></button>
                                  <button onClick={() => handleResetUserPassword(u._id)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-50" title="Reset Password"><Lock className="w-[18px] h-[18px] stroke-[2]" /></button>
                                  <button onClick={() => handleBlockOwner(u._id, !u.isBlocked)} disabled={actionLoading === u._id} className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${u.isBlocked ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-400/10" : "text-gray-500 hover:text-amber-400 hover:bg-amber-400/10"}`} title={u.isBlocked ? "Unblock" : "Block"}>{u.isBlocked ? <CheckCircle className="w-[18px] h-[18px] stroke-[2]" /> : <Ban className="w-[18px] h-[18px] stroke-[2]" />}</button>
                                  <button onClick={() => handleDeleteOwner(u._id, u.name)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50" title="Delete"><Trash2 className="w-[18px] h-[18px] stroke-[2]" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden p-4 space-y-3">
                      {filteredUsers.map((u) => (
                        <div key={u._id} className="bg-[#0a0e1a] border border-gray-800 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center"><User className="w-4 h-4 text-blue-400" /></div>
                            <div>
                              <p className="font-semibold text-sm">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isBlocked ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{u.isBlocked ? "Blocked" : "Active"}</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{u.phone || "—"} · {u.companiesCount} companies · {u.role || "USER"}</p>
                          <div className="flex items-center gap-1 border-t border-gray-800 pt-3">
                            <button onClick={() => handleGrantTrialOpen(u._id, u.name)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-400/10 transition-colors disabled:opacity-50"><Crown className="w-[18px] h-[18px] stroke-[2]" /></button>
                            <button onClick={() => handleResetUserPassword(u._id)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-50"><Lock className="w-[18px] h-[18px] stroke-[2]" /></button>
                            <button onClick={() => handleBlockOwner(u._id, !u.isBlocked)} disabled={actionLoading === u._id} className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${u.isBlocked ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-400/10" : "text-gray-500 hover:text-amber-400 hover:bg-amber-400/10"}`}>{u.isBlocked ? <CheckCircle className="w-[18px] h-[18px] stroke-[2]" /> : <Ban className="w-[18px] h-[18px] stroke-[2]" />}</button>
                            <button onClick={() => handleDeleteOwner(u._id, u.name)} disabled={actionLoading === u._id} className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"><Trash2 className="w-[18px] h-[18px] stroke-[2]" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredUsers.length === 0 && <p className="text-center text-gray-600 py-12">{usersLoading ? "Loading users..." : "No users found"}</p>}
                  </div>
                  </div>

                  {/* User Backups — Fixed at bottom */}
                  <div className="shrink-0 border-t border-gray-800 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h3 className="text-base font-bold text-white">User Backups</h3>
                      </div>
                      <button onClick={fetchDeletedUsers} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>
                    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                      {deletedUsers.length > 0 ? (
                        <>
                          {/* Desktop Table */}
                          <div className="hidden md:block">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                                  <th className="text-left py-3 px-5">Backup File</th>
                                  <th className="text-left py-3 px-5">Size</th>
                                  <th className="text-left py-3 px-5">Created</th>
                                  <th className="text-right py-3 px-5">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deletedUsers.map((du) => {
                                  const totalItems = Object.values(du.counts).reduce((a, b) => a + b, 0);
                                  const remainingDays = Math.max(0, Math.round(du.remainingMs / (1000 * 60 * 60 * 24)));
                                  const remainingLabel = remainingDays > 30 ? `${Math.round(remainingDays / 30)}mo` : `${remainingDays}d`;
                                  const createdDate = new Date(du.deletedAt);
                                  const fileName = `${du.userName.replace(/\s+/g, "_")}_${createdDate.toISOString().slice(0, 19).replace(/:/g, "-")}Z.zip`;
                                  return (
                                    <tr key={du.backupId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                      <td className="py-4 px-5 text-white text-sm font-medium">{fileName}</td>
                                      <td className="py-4 px-5 text-gray-400 text-sm">{totalItems} items</td>
                                      <td className="py-4 px-5 text-gray-400 text-sm">{createdDate.toLocaleDateString()}, {createdDate.toLocaleTimeString()}</td>
                                      <td className="py-4 px-5">
                                        <div className="flex items-center justify-end gap-3">
                                          <span className="text-xs text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" />{remainingLabel}</span>
                                          <button onClick={() => handleDownloadUserBackup(du.backupId, du.userName, du.deletedAt)} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                            <Download className="w-[18px] h-[18px] stroke-[2]" />
                                            Download
                                          </button>
                                          <button onClick={() => handleShareWhatsApp(du.userName, du.deletedAt, du.counts)} className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                                            <Share2 className="w-[18px] h-[18px] stroke-[2]" />
                                            WhatsApp
                                          </button>
                                          <span className="text-gray-700">|</span>
                                          <button onClick={() => handleRestoreUser(du.backupId)} disabled={actionLoading === "restore-user"} className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors disabled:opacity-50">
                                            <RotateCcw className="w-[18px] h-[18px] stroke-[2]" />
                                            Restore
                                          </button>
                                          <span className="text-gray-700">|</span>
                                          <button onClick={() => handleDeleteUserBackup(du.backupId)} disabled={actionLoading === du.backupId} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                                            <Trash2 className="w-[18px] h-[18px] stroke-[2]" />
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Mobile Cards */}
                          <div className="md:hidden p-4 space-y-3">
                            {deletedUsers.map((du) => {
                              const totalItems = Object.values(du.counts).reduce((a, b) => a + b, 0);
                              const remainingDays = Math.max(0, Math.round(du.remainingMs / (1000 * 60 * 60 * 24)));
                              const remainingLabel = remainingDays > 30 ? `${Math.round(remainingDays / 30)}mo left` : `${remainingDays}d left`;
                              const createdDate = new Date(du.deletedAt);
                              return (
                                <div key={du.backupId} className="bg-[#0a0e1a] border border-gray-800 rounded-xl p-4">
                                  <p className="text-sm font-medium text-white mb-1">{du.userName}</p>
                                  <p className="text-xs text-gray-500 mb-3">{createdDate.toLocaleDateString()}, {createdDate.toLocaleTimeString()} · {totalItems} items · {remainingLabel}</p>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <button onClick={() => handleDownloadUserBackup(du.backupId, du.userName, du.deletedAt)} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"><Download className="w-[18px] h-[18px] stroke-[2]" />Download</button>
                                    <button onClick={() => handleShareWhatsApp(du.userName, du.deletedAt, du.counts)} className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"><Share2 className="w-[18px] h-[18px] stroke-[2]" />WhatsApp</button>
                                    <button onClick={() => handleRestoreUser(du.backupId)} disabled={actionLoading === "restore-user"} className="flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"><RotateCcw className="w-[18px] h-[18px] stroke-[2]" />Restore</button>
                                    <button onClick={() => handleDeleteUserBackup(du.backupId)} disabled={actionLoading === du.backupId} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><Trash2 className="w-[18px] h-[18px] stroke-[2]" />Delete</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-gray-600 py-10">No backups available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Analytics Page ── */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {userGrowth.length > 0 ? (
                    <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-4">User Signups (Last 30 Days)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="_id" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px" }} labelStyle={{ color: "#3b82f6" }} itemStyle={{ color: "#fff" }} />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 py-12">No growth data available</p>
                  )}
                </div>
              )}

              {/* ── Payments & Subscriptions Page ── */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  {/* Sub-nav */}
                  <div className="flex gap-2 flex-wrap">
                    {(["overview", "subscriptions", "payments"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setPayViewMode(v);
                          if (v === "overview") fetchSubStats();
                          if (v === "subscriptions") fetchSaSubscriptions(1, saSubStatusFilter, saSubPlanFilter);
                          if (v === "payments") fetchSaPayments(1, saPayStatusFilter, saPayPlanFilter);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                          payViewMode === v ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Overview */}
                  {payViewMode === "overview" && (
                    <div className="space-y-6">
                      {!subStats ? (
                        <div className="flex justify-center py-12">
                          <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-2xl shadow-2xl">
                            {[
                              { label: "Active Subscriptions", value: subStats.activeSubscriptions, color: "text-green-400" },
                              { label: "MRR (This Month)", value: `₹${(subStats.mrr / 100).toLocaleString("en-IN")}`, color: "text-orange-400" },
                              { label: "Total Revenue", value: `₹${(subStats.totalRevenue / 100).toLocaleString("en-IN")}`, color: "text-blue-400" },
                              { label: "Churn (30d)", value: subStats.churnLast30Days, color: "text-red-400" },
                            ].map((s, i) => (
                              <div key={i} className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Plan breakdown */}
                          {Object.keys(subStats.planCounts).length > 0 && (
                            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
                              <h4 className="text-sm font-semibold text-gray-400 mb-3">Active by Plan</h4>
                              <div className="flex gap-4 flex-wrap">
                                {Object.entries(subStats.planCounts).map(([slug, count]) => (
                                  <div key={slug} className="bg-gray-800 rounded-lg px-4 py-2 text-center">
                                    <p className="text-lg font-bold text-white">{count as number}</p>
                                    <p className="text-xs text-gray-400 capitalize">{slug}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent payments */}
                          {subStats.recentPayments.length > 0 && (
                            <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
                              <h4 className="text-sm font-semibold text-gray-400 mb-3">Recent Payments</h4>
                              <div className="space-y-2">
                                {subStats.recentPayments.map((p: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-sm bg-gray-800/50 rounded-lg px-4 py-2">
                                    <span className="text-gray-300 capitalize">{p.planSlug} · {p.billing}</span>
                                    <span className="text-green-400 font-medium">₹{(p.amount / 100).toLocaleString("en-IN")}</span>
                                    <span className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Subscriptions Table */}
                  {payViewMode === "subscriptions" && (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <select value={saSubStatusFilter} onChange={(e) => { setSaSubStatusFilter(e.target.value); fetchSaSubscriptions(1, e.target.value, saSubPlanFilter); }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                          <option value="">All Status</option>
                          {["active", "pending", "cancelled", "expired", "halted"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={saSubPlanFilter} onChange={(e) => { setSaSubPlanFilter(e.target.value); fetchSaSubscriptions(1, saSubStatusFilter, e.target.value); }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                          <option value="">All Plans</option>
                          {["free", "starter", "pro", "business", "unlimited"].map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                        </select>
                      </div>

                      {subLoading ? (
                        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-500" /></div>
                      ) : saSubscriptions.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No subscriptions found</p>
                      ) : (
                        <div className="overflow-x-auto bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                              <tr>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Plan</th>
                                <th className="px-4 py-3 text-left">Storage (Used / Limit / Left)</th>
                                <th className="px-4 py-3 text-left">Billing</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Period End</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {saSubscriptions.map((sub: any) => (
                                <tr key={sub._id} className="hover:bg-gray-800/30">
                                  <td className="px-4 py-3 text-gray-300">
                                    <p className="font-semibold text-white">{sub.userId?.name || sub.userId?.email || "—"}</p>
                                    <p className="text-xs text-gray-500">{sub.userId?.email || sub.userId?.phone || ""}</p>
                                  </td>
                                  <td className="px-4 py-3 text-gray-300 capitalize">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      sub.planSlug === "unlimited" || sub.billing === "unlimited" ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                                      : sub.planSlug === "business" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                      : sub.planSlug === "pro" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                      : sub.planSlug === "starter" ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                                      : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                                    }`}>{sub.plan?.name || sub.planSlug}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5 text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-white">{sub.storageInfo?.usedFormatted || "0 Bytes"}</span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-gray-400">{sub.storageInfo?.maxFormatted || "Unlimited"}</span>
                                      </div>
                                      <span className={`text-[11px] font-medium ${sub.storageInfo?.isUnlimited ? "text-purple-400 font-semibold" : "text-emerald-400"}`}>
                                        {sub.storageInfo?.leftFormatted || "Unlimited"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-300 capitalize">{sub.billing}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      sub.status === "active" ? "bg-green-900/40 text-green-400"
                                        : sub.status === "pending" ? "bg-yellow-900/40 text-yellow-400"
                                        : "bg-red-900/40 text-red-400"
                                    }`}>{sub.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-400 text-xs">
                                    {sub.billing === "unlimited" || (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getFullYear() > 2090)
                                      ? "Permanent / Unlimited"
                                      : sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(sub.createdAt).toLocaleDateString("en-IN")}</td>
                                  <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleOpenModifySub(sub.userId?._id || sub.userId, sub.userId?.name || "User", sub.planSlug, sub.billing, sub.status)} className="px-3 py-1 text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors font-medium">
                                      Edit Plan
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {saSubTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-500">Page {saSubPage} of {saSubTotalPages}</span>
                          <div className="flex gap-2">
                            <button onClick={() => fetchSaSubscriptions(saSubPage - 1, saSubStatusFilter, saSubPlanFilter)} disabled={saSubPage <= 1} className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs disabled:opacity-40 hover:bg-gray-700">Prev</button>
                            <button onClick={() => fetchSaSubscriptions(saSubPage + 1, saSubStatusFilter, saSubPlanFilter)} disabled={saSubPage >= saSubTotalPages} className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs disabled:opacity-40 hover:bg-gray-700">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payments Table */}
                  {payViewMode === "payments" && (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <select value={saPayStatusFilter} onChange={(e) => { setSaPayStatusFilter(e.target.value); fetchSaPayments(1, e.target.value, saPayPlanFilter); }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                          <option value="">All Status</option>
                          {["captured", "created", "failed", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={saPayPlanFilter} onChange={(e) => { setSaPayPlanFilter(e.target.value); fetchSaPayments(1, saPayStatusFilter, e.target.value); }} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
                          <option value="">All Plans</option>
                          {["starter", "pro", "business"].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      {subLoading ? (
                        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-500" /></div>
                      ) : saPayments.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">No payments found</p>
                      ) : (
                        <div className="overflow-x-auto bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                          <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-800/50">
                              <tr>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Plan</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-left">Billing</th>
                                <th className="px-4 py-3 text-left">Method</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {saPayments.map((pay: any) => (
                                <tr key={pay._id} className="hover:bg-gray-800/30">
                                  <td className="px-4 py-3 text-gray-300">{pay.user?.firstName || pay.user?.authId || "—"}</td>
                                  <td className="px-4 py-3 text-gray-300 capitalize">{pay.planSlug}</td>
                                  <td className="px-4 py-3 text-green-400 font-medium">₹{(pay.amount / 100).toLocaleString("en-IN")}</td>
                                  <td className="px-4 py-3 text-gray-300 capitalize">{pay.billing}</td>
                                  <td className="px-4 py-3 text-gray-400 capitalize">{pay.method || "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      pay.status === "captured" ? "bg-green-900/40 text-green-400"
                                        : pay.status === "failed" ? "bg-red-900/40 text-red-400"
                                        : "bg-yellow-900/40 text-yellow-400"
                                    }`}>{pay.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(pay.createdAt).toLocaleDateString("en-IN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {saPayTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-gray-500">Page {saPayPage} of {saPayTotalPages}</span>
                          <div className="flex gap-2">
                            <button onClick={() => fetchSaPayments(saPayPage - 1, saPayStatusFilter, saPayPlanFilter)} disabled={saPayPage <= 1} className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs disabled:opacity-40 hover:bg-gray-700">Prev</button>
                            <button onClick={() => fetchSaPayments(saPayPage + 1, saPayStatusFilter, saPayPlanFilter)} disabled={saPayPage >= saPayTotalPages} className="px-3 py-1 rounded bg-gray-800 text-gray-400 text-xs disabled:opacity-40 hover:bg-gray-700">Next</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── System Control Page ── */}
              {activeTab === "system" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Maintenance Mode</h3>
                        <p className="text-sm text-gray-500 mt-1">When enabled, all users will see a maintenance page. SA dashboard remains accessible.</p>
                      </div>
                      <button onClick={handleToggleMaintenance} disabled={actionLoading === "maintenance"} className="flex-shrink-0">
                        {maintenance ? <ToggleRight className="w-12 h-12 text-red-400" /> : <ToggleLeft className="w-12 h-12 text-gray-600" />}
                      </button>
                    </div>
                    {maintenance && (
                      <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">Maintenance mode is ACTIVE — regular users cannot access the system.</div>
                    )}
                  </div>
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-2">Database Backup</h3>
                    <p className="text-sm text-gray-500 mb-4">Download a ZIP archive containing all database collections as JSON files.</p>
                    <button onClick={handleBackup} disabled={actionLoading === "backup"} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                      <Download className="w-4 h-4" />{actionLoading === "backup" ? "Creating backup..." : "Download Backup"}
                    </button>
                  </div>
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-2">Restore from Backup</h3>
                    <p className="text-sm text-gray-500 mb-4">Upload a previously downloaded backup ZIP to restore the database. <span className="text-red-400 font-medium">This will overwrite all current data.</span></p>
                    <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { if (confirm("This will OVERWRITE all current database data. Are you sure?")) { handleRestore(file); } e.target.value = ""; } }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={actionLoading === "restore"} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                      <Upload className="w-4 h-4" />{actionLoading === "restore" ? "Restoring..." : "Upload & Restore"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Account Profile Page ── */}
              {activeTab === "account" && (
                <div className="max-w-md">
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl font-bold">SA</div>
                      <div>
                        <p className="font-bold text-lg">Super Admin</p>
                        <p className="text-sm text-gray-500">Platform Controller</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-800"><span className="text-gray-500">Role</span><span className="text-white">Super Administrator</span></div>
                      <div className="flex justify-between py-2 border-b border-gray-800"><span className="text-gray-500">2FA</span><span className="text-emerald-400">Enabled</span></div>
                      <div className="flex justify-between py-2"><span className="text-gray-500">Session</span><span className="text-white">Active</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Categories Management Page ── */}
              {activeTab === "categories" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Categories & Subcategories Taxonomy</h2>
                      <p className="text-xs text-gray-400">Manage all dynamic categories and subcategories stored in MongoDB.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCatNameInput("");
                        setCatIconInput("Sparkles");
                        setCatOrderInput(dbCategories.length + 1);
                        setSubcatList([]);
                        setNewSubcatInput("");
                        setShowCategoryModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>

                  {loadingCategories ? (
                    <div className="text-center py-12 text-gray-400">Loading categories from database...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded-2xl shadow-2xl">
                      {dbCategories.map((cat) => (
                        <div key={cat._id} className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
                                  <Tag className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-base text-white">{cat.name}</h3>
                              </div>
                              <button
                                onClick={() => handleToggleCategoryActive(cat)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  cat.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {cat.isActive ? "Active" : "Inactive"}
                              </button>
                            </div>

                            {/* Subcategories Chips */}
                            <div className="mt-3">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                                Subcategories ({cat.subcategories?.length || 0}):
                              </span>
                              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto hide-scrollbar">
                                {cat.subcategories && cat.subcategories.length > 0 ? (
                                  cat.subcategories.map((sub: string) => (
                                    <span key={sub} className="bg-gray-800 border border-gray-700 text-gray-300 text-[11px] px-2 py-0.5 rounded-md">
                                      {sub}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-600 italic">No subcategories defined</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCatNameInput(cat.name);
                                setCatIconInput(cat.icon || "Sparkles");
                                setCatOrderInput(cat.order || 0);
                                setSubcatList(cat.subcategories || []);
                                setNewSubcatInput("");
                                setShowCategoryModal(true);
                              }}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Pencil className="w-[18px] h-[18px] stroke-[2]" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-[18px] h-[18px] stroke-[2]" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Category Add/Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-lg text-white">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="e.g. Electronics & Appliances"
                  className="w-full px-3 py-2 bg-[#0a0e1a] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Icon Identifier</label>
                  <input
                    type="text"
                    value={catIconInput}
                    onChange={(e) => setCatIconInput(e.target.value)}
                    placeholder="e.g. Tv, Car, Home"
                    className="w-full px-3 py-2 bg-[#0a0e1a] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={catOrderInput}
                    onChange={(e) => setCatOrderInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0a0e1a] border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Subcategories List</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubcatInput}
                    onChange={(e) => setNewSubcatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newSubcatInput.trim()) {
                          setSubcatList((prev) => [...prev, newSubcatInput.trim()]);
                          setNewSubcatInput("");
                        }
                      }
                    }}
                    placeholder="Add a subcategory and press Enter..."
                    className="flex-1 px-3 py-1.5 bg-[#0a0e1a] border border-gray-700 rounded-xl text-white text-xs outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubcatInput.trim()) {
                        setSubcatList((prev) => [...prev, newSubcatInput.trim()]);
                        setNewSubcatInput("");
                      }
                    }}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition"
                  >
                    Add
                  </button>
                </div>

                {/* List of subcategory chips */}
                <div className="flex flex-wrap gap-1.5 p-3 bg-[#0a0e1a] border border-gray-800 rounded-xl max-h-40 overflow-y-auto">
                  {subcatList.map((sub, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-gray-800 border border-gray-700 text-white text-xs px-2.5 py-1 rounded-lg">
                      {sub}
                      <button
                        type="button"
                        onClick={() => setSubcatList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {subcatList.length === 0 && <span className="text-xs text-gray-500 italic">No subcategories added yet</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Edit Company</h2>
              <button onClick={() => setEditCompany(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Name", key: "name" },
                { label: "Phone", key: "phone" },
                { label: "Email", key: "email" },
                { label: "City", key: "city" },
                { label: "Company Type", key: "companyType" },
                { label: "Address", key: "address" },
                { label: "State", key: "state" },
                { label: "Zip Code", key: "zipCode" },
                { label: "GST No", key: "gstNo" },
                { label: "UPI ID", key: "upiId" },
                { label: "Description", key: "description" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1">{label}</label>
                  <input type="text" value={editForm[key as keyof typeof editForm]} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} className="w-full px-3 py-2 bg-[#0a0e1a] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setEditCompany(null)} className="flex-1 py-2 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveCompany} disabled={actionLoading === editCompany._id} className="flex-1 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">{actionLoading === editCompany._id ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Pro Trial Modal */}
      {trialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold">Grant Pro Trial</h2>
              </div>
              <button onClick={() => { setTrialModal(null); setTrialMonths(1); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">Grant a free Pro plan trial to <span className="text-white font-semibold">{trialModal.ownerName}</span></p>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Select duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {([1, 3, 6] as const).map((m) => (
                    <button key={m} onClick={() => setTrialMonths(m)} className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${trialMonths === m ? "bg-purple-600 border-purple-500 text-white" : "bg-[#0a0e1a] border-gray-800 text-gray-400 hover:border-gray-600"}`}>
                      {m} {m === 1 ? "Month" : "Months"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setTrialModal(null); setTrialMonths(1); }} className="flex-1 py-2.5 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleGrantTrialConfirm} className="flex-1 py-2.5 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-semibold transition-colors">Grant Trial</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOTP Action Verification Modal */}
      {totpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Verify Authenticator</h2>
              </div>
              <button onClick={() => { setTotpModal(null); setActionTotpCode(""); setActionTotpError(""); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">Enter the 6-digit code from Google Authenticator to confirm this action.</p>
              <input type="text" inputMode="numeric" maxLength={6} value={actionTotpCode} onChange={(e) => setActionTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && actionTotpCode.length === 6 && executeVerifiedAction()} className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-800 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-blue-500" placeholder="000000" autoFocus />
              {actionTotpError && <p className="text-red-400 text-sm text-center">{actionTotpError}</p>}
              <button onClick={executeVerifiedAction} disabled={actionTotpLoading || actionTotpCode.length !== 6} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">{actionTotpLoading ? "Verifying..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Result — Restore Option */}
      {deleteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-red-400">User Deleted</h2>
              <button onClick={() => setDeleteResult(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-300"><span className="font-semibold">{deleteResult.ownerName}</span> and all their data has been deleted.</p>
              <div className="bg-[#0a0e1a] border border-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                {Object.entries(deleteResult.counts).map(([key, count]) => (
                  <div key={key} className="flex justify-between"><span className="capitalize">{key}</span><span className="text-white font-medium">{count}</span></div>
                ))}
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-400">A backup was created and will expire in <span className="font-bold">1 hour</span>. You can restore this user with authenticator verification.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteResult(null)} className="flex-1 py-2 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">Dismiss</button>
                <button onClick={() => handleRestoreUser(deleteResult.backupId)} disabled={actionLoading === "restore-user"} className="flex-1 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">{actionLoading === "restore-user" ? "Restoring..." : "Restore User"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Subscription Modal */}
      {modifySubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Modify Subscription</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modifySubModal.userName}</p>
              </div>
              <button onClick={() => setModifySubModal(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Select Plan</label>
                <select value={modPlanSlug} onChange={(e) => setModPlanSlug(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="free">Free Plan (Default)</option>
                  <option value="starter">Starter Plan (₹199/mo)</option>
                  <option value="pro">Pro Plan (₹349/mo)</option>
                  <option value="business">Business Plan (₹499/mo)</option>
                  <option value="unlimited">Unlimited / Enterprise (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select value={modStatus} onChange={(e) => setModStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">Permanent Unlimited Access</p>
                  <p className="text-xs text-gray-400">No expiration date (Permanent Access)</p>
                </div>
                <input
                  type="checkbox"
                  checked={modIsUnlimited}
                  onChange={(e) => {
                    setModIsUnlimited(e.target.checked);
                    if (e.target.checked) setModPlanSlug("business");
                  }}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {!modIsUnlimited && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={modDurationMonths}
                    onChange={(e) => setModDurationMonths(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModifySubModal(null)} className="flex-1 py-2.5 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveModifySub} disabled={actionLoading === "modify-sub"} className="flex-1 py-2.5 text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {actionLoading === "modify-sub" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
