import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import Company from "../models/Company.js";
import { resolveUserMongoId } from "../utils/resolveUser.js";

const VERIFIED_STATUS = "verified";
const PENDING_STATUS = "pending";
const FAILED_STATUS = "failed";

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const withPadding = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return Buffer.from(withPadding, "base64").toString("utf8");
};

const stateSecret = () =>
  process.env.DIGILOCKER_STATE_SECRET ||
  process.env.DIGILOCKER_CALLBACK_KEY ||
  process.env.APISETU_CALL_BACK_KEY ||
  "";

const createSignedState = (payload) => {
  const secret = stateSecret();
  if (!secret) return null;
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(
    crypto.createHmac("sha256", secret).update(encodedPayload).digest("hex")
  );
  return `${encodedPayload}.${signature}`;
};

const verifySignedState = (state) => {
  if (!state || typeof state !== "string" || !state.includes(".")) return null;
  const secret = stateSecret();
  if (!secret) return null;

  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = toBase64Url(
    crypto.createHmac("sha256", secret).update(encodedPayload).digest("hex")
  );

  if (expectedSignature !== signature) return null;

  try {
    return JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return null;
  }
};

const normalizeProviderStatus = (payload = {}) => {
  const statusValue = String(payload.status || payload.verificationStatus || "").toLowerCase();
  const explicitlyVerified = payload.verified === true || payload.isVerified === true;
  if (explicitlyVerified || ["verified", "success", "completed", "done"].includes(statusValue)) {
    return VERIFIED_STATUS;
  }
  if (payload.code && !statusValue) {
    return PENDING_STATUS;
  }
  if (["pending", "initiated", "processing"].includes(statusValue)) {
    return PENDING_STATUS;
  }
  return FAILED_STATUS;
};

const getHeaderValue = (req, keys = []) => {
  for (const key of keys) {
    const value = req.headers[key.toLowerCase()];
    if (value) return value;
  }
  return "";
};

const assertCompanyOwnership = async ({ companyId, userId, reqUser = null }) => {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    return null;
  }
  const resolvedUserId = (await resolveUserMongoId(userId, reqUser)) || (mongoose.Types.ObjectId.isValid(userId) ? userId : null);
  if (!resolvedUserId) {
    return null;
  }
  const company = await Company.findOne({
    _id: companyId,
    userId: resolvedUserId,
    flag: "vendor",
    isDeleted: false,
  });

  return company;
};

export const initiateCompanyPanConsent = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    const company = await assertCompanyOwnership({ companyId, userId, reqUser: req.user });
    if (!company) {
      return res.status(404).json({ message: "Vendor company not found." });
    }

    if (!company.panNo) {
      return res.status(400).json({ message: "PAN is required before starting verification." });
    }

    const initiateUrl = process.env.DIGILOCKER_CONSENT_INITIATE_URL;
    const authorizeUrl =
      process.env.DIGILOCKER_AUTHORIZE_URL ||
      "https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize";
    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const callbackUrl = process.env.DIGILOCKER_CALLBACK_URL;

    if (!clientId || !callbackUrl) {
      return res.status(500).json({ message: "DigiLocker configuration is incomplete." });
    }

    const referenceId = `pan_${company._id}_${Date.now()}`;
    const statePayload = {
      companyId: String(company._id),
      userId: String(company.userId),
      referenceId,
      ts: Date.now(),
    };
    const state = createSignedState(statePayload);
    if (!state) {
      return res.status(500).json({ message: "Unable to create secure verification state." });
    }

    let consentUrl = "";

    if (initiateUrl) {
      const payload = {
        clientId,
        panNo: company.panNo,
        callbackUrl,
        postbackUrl: process.env.DIGILOCKER_POSTBACK_URL,
        referenceId,
        state,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      if (process.env.DIGILOCKER_CLIENT_SECRET) {
        headers.Authorization = `Bearer ${process.env.DIGILOCKER_CLIENT_SECRET}`;
      }

      const response = await axios.post(initiateUrl, payload, { headers });
      const responseData = response?.data || {};
      consentUrl =
        responseData.consentUrl ||
        responseData.redirectUrl ||
        responseData.url ||
        responseData?.data?.consentUrl ||
        responseData?.data?.redirectUrl ||
        "";
    }

    // PKCE — DigiLocker requires code_challenge for the public OAuth flow
    const codeVerifier = crypto.randomBytes(32).toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

    if (!consentUrl) {
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: callbackUrl,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      const scope = (process.env.DIGILOCKER_SCOPE || "").trim().toLowerCase();
      if (scope) params.set("scope", scope);
      consentUrl = `${authorizeUrl}?${params.toString()}`;
    }

    if (!consentUrl) {
      return res.status(502).json({ message: "DigiLocker consent URL missing from provider response." });
    }

    company.panVerificationStatus = PENDING_STATUS;
    company.panVerificationRefId = referenceId;
    company.panVerificationSource = "digilocker";
    company.panVerificationMeta = {
      ...(company.panVerificationMeta || {}),
      pendingState: state,
      pendingCodeVerifier: codeVerifier,
      initiatedAt: new Date().toISOString(),
      lastProviderResponseAt: new Date().toISOString(),
    };
    await company.save();

    return res.status(200).json({
      message: "PAN verification initiated.",
      referenceId,
      consentUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to initiate PAN verification.", error: error.message });
  }
};

const applyVerificationUpdate = async ({
  company,
  status,
  source,
  referenceId,
  providerPayload,
  returnedPan,
}) => {
  const normalizedReturnedPan = returnedPan ? String(returnedPan).trim().toUpperCase() : "";
  const isPanMismatch = normalizedReturnedPan && normalizedReturnedPan !== (company.panNo || "");

  if (company.panVerificationStatus === VERIFIED_STATUS && status !== VERIFIED_STATUS) {
    // Do not downgrade a verified PAN with late/duplicate failed callbacks.
    return company;
  }

  if (status === VERIFIED_STATUS && !isPanMismatch) {
    company.panVerificationStatus = VERIFIED_STATUS;
    company.panVerifiedAt = new Date();
  } else if (status === PENDING_STATUS) {
    company.panVerificationStatus = PENDING_STATUS;
  } else {
    company.panVerificationStatus = FAILED_STATUS;
    company.panVerifiedAt = null;
  }

  if (referenceId) {
    company.panVerificationRefId = referenceId;
  }

  company.panVerificationSource = source || "digilocker";
  company.panVerificationMeta = {
    ...(company.panVerificationMeta || {}),
    lastStatus: company.panVerificationStatus,
    lastUpdatedAt: new Date().toISOString(),
    panMismatch: isPanMismatch,
    providerPayload,
  };

  await company.save();
  return company;
};

const findCompanyFromPayload = async (payload = {}) => {
  const directCompanyId = payload.companyId || payload?.data?.companyId || payload?.meta?.companyId;
  if (directCompanyId) {
    return Company.findById(directCompanyId);
  }

  if (payload.state) {
    // Try HMAC-verified decode first
    const stateData = verifySignedState(payload.state);
    if (stateData?.companyId) {
      return Company.findById(stateData.companyId);
    }

    // Fallback: look up by the raw pendingState stored at initiation time
    // (handles cases where the provider re-encodes or appends to the state param)
    const byPendingState = await Company.findOne({
      "panVerificationMeta.pendingState": payload.state,
      isDeleted: false,
    });
    if (byPendingState) {
      console.log(`[PAN Callback] Found company via pendingState lookup: ${byPendingState._id}`);
      return byPendingState;
    }

    // Last-resort: try to base64-decode the payload portion without HMAC check
    try {
      const parts = payload.state.split(".");
      if (parts.length >= 1) {
        const decoded = JSON.parse(fromBase64Url(parts[0]));
        if (decoded?.companyId) {
          console.warn(`[PAN Callback] HMAC verification failed but decoded state companyId: ${decoded.companyId}`);
          return Company.findById(decoded.companyId);
        }
      }
    } catch {
      // ignore decode errors
    }
  }

  if (payload.referenceId || payload.refId) {
    return Company.findOne({ panVerificationRefId: payload.referenceId || payload.refId });
  }

  console.warn("[PAN Callback] Could not identify company from payload:", JSON.stringify(payload));
  return null;
};

const exchangeCodeForToken = async ({ code, codeVerifier }) => {
  const tokenUrl =
    process.env.DIGILOCKER_TOKEN_URL ||
    "https://api.digitallocker.gov.in/public/oauth2/1/token";
  const clientId = process.env.DIGILOCKER_CLIENT_ID;
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET || "";

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: process.env.DIGILOCKER_CALLBACK_URL,
  });
  if (codeVerifier) {
    params.set("code_verifier", codeVerifier);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
    },
    validateStatus: () => true,
  });
  return { status: response.status, data: response.data };
};

export const handlePanVerifyCallback = async (req, res) => {
  try {
    const callbackKey = process.env.DIGILOCKER_CALLBACK_KEY || process.env.APISETU_CALL_BACK_KEY;
    const receivedKey = getHeaderValue(req, ["x-callback-key", "x-digilocker-callback-key"]);
    const payload = { ...(req.body || {}), ...(req.query || {}) };

    console.log("[PAN Callback] Received payload keys:", Object.keys(payload), "| query:", JSON.stringify(req.query || {}));

    // Browser redirects do not include callback-key headers.
    // Validate callback key only when provider sends one.
    if (callbackKey && receivedKey && receivedKey !== callbackKey) {
      return res.status(401).json({ message: "Invalid callback key." });
    }

    const company = await findCompanyFromPayload(payload);

    if (!company) {
      return res.status(404).json({ message: "Company not found for callback payload." });
    }

    const stateData = payload.state ? verifySignedState(payload.state) : null;
    if (payload.state && !stateData) {
      return res.status(400).json({ message: "Invalid or tampered callback state." });
    }

    if (payload.state && company?.panVerificationMeta?.pendingState && payload.state !== company.panVerificationMeta.pendingState) {
      return res.status(400).json({ message: "Callback state mismatch." });
    }

    // Handle provider-reported errors (user cancelled, etc.)
    if (payload.error) {
      await applyVerificationUpdate({
        company,
        status: FAILED_STATUS,
        source: "digilocker-callback",
        referenceId: stateData?.referenceId || "",
        providerPayload: payload,
      });
      return res.status(200).json({ message: "Callback recorded provider error.", error: payload.error });
    }

    // If provider redirected with an OAuth code, exchange it for a token.
    let returnedPan = payload.panNo || payload.pan;
    let tokenInfo = null;
    let exchangeError = null;

    if (payload.code) {
      const codeVerifier = company?.panVerificationMeta?.pendingCodeVerifier || "";
      try {
        const exchange = await exchangeCodeForToken({ code: payload.code, codeVerifier });
        console.log("[PAN Callback] Token exchange status:", exchange.status, "data:", JSON.stringify(exchange.data));
        if (exchange.status >= 200 && exchange.status < 300 && exchange.data?.access_token) {
          tokenInfo = exchange.data;
          returnedPan = returnedPan || tokenInfo.pan || tokenInfo.panNo || tokenInfo?.user?.pan || "";
        } else {
          exchangeError = exchange.data || { status: exchange.status };
        }
      } catch (err) {
        exchangeError = { message: err.message };
        console.error("[PAN Callback] Token exchange threw:", err.message);
      }
    }

    const status = tokenInfo
      ? VERIFIED_STATUS
      : exchangeError
        ? FAILED_STATUS
        : normalizeProviderStatus(payload);

    await applyVerificationUpdate({
      company,
      status,
      source: "digilocker-callback",
      referenceId: payload.referenceId || payload.refId || stateData?.referenceId || "",
      providerPayload: { ...payload, tokenInfoKeys: tokenInfo ? Object.keys(tokenInfo) : null, exchangeError },
      returnedPan,
    });

    // Clear stored verifier after use
    if (company.panVerificationMeta?.pendingCodeVerifier) {
      company.panVerificationMeta.pendingCodeVerifier = "";
      await company.save();
    }

    return res.status(200).json({
      message: "Callback processed successfully.",
      panVerificationStatus: company.panVerificationStatus,
    });
  } catch (error) {
    console.error("[PAN Callback] Unhandled error:", error);
    return res.status(500).json({ message: "Failed to process callback.", error: error.message });
  }
};

export const handlePanVerifyPostback = async (req, res) => {
  try {
    const postbackKey = process.env.DIGILOCKER_POSTBACK_KEY || process.env.APISETU_POST_BACK_KEY;
    const receivedKey = getHeaderValue(req, ["x-postback-key", "x-digilocker-postback-key"]);

    if (postbackKey && receivedKey !== postbackKey) {
      return res.status(401).json({ message: "Invalid postback key." });
    }

    const payload = req.body || {};
    const company = await findCompanyFromPayload(payload);

    if (!company) {
      return res.status(404).json({ message: "Company not found for postback payload." });
    }

    const status = normalizeProviderStatus(payload);
    await applyVerificationUpdate({
      company,
      status,
      source: "digilocker-postback",
      referenceId: payload.referenceId || payload.refId || "",
      providerPayload: payload,
      returnedPan: payload.panNo || payload.pan,
    });

    return res.status(200).json({ message: "Postback processed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process postback.", error: error.message });
  }
};

export const getCompanyPanVerificationStatus = async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const company = await assertCompanyOwnership({ companyId, userId, reqUser: req.user });

    if (!company) {
      return res.status(404).json({ message: "Vendor company not found." });
    }

    return res.status(200).json({
      companyId: company._id,
      panNo: company.panNo || "",
      panVerificationStatus: company.panVerificationStatus || "unverified",
      panVerifiedAt: company.panVerifiedAt || null,
      panVerificationRefId: company.panVerificationRefId || "",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get PAN verification status.", error: error.message });
  }
};
