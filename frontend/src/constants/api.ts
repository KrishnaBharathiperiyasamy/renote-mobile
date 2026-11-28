// constants/api.ts
// All base URLs are sourced from environment variables.
// See .env.development (used by `next dev`) and .env.production (used by `next build`).
// These are exposed to the browser via the `env` field in next.config.ts.

export const isBrowser = typeof window !== "undefined";
export const isLocalhost =
  isBrowser &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

export const AUTH_API_BASE_URL = isLocalhost
  ? "http://localhost:3004"
  : (isBrowser ? "/auth-proxy" : (process.env.AUTH_API_BASE_URL || "http://localhost:3004"));

export const DATA_API_BASE_URL = isBrowser
  ? (isLocalhost ? `http://${window.location.hostname || "localhost"}:6003` : "")
  : (process.env.DATA_API_BASE_URL || "http://localhost:6003");

export const AUTH_APP_CODE = (process.env.AUTH_APP_CODE as string) || "RENOTE";
export const AUTH_ROLE_CODE = (process.env.AUTH_ROLE_CODE as string) || "USER";

export const FRONT_END_URL = isBrowser
  ? `${window.location.protocol}//${window.location.host}`
  : (process.env.FRONT_END_URL || "http://localhost:6001");

export const POSTER_IMAGE_BASE_URL = isLocalhost
  ? `${DATA_API_BASE_URL}/`
  : (isBrowser ? "/" : `${DATA_API_BASE_URL}/`);
export const viewUrl = (token: string) => `${FRONT_END_URL}/pages/view?token=${token}`;
export const shortUrl = (slug: string) => `${FRONT_END_URL}/s/${slug}`;
export const DEFAULT_COMPANY_LOGO_PATH = "uploads/companies/default-company/";
export const DEFAULT_KRISHTECH_LOGO = "/uploads/companies/default-company/logo-1779622107439-878996187.webp";

export const getPosterImageSrc = (img: string) => {
  if (!img || typeof img !== "string") return "/placeholder.png";
  if (
    img.startsWith("blob:") ||
    img.startsWith("data:") ||
    img.startsWith("http://") ||
    img.startsWith("https://")
  ) {
    // Deduplicate any repeated base url e.g. http://localhost:6003/http://localhost:6003/...
    const match = img.match(/(https?:\/\/[^\/]+)\/\1\/(.*)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return img;
  }
  const cleaned = img.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.startsWith("http:/") && !cleaned.startsWith("http://")) {
    return cleaned.replace("http:/", "http://");
  }
  if (cleaned.startsWith("https:/") && !cleaned.startsWith("https://")) {
    return cleaned.replace("https:/", "https://");
  }
  return `${POSTER_IMAGE_BASE_URL}${cleaned}`;
};

export const normalizeImageUrl = (path: string) => {
  if (!path) return "";
  if (
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  const cleaned = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${POSTER_IMAGE_BASE_URL}${cleaned}`;
};

export const PRODUCTS = {
  quotations: (userId: string) =>
    `${DATA_API_BASE_URL}/api/quotations/products/${userId}`,
  invoice: (userId: string) =>
    `${DATA_API_BASE_URL}/api/invoice/products/${userId}`,
  bulk: (userId: string) =>
    `${DATA_API_BASE_URL}/api/bulk/products/${userId}`,
  posters: (userId: string) =>
    `${DATA_API_BASE_URL}/api/posters/products/${userId}`,
};

// Organized endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${AUTH_API_BASE_URL}/auth/login`,
    REGISTER: `${AUTH_API_BASE_URL}/auth/register`,
    FORGOT_PASSWORD: `${AUTH_API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${AUTH_API_BASE_URL}/auth/reset-password`,
    GOOGLE_LOGIN: (appCode: string = AUTH_APP_CODE, roleCode: string = AUTH_ROLE_CODE) =>
      `${AUTH_API_BASE_URL}/auth/oAuth/google?appCode=${encodeURIComponent(appCode)}&roleCode=${encodeURIComponent(roleCode)}`,
    REFRESH_TOKEN: `${AUTH_API_BASE_URL}/auth/refresh-token`,
    VERIFY_OTP: `${AUTH_API_BASE_URL}/otp/verify`,
    VERIFY_PHONE_UPDATE_OTP: `${AUTH_API_BASE_URL}/otp/verify`,
    REQUEST_OTP: `${AUTH_API_BASE_URL}/otp/send`,
    SEND_EMAIL_RESET: `${AUTH_API_BASE_URL}/auth/request-reset-email`,
    EMAIL_VERIFICATION: `${AUTH_API_BASE_URL}/auth/reset-password-email`,
    GET_ME: `${AUTH_API_BASE_URL}/users/me`,
    GET_USER_BY_ID: (userId: string) => `${AUTH_API_BASE_URL}/users/me`, // legacy alias — kept for safety
    UPDATE_PROFILE: `${AUTH_API_BASE_URL}/users/me`,
    UPLOAD_PROFILE_PIC: `${AUTH_API_BASE_URL}/users/me/upload-profile-pic`,
    DELETE_ACCOUNT: `${AUTH_API_BASE_URL}/users/me`,
  },

  USERS: {
    CREATE_USER: `${DATA_API_BASE_URL}/api/users/create-user`,
    GET_CURRENT_USER: `${DATA_API_BASE_URL}/api/users/me`,
    GET_USER_BY_ID: (id: string) => `${DATA_API_BASE_URL}/api/users/get-users/${id}`,
    UPDATE_USER: (id: string) => `${DATA_API_BASE_URL}/api/users/update-user/${id}`,
    CHECK_USER: (authId: string) => `${DATA_API_BASE_URL}/api/users/check-user/${authId}`,
    DELETE_USER: (id: string) => `${DATA_API_BASE_URL}/api/users/delete-users/${id}`,
    LOGIN_SECURE: `${DATA_API_BASE_URL}/api/users/login-secure`,
    FORGOT_REQUEST_OTP: `${DATA_API_BASE_URL}/api/users/forgot-password/request-otp`,
    FORGOT_VERIFY_OTP: `${DATA_API_BASE_URL}/api/users/forgot-password/verify-otp`,
    FORGOT_RESET_PASSWORD: `${DATA_API_BASE_URL}/api/users/forgot-password/reset-password`,
  },

  NOTIFICATIONS: {
    SYSTEM: (userId: string) => `${DATA_API_BASE_URL}/api/notifications/system/${userId}`,
    GET_ALL: (userId: string) => `${DATA_API_BASE_URL}/api/notifications/notifications/${userId}`,
    MARK_AS_READ: (notificationId: string) => `${DATA_API_BASE_URL}/api/notifications/notifications/mark/${notificationId}`,
    CLEAR_ALL: (userId: string) => `${DATA_API_BASE_URL}/api/notifications/notifications/clear/${userId}`,
  },

  GST: {
    GET_DETAILS_BY_GST_NO: (gstNo: string) => `${DATA_API_BASE_URL}/api/gst/${gstNo}`,
  },

  SETTINGS: {
    GST_OPTIONS: `${DATA_API_BASE_URL}/api/settings/gst-options`,
  },

  SYNC: {
    SYNC_BACKEND: (userId: string) =>
      `${DATA_API_BASE_URL}/api/sync/${userId}`,
    SYNC_INVOICE: (userId: string) => `${DATA_API_BASE_URL}/api/sync/syncInvoice/${userId}`,
    SYNC_POSTERS: (userId: string) => `${DATA_API_BASE_URL}/api/sync/syncPosters/${userId}`
  },

  COMPANIES: {
    GET_ALLCOMPANY_BY_USER_ID: (userId: string) =>
      `${DATA_API_BASE_URL}/api/companies/getAllCompanies/${userId}`,
    GET_COMPANY_BY_USER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/companies/getAllCompanies/${userId}`,
    GET_CUSTOMER_COMPANY_BY_USER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/companies/getAllCompanies/${userId}`,
    CREATE_BY_USER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/companies/createCompany/${userId}`,
    EDIT_BY_ID: (companyId: string) => `${DATA_API_BASE_URL}/api/companies/editCompany/${companyId}`,
    DELETE_BY_ID: (companyId: string) => `${DATA_API_BASE_URL}/api/companies/deleteVendorCompany/${companyId}`,
    DELETE_CUSTOMER: (companyId: string) => `${DATA_API_BASE_URL}/api/companies/deleteCompany/${companyId}`,
    DELETE_WITH_QUOTATIONS: (companyId: string) => `${DATA_API_BASE_URL}/api/companies/deleteQuotationByCompany/${companyId}`,
    CREATE_MULTIPLE: (userId: string) =>
      `${DATA_API_BASE_URL}/api/companies/create-multiple/${userId}`,
    PAN_VERIFY_INITIATE: (companyId: string, userId: string) =>
      `${DATA_API_BASE_URL}/api/companies/pan-verify/initiate/${companyId}/${userId}`,
    PAN_VERIFY_CALLBACK: `${DATA_API_BASE_URL}/api/companies/pan-verify/callback`,
  },

  OTP: {
    REQUEST_PHONE: `${DATA_API_BASE_URL}/api/otp/request`,
    REQUEST_EMAIL: `${DATA_API_BASE_URL}/api/otp/request-email`,
    VERIFY_PHONE: `${DATA_API_BASE_URL}/api/otp/verify`,
    VERIFY_EMAIL: `${DATA_API_BASE_URL}/api/otp/verify-email`,
  },

  QUOTATIONS: {
    NEXT_ID: `${DATA_API_BASE_URL}/api/quotations/next-id`,
    DOWNLOAD: (quotationId: string) => `${DATA_API_BASE_URL}/api/quotations/download/${quotationId}`,
    TOGGLE_FAVORITE: (id: string) => `${DATA_API_BASE_URL}/api/quotations/getQuotations/${id}/favorite`,
    GET_BY_USER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/quotations/getQuotations/${userId}`,
    GET_BY_ID: (quotationId: string) => `${DATA_API_BASE_URL}/api/quotations/getQuotation/${quotationId}`,
    CREATE_OR_UPDATE: (quotationId?: string, userId?: string) =>
      quotationId
        ? `${DATA_API_BASE_URL}/api/quotations/updateQuotation/${quotationId}`
        : `${DATA_API_BASE_URL}/api/quotations/createQuotation/${userId}`,
    DELETE: (id: string) => `${DATA_API_BASE_URL}/api/quotations/deleteQuotation/${id}`,
    DELETE_MULTIPLE: `${DATA_API_BASE_URL}/api/quotations/deleteQuotation`,
    CREATE_QUOTATION: (userId: string) =>
      `${DATA_API_BASE_URL}/api/quotations/createQuotation/${userId}`,
    UPDATE: (quotationId: string) =>
      `${DATA_API_BASE_URL}/api/quotations/updateQuotation/${quotationId}`,
    EXPORT_XML: `${DATA_API_BASE_URL}/api/quotations/download/xml`,
    IMPORT_XML: (userId: string) => `${DATA_API_BASE_URL}/api/quotations/upload-xml/${userId}`
  },

  POSTERS: {
    GET_BY_ID: (posterId: string) => `${DATA_API_BASE_URL}/api/posters/${posterId}`,
    GET_POSTER: (userId: string) => `${DATA_API_BASE_URL}/api/posters/getPoster/${userId}`,
    DELETE_POSTER: `${DATA_API_BASE_URL}/api/posters/deletePoster`,
    TOGGLE_FAVORITE: (posterId: string) => `${DATA_API_BASE_URL}/api/posters/${posterId}/favorite`,
    NEXT_POSTER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/posters/next-poster-id/${userId}`,
    CREATE_POSTER: (userId: string) => `${DATA_API_BASE_URL}/api/posters/createPoster/${userId}`,
    UPDATE_POSTER: (posterId: string) => `${DATA_API_BASE_URL}/api/posters/updatePoster/${posterId}`,
    DUPLICATE: (posterId: string) => `${DATA_API_BASE_URL}/api/posters/duplicate/${posterId}`,
    RENDER_VIDEO: `${DATA_API_BASE_URL}/api/posters/renderVideo`,
    CLEAR_VIDEO_CACHE: (posterId: string) => `${DATA_API_BASE_URL}/api/posters/clearVideoCache/${posterId}`,
    UPLOAD_TEMP_VIDEO: `${DATA_API_BASE_URL}/api/posters/uploadTempVideo`,
    IMPORT_POSTERS: `${DATA_API_BASE_URL}/api/posters/import`,
    EXPORT_POSTERS: `${DATA_API_BASE_URL}/api/posters/export`,
    TAGS: (userId: string) => `${DATA_API_BASE_URL}/api/posters/tags/${userId}`,
  },

  MARKETPLACE: {
    FEED: `${DATA_API_BASE_URL}/api/marketplace/feed`,
    ITEM: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}`,
    LIKE: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}/like`,
    REACTION: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}/reaction`,
    RATE: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}/rate`,
    FEEDBACK: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}/feedback`,
    PUBLISH: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/publish/${id}`,
    PUBLISH_LINK: (token: string) => `${DATA_API_BASE_URL}/api/marketplace/publish-link/${token}`,
    TOGGLE_SOLD: (id: string) => `${DATA_API_BASE_URL}/api/marketplace/item/${id}/sold`,
  },

  INVOICES: {
    GET_BY_USER_ID: (userId: string) => `${DATA_API_BASE_URL}/api/invoice/getInvoiceByUser/${userId}`,
    DELETE_MULTIPLE: `${DATA_API_BASE_URL}/api/invoice/deleteInvoices`,
    TOGGLE_FAVORITE: (invoiceId: string) => `${DATA_API_BASE_URL}/api/invoice/getInvoice/${invoiceId}/favorite`,
    CREATE: (userId: string) => `${DATA_API_BASE_URL}/api/invoice/createInvoice/${userId}`,
    UPDATE: (invoiceId: string) => `${DATA_API_BASE_URL}/api/invoice/updateInvoice/${invoiceId}`,
    DOWNLOAD: (invoiceId: string) => `${DATA_API_BASE_URL}/api/invoice/invoice/download/${invoiceId}`,
    NEXT_ID: (userId: string) => `${DATA_API_BASE_URL}/api/invoice/next-id/${userId}`,
    EXPORT_XML: `${DATA_API_BASE_URL}/api/invoice/download/xml`,
    IMPORT_XML: (userId: string) => `${DATA_API_BASE_URL}/api/invoice/upload-xml/${userId}`
  },

  SHARABLE_LINKS: {
    SHARE: `${DATA_API_BASE_URL}/api/links/share-poster`,
    GET_SHARED: (token: string) => `${DATA_API_BASE_URL}/api/links/shared/${token}`,
    GET_SHARED_INTERACTIONS: (token: string, posterId: string) =>
      `${DATA_API_BASE_URL}/api/links/shared/${token}/${posterId}/interactions`,
    LIKE: (token: string, posterId: string) =>
      `${DATA_API_BASE_URL}/api/links/shared/${token}/${posterId}/like`,
    COMMENT: (token: string, posterId: string) =>
      `${DATA_API_BASE_URL}/api/links/shared/${token}/${posterId}/comment`,
    COMMENT_LIKE: (token: string, posterId: string, commentId: string) =>
      `${DATA_API_BASE_URL}/api/links/shared/${token}/${posterId}/comment/${commentId}/like`,
    PATCH_SHARE: (tokenParam: string) =>
      `${DATA_API_BASE_URL}/api/links/shared/${tokenParam}`,
    DELETE_MULTIPLE: `${DATA_API_BASE_URL}/api/links/delete-multiple`,
    REVOKE: (token: string) => `${DATA_API_BASE_URL}/api/links/shared/${token}/revoke`,
    REVOKE_MULTIPLE: `${DATA_API_BASE_URL}/api/links/revoke-multiple`,
    GET_USER_LINKS: (userId: string) =>
      `${DATA_API_BASE_URL}/api/links/user/${userId}`,
    UPDATE_SHARED_LINK: (token: string) => `${DATA_API_BASE_URL}/api/links/shared/${token}`,
    CUSTOM_SLUG: (token: string) => `${DATA_API_BASE_URL}/api/links/shared/${token}/slug`,
    BY_SLUG: (slug: string) => `${DATA_API_BASE_URL}/api/links/slug/${slug}`,
    REPLY_COMMENT: (token: string, posterId: string, commentId: string) =>
      `${DATA_API_BASE_URL}/api/links/${token}/poster/${posterId}/comment/${commentId}/reply`,
  },

  PRODUCTS: {
    CREATE: (userId: string) => `${DATA_API_BASE_URL}/api/products/create/${userId}`,
    UPDATE: (productId: string) => `${DATA_API_BASE_URL}/api/products/update/${productId}`,
    BULK_UPLOAD: (userId: string) => `${DATA_API_BASE_URL}/api/products/bulk/${userId}`,
    EXTRACT_PDF: `${DATA_API_BASE_URL}/api/products/extract`,
    DOWNLOAD_XML: `${DATA_API_BASE_URL}/api/products/download-xml`,
    SUGGESTIONS: `${DATA_API_BASE_URL}/api/products/NewSuggestions`,
    GET_BY_USER: (userId: string) => `${DATA_API_BASE_URL}/api/products/get/${userId}?`,
    DELETE_MULTIPLE: `${DATA_API_BASE_URL}/api/products/delete`,
    UPLOAD_XML: (userId: string) => `${DATA_API_BASE_URL}/api/products/upload-xml/${userId}`,
    TOGGLE_FAVORITE: (productId: string) => `${DATA_API_BASE_URL}/api/products/getProduct/${productId}/favorite`,
  },

  ADMIN: {
    VERIFY_ADMIN: `${DATA_API_BASE_URL}/api/admin/verify-admin`,
    GET_ALL_USERS: `${AUTH_API_BASE_URL}/auth/get-all-users`,
    GET_USER_COUNTS: `${DATA_API_BASE_URL}/api/users/get-users`,
  },

  SUPERADMIN: {
    LOGIN: `${DATA_API_BASE_URL}/api/superadmin/login`,
    VERIFY_TOTP: `${DATA_API_BASE_URL}/api/superadmin/verify-totp`,
    TOTP_SETUP: `${DATA_API_BASE_URL}/api/superadmin/totp-setup`,
    STATS: `${DATA_API_BASE_URL}/api/superadmin/stats`,
    COMPANIES: `${DATA_API_BASE_URL}/api/superadmin/companies`,
    COMPANY_EDIT: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/companies/${id}`,
    COMPANY_BLOCK: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/companies/${id}/block`,
    COMPANY_UNBLOCK: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/companies/${id}/unblock`,
    COMPANY_RESET_PASSWORD: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/companies/${id}/reset-password`,
    COMPANY_DELETE: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/companies/${id}`,
    USERS: `${DATA_API_BASE_URL}/api/superadmin/users`,
    USER_DELETE: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/users/${id}`,
    USER_BLOCK: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/users/${id}/block`,
    USER_UNBLOCK: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/users/${id}/unblock`,
    USER_RESET_PASSWORD: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/users/${id}/reset-password`,
    GRANT_PRO_TRIAL: (id: string) => `${DATA_API_BASE_URL}/api/superadmin/users/${id}/grant-trial`,
    USER_BACKUPS: `${DATA_API_BASE_URL}/api/superadmin/users/backups`,
    USER_BACKUP_DOWNLOAD: (backupId: string) => `${DATA_API_BASE_URL}/api/superadmin/users/backups/${backupId}/download`,
    USER_BACKUP_DELETE: (backupId: string) => `${DATA_API_BASE_URL}/api/superadmin/users/backups/${backupId}`,
    USER_RESTORE: (backupId: string) => `${DATA_API_BASE_URL}/api/superadmin/users/restore/${backupId}`,
    VERIFY_ACTION_TOTP: `${DATA_API_BASE_URL}/api/superadmin/verify-action-totp`,
    MAINTENANCE: `${DATA_API_BASE_URL}/api/superadmin/maintenance`,
    BACKUP: `${DATA_API_BASE_URL}/api/superadmin/backup`,
    RESTORE: `${DATA_API_BASE_URL}/api/superadmin/restore`,
    SUBSCRIPTIONS: `${DATA_API_BASE_URL}/api/superadmin/subscriptions`,
    SUBSCRIPTION_MODIFY: (userId: string) => `${DATA_API_BASE_URL}/api/superadmin/subscriptions/user/${userId}`,
    PAYMENTS: `${DATA_API_BASE_URL}/api/superadmin/payments`,
    SUBSCRIPTION_STATS: `${DATA_API_BASE_URL}/api/superadmin/subscription-stats`,
  },

  SUBSCRIPTIONS: {
    CREATE_SUBSCRIPTION: `${DATA_API_BASE_URL}/api/subscription/create`,
    HISTORY: `${DATA_API_BASE_URL}/api/subscription/history`,
    PAYMENTS: `${DATA_API_BASE_URL}/api/subscription/history`,
    CANCEL: `${DATA_API_BASE_URL}/api/subscription/cancel`,
  },

  RAZORPAY: {
    CREATE_SESSION: `${DATA_API_BASE_URL}/api/razorpay/create-subscription-session`,
    VERIFY_PAYMENT: `${DATA_API_BASE_URL}/api/razorpay/verify-payment`,
  },
  // Add new endpoint for fetching plans (for new subscription page)
  PLANS: {
    GET_PLANS: `${DATA_API_BASE_URL}/api/plans/get-plans`,
  },

  CATEGORIES: {
    GET_ALL: `${DATA_API_BASE_URL}/api/categories`,
    GET_ADMIN: `${DATA_API_BASE_URL}/api/categories/admin`,
    CREATE: `${DATA_API_BASE_URL}/api/categories`,
    UPDATE: (id: string) => `${DATA_API_BASE_URL}/api/categories/${id}`,
    DELETE: (id: string) => `${DATA_API_BASE_URL}/api/categories/${id}`,
  },

  CONTACT: {
    SEND_MESSAGE: `${DATA_API_BASE_URL}/api/contact/contactUs`,
  },
};
