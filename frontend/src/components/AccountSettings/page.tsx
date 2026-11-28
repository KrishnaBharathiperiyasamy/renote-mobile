"use client";

import { PrimaryBtn, SecondaryBtn } from "@components/Button";
import axios from "axios";
import apiClient from "@utilis/apiClient";
import { API_ENDPOINTS, AUTH_APP_CODE, DATA_API_BASE_URL } from "@constants/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { safeToastSuccess, safeToastError } from "@utilis/toastHelper";
import { useUser } from "@context/UserContext";
import { useState, useEffect, useRef } from "react";

type FieldName = "firstName" | "lastName" | "email" | "phoneNumber";

type FormField = {
  name: FieldName;
  type: "text" | "email";
  placeholder: string;
  label: string;
  isRequired: boolean;
  default: string;
  value: string;
};

type ApiUser = {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  uploadedImage?: string;
  profilePic?: string;
  profileImage?: string;
  profileImageUrl?: string;
  avatar?: string;
};

type PhoneVerificationState = {
  isPhoneVerified: boolean;
  otpRequested: boolean;
  otp: string;
  isOtpLoading: boolean;
};

type ProfileUpdatePayload = Partial<Record<FieldName, string>>;

const DEFAULT_PROFILE_IMAGE = "/user.jpeg";

const getStoredUserData = (): Partial<Record<FieldName, string>> => {
  if (typeof window === "undefined") return {};
  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const email = localStorage.getItem("email") || "";
  const phoneNumber = localStorage.getItem("phoneNumber") || localStorage.getItem("phone") || "";
  return { firstName, lastName, email, phoneNumber };
};

const getInitialProfileImage = (): string => {
  if (typeof window === "undefined") return DEFAULT_PROFILE_IMAGE;
  return localStorage.getItem("profileImageUrl") || DEFAULT_PROFILE_IMAGE;
};

const createInitialFields = (initialValues?: Partial<Record<FieldName, string>>): FormField[] => {
  const defaults = initialValues || getStoredUserData();
  return [
    {
      name: "firstName",
      type: "text",
      placeholder: "Eg: Mike",
      label: "First Name",
      isRequired: true,
      default: defaults.firstName || "",
      value: defaults.firstName || "",
    },
    {
      name: "lastName",
      type: "text",
      placeholder: "Eg: Stevan",
      label: "Last Name",
      isRequired: false,
      default: defaults.lastName || "",
      value: defaults.lastName || "",
    },
    {
      name: "email",
      type: "email",
      placeholder: "example@gmail.com",
      label: "Email",
      isRequired: false,
      default: defaults.email || "",
      value: defaults.email || "",
    },
    {
      name: "phoneNumber",
      type: "text",
      placeholder: "8907654321",
      label: "Phone Number",
      isRequired: false,
      default: defaults.phoneNumber || "",
      value: defaults.phoneNumber || "",
    },
  ];
};

const resolveProfileImageUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) return rawUrl;

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.port === "3004" || parsed.pathname.startsWith("/auth-proxy")) {
        const cleanedPath = parsed.pathname.replace(/^\/+/, "").replace(/^auth-proxy\//, "");
        return `/auth-proxy/${cleanedPath}`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  const cleaned = rawUrl.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.startsWith("auth-proxy/")) return `/${cleaned}`;
  return `/auth-proxy/${cleaned}`;
};

const getUserFieldMap = (user: ApiUser): Record<FieldName, string> => {
  const rawFullName = user.fullName || user.name || "";
  const nameParts = rawFullName ? rawFullName.trim().split(/\s+/) : [];
  const fallbackFirst = nameParts[0] || "";
  const fallbackLast = nameParts.slice(1).join(" ") || "";

  return {
    firstName: user.firstName || fallbackFirst || "",
    lastName: user.lastName || fallbackLast || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || user.phone || "",
  };
};

const mapUserToFormFields = (user: ApiUser): FormField[] => {
  const mappedValues = getUserFieldMap(user);
  return createInitialFields(mappedValues).map((field) => ({
    ...field,
    default: mappedValues[field.name] || field.default,
    value: mappedValues[field.name] || field.value,
  }));
};

const getProfileImageFromUser = (user: ApiUser): string => {
  return (
    user.uploadedImage ||
    user.profilePic ||
    user.profileImage ||
    user.profileImageUrl ||
    user.avatar ||
    ""
  );
};

const buildProfilePayload = (formData: FormField[]): ProfileUpdatePayload => {
  const payload: ProfileUpdatePayload = {};
  formData.forEach((field) => {
    if (field.value !== undefined) {
      payload[field.name] = field.value.trim();
    }
  });
  return payload;
};

function AccountSettings() {
  const [data, setData] = useState<FormField[]>(createInitialFields);
  const [profileImage, setProfileImage] = useState<string>(getInitialProfileImage);
  const [originalProfileImage, setOriginalProfileImage] = useState<string>(getInitialProfileImage);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [phoneVerification, setPhoneVerification] = useState<PhoneVerificationState>({
    isPhoneVerified: true,
    otpRequested: false,
    otp: "",
    isOtpLoading: false,
  });
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { setProfileImageUrl } = useUser();
  const router = useRouter();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (JPG, JPEG, PNG, WEBP)
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const fileMime = file.type.toLowerCase();

    if (!allowedExtensions.includes(fileExt) && !allowedMimeTypes.includes(fileMime)) {
      safeToastError("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (maximum 5 MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      safeToastError("File size exceeds 5 MB. Please choose an image smaller than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Revoke previous blob preview if exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setProfileImage(previewUrl);
    setSelectedImageFile(file);
    safeToastSuccess("Image preview loaded. Click Update to save your profile picture.");
  };

  const requestOtp = async (phoneNumber: string) => {
    try {
      if (!phoneNumber?.trim()) {
        safeToastError("Enter phone number to request OTP");
        return;
      }

      setPhoneVerification((prev) => ({ ...prev, isOtpLoading: true }));
      const res = await apiClient.post(
        API_ENDPOINTS.AUTH.REQUEST_OTP,
        {
          emailOrPhone: phoneNumber,
          type: "PHONE_VERIFY",
        }
      );

      safeToastSuccess(res.data.message);
      setPhoneVerification((prev) => ({ ...prev, otpRequested: true }));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        safeToastError(error.response?.data?.message || error.message);
      } else {
        safeToastError("Failed to request OTP");
      }
    } finally {
      setPhoneVerification((prev) => ({ ...prev, isOtpLoading: false }));
    }
  };

  const verifyOtp = async (phoneNumber: string, otpValue: string) => {
    try {
      if (!phoneNumber?.trim()) {
        safeToastError("Enter phone number before OTP verification");
        return;
      }

      if (!otpValue?.trim()) {
        safeToastError("Enter OTP");
        return;
      }

      await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_PHONE_UPDATE_OTP,
        {
          emailOrPhone: phoneNumber,
          otp: otpValue,
          type: "PHONE_VERIFY",
        }
      );
      setPhoneVerification((prev) => ({
        ...prev,
        isPhoneVerified: true,
        otpRequested: false,
        otp: "",
      }));
      safeToastSuccess("Phone number verified successfully");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        safeToastError(error.response?.data?.message || error.message);
      } else {
        safeToastError("Failed to verify OTP");
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUpdating) return;

    const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("To Register Your new Account user Login is essential");
      return;
    }
    try {
      for (const field of data) {
        if (field.isRequired && !field.value.trim()) {
          safeToastError(`${field.label} is required`);
          return;
        }
      }

      setIsUpdating(true);
      const payload = buildProfilePayload(data);

      let savedImageUrl = originalProfileImage;

      // 1. Upload selected profile image if a new image was chosen
      if (selectedImageFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedImageFile);

          const uploadRes = await apiClient.post(API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PIC, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "app-code": AUTH_APP_CODE,
            },
          });

          const updatedAuthUser: ApiUser | undefined =
            uploadRes.data?.data?.user || uploadRes.data?.user;
          const uploadedPath = updatedAuthUser ? getProfileImageFromUser(updatedAuthUser) : "";
          if (uploadedPath) {
            savedImageUrl = resolveProfileImageUrl(uploadedPath);
          }
        } catch (uploadErr: unknown) {
          console.error("Profile picture upload failed:", uploadErr);
          const errorMsg = axios.isAxiosError(uploadErr)
            ? uploadErr.response?.data?.message || uploadErr.message
            : "Failed to upload profile picture";
          safeToastError(errorMsg);
          setIsUpdating(false);
          return;
        }
      }

      let updatedUser: ApiUser | undefined;

      // 2. Update Auth Service
      try {
        const res = await apiClient.patch(
          API_ENDPOINTS.AUTH.UPDATE_PROFILE,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              "app-code": AUTH_APP_CODE,
            },
          }
        );
        updatedUser = res.data?.data?.user || res.data?.user;
      } catch (authErr) {
        console.warn("Auth service update warning:", authErr);
      }

      // 3. Also update Existing Backend (MongoDB)
      try {
        const backendEndpoint = userId
          ? API_ENDPOINTS.USERS.UPDATE_USER(userId)
          : `${DATA_API_BASE_URL}/api/users/update-user`;
        const backendRes = await apiClient.post(
          backendEndpoint,
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            profilePic: savedImageUrl !== DEFAULT_PROFILE_IMAGE ? savedImageUrl : undefined,
            profileImage: savedImageUrl !== DEFAULT_PROFILE_IMAGE ? savedImageUrl : undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!updatedUser && backendRes.data?.user) {
          updatedUser = backendRes.data.user;
        }
      } catch (backendErr) {
        console.warn("Backend user update warning:", backendErr);
      }

      if (updatedUser) {
        setData(mapUserToFormFields(updatedUser));
        const profileImageUrlFromUser = getProfileImageFromUser(updatedUser);
        if (profileImageUrlFromUser) {
          savedImageUrl = resolveProfileImageUrl(profileImageUrlFromUser);
        }
      } else {
        setData((prev) =>
          prev.map((field) => ({
            ...field,
            default: payload[field.name] ?? field.value,
            value: payload[field.name] ?? field.value,
          }))
        );
      }

      if (savedImageUrl && savedImageUrl !== DEFAULT_PROFILE_IMAGE) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setProfileImage(savedImageUrl);
        setOriginalProfileImage(savedImageUrl);
        setProfileImageUrl(savedImageUrl);
        localStorage.setItem("profileImageUrl", savedImageUrl);
      }

      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (payload.firstName) localStorage.setItem("firstName", payload.firstName);
      if (payload.lastName) localStorage.setItem("lastName", payload.lastName);
      if (payload.email) localStorage.setItem("email", payload.email);
      if (payload.phoneNumber) localStorage.setItem("phoneNumber", payload.phoneNumber);

      safeToastSuccess("Profile updated successfully!");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        safeToastError(error.response?.data?.message || "Profile update failed");
      } else {
        safeToastError("Profile update failed");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData((prevState) =>
      prevState.map((field) =>
        field.name === name ? { ...field, value } : field
      )
    );
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e);
    const { value } = e.target;
    const defaultPhone = data.find((field) => field.name === "phoneNumber")?.default || "";
    const isSameAsDefault = value === defaultPhone;

    setPhoneVerification((prev) => ({
      ...prev,
      isPhoneVerified: isSameAsDefault,
      otpRequested: false,
      otp: "",
    }));
  };

  const resetToDefaults = () => {
    setData((prev) => prev.map((field) => ({ ...field, value: field.default })));

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedImageFile(null);
    setProfileImage(originalProfileImage);
    setProfileImageUrl(originalProfileImage);
    setPhoneVerification((prev) => ({
      ...prev,
      otpRequested: false,
      otp: "",
      isPhoneVerified: true,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id") || localStorage.getItem("authId");
    const token = localStorage.getItem("token");

    if (!token) return;

    let isMounted = true;

    const fetchUserDetails = async () => {
      try {
        let fetchedUser: ApiUser | null = null;

        // 1. Fetch user details from existing backend API
        const backendUrl = userId
          ? API_ENDPOINTS.USERS.GET_USER_BY_ID(userId)
          : API_ENDPOINTS.USERS.GET_CURRENT_USER;

        try {
          const res = await apiClient.get(backendUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          fetchedUser = res.data?.user || res.data?.data?.user;
        } catch (backendErr) {
          console.warn("Backend user fetch error, trying auth-service fallback:", backendErr);
        }

        // 2. Fallback to auth-service /users/me if backend didn't return user
        if (!fetchedUser) {
          try {
            const authRes = await apiClient.get(API_ENDPOINTS.AUTH.GET_ME, {
              params: {
                _ts: Date.now(),
              },
              headers: {
                "app-code": AUTH_APP_CODE,
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            });
            fetchedUser = authRes.data?.data?.user || authRes.data?.user;
          } catch (authErr) {
            console.warn("Auth service GET_ME fallback error:", authErr);
          }
        }

        if (fetchedUser && isMounted) {
          if (fetchedUser.isPhoneVerified !== undefined) {
            setPhoneVerification((prev) => ({
              ...prev,
              isPhoneVerified: fetchedUser!.isPhoneVerified ?? true,
            }));
          }

          const fetchedProfileImage = getProfileImageFromUser(fetchedUser);
          if (fetchedProfileImage) {
            const resolvedImageUrl = resolveProfileImageUrl(fetchedProfileImage);
            setProfileImage(resolvedImageUrl);
            setOriginalProfileImage(resolvedImageUrl);
            setProfileImageUrl(resolvedImageUrl);
            localStorage.setItem("profileImageUrl", resolvedImageUrl);
          }

          const mapped = getUserFieldMap(fetchedUser);
          setData(mapUserToFormFields(fetchedUser));

          // Sync localStorage so page refresh preserves all user data immediately
          if (mapped.firstName) localStorage.setItem("firstName", mapped.firstName);
          if (mapped.lastName) localStorage.setItem("lastName", mapped.lastName);
          if (mapped.email) localStorage.setItem("email", mapped.email);
          if (mapped.phoneNumber) localStorage.setItem("phoneNumber", mapped.phoneNumber);
        }
      } catch (err) {
        console.warn("Failed to load user data on mount:", err);
      }
    };

    void fetchUserDetails();

    return () => {
      isMounted = false;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [setProfileImageUrl]);

  return (
    <form onSubmit={handleProfileUpdate} className="flex flex-col gap-2.5">
      <div className="p-2 md:p-4 flex flex-col items-center gap-2">
        <div className="w-20 h-20 md:w-28 md:h-28 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileImage || DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            className="w-full h-full rounded-full border-4 border-orange-500 object-cover"
            loading="eager"
            onError={() => {
              if (profileImage !== DEFAULT_PROFILE_IMAGE) {
                setProfileImage(DEFAULT_PROFILE_IMAGE);
              }
            }}
          />
        </div>

        {/* hidden file input */}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <div className="flex flex-col items-center gap-1.5">
          <SecondaryBtn
            type="button"
            label="Upload"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm md:text-base px-4 py-1"
            disabled={isUpdating}
          />
          {selectedImageFile && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium animate-pulse">
              Previewing new image — click Update to save
            </span>
          )}
        </div>
      </div>

      {/* input fields */}
      <div className="flex flex-col md:flex-row md:flex-wrap">
        {data.map((field, index) => (
          <div
            key={index}
            className="flex flex-col gap-2.5 p-2 md:w-1/2 md:p-4"
          >
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {field.label}
              {field.isRequired && <span className="text-red-500">*</span>}
            </label>
            {field.name === "phoneNumber" ? (
              <div className="relative w-full">
                <input
                  type="text"
                  name="phoneNumber"
                  placeholder={field.placeholder}
                  value={field.value ?? ""}
                  className="w-full p-2 rounded-md bg-gray-100 dark:bg-[#1B1E26] text-gray-900 dark:text-white border border-transparent dark:border-white/[0.08] placeholder-gray-400 dark:placeholder-gray-500 pr-20"
                  onChange={handlePhoneChange}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                />

                {/* Show OTP request button if phone is unverified and not focused */}
                {!isPhoneFocused && !phoneVerification.isPhoneVerified && !phoneVerification.otpRequested && (
                  <button
                    type="button"
                    onClick={() => requestOtp(field.value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-400 font-semibold text-sm hover:underline"
                  >
                    {phoneVerification.isOtpLoading ? "Sending..." : "Verify OTP"}
                  </button>
                )}

                {/* OTP input box */}
                {!isPhoneFocused && phoneVerification.otpRequested && !phoneVerification.isPhoneVerified && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={phoneVerification.otp}
                      onChange={(e) =>
                        setPhoneVerification((prev) => ({ ...prev, otp: e.target.value }))
                      }
                      className="w-32 p-2 rounded-md bg-gray-100 dark:bg-[#1B1E26] text-gray-900 dark:text-white border border-transparent dark:border-white/[0.08] placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                      type="button"
                      className="px-3 py-1 bg-orange-500 text-white rounded-md"
                      onClick={() => verifyOtp(field.value, phoneVerification.otp)}
                    >
                      Verify OTP
                    </button>
                  </div>
                )}

                {/* Show Verified badge */}
                {!isPhoneFocused && phoneVerification.isPhoneVerified && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 font-semibold text-sm">
                    Verified
                  </span>
                )}
              </div>
            ) : (
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={field.value ?? ""}
                className="w-full p-2 rounded-md bg-gray-100 dark:bg-[#1B1E26] text-gray-900 dark:text-white border border-transparent dark:border-white/[0.08] placeholder-gray-400 dark:placeholder-gray-500"
                onChange={handleFieldChange}
              />
            )}

          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end p-2 md:p-4 flex-wrap">
        <SecondaryBtn
          type="button"
          label="Cancel"
          className="px-3 py-1 text-sm w-fit sm:px-4 sm:py-2"
          onClick={resetToDefaults}
          disabled={isUpdating}
        />
        <PrimaryBtn
          type="submit"
          label={isUpdating ? "Updating..." : "Update"}
          className="px-3 py-1 text-sm w-fit sm:px-4 sm:py-2"
          disabled={isUpdating}
        />

        <PrimaryBtn
          type="button"
          label="Change Password"
          className="px-3 py-1 text-sm w-fit sm:px-4 sm:py-2"
          onClick={() => router.push("/pages/forgotPassword")}
          disabled={isUpdating}
        />
      </div>
    </form>
  );
}

export default AccountSettings;
