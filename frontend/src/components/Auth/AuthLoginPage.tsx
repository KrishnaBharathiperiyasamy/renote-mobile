'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@utilis/apiClient';
import { API_ENDPOINTS, AUTH_APP_CODE, AUTH_ROLE_CODE } from '@constants/api';
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from '@constants/approvedEmails';
import { useUser } from '@context/UserContext';
import { safeToastSuccess, safeToastError } from '@utilis/toastHelper';
import { setTokens } from '@utilis/tokenManager';
import { Eye, EyeOff, User, Phone } from 'lucide-react';

/* ── Google Logo SVG ── */
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface AuthLoginPageProps {
  onSuccess?: () => void;
  redirectUrl?: string | null;
}

export default function AuthLoginPage({ onSuccess, redirectUrl: propRedirectUrl }: AuthLoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = propRedirectUrl || searchParams?.get('redirect') || '/';
  const { refreshUser } = useUser();

  const initialMode = searchParams?.get('tab') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  React.useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'register') {
      setMode('register');
    } else if (tab === 'login') {
      setMode('login');
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  /* ── Save session data & complete login ── */
  const finalizeAuth = (data: any) => {
    const { accessToken, refreshToken, user } = data;
    let authId = user?.id || user?.authId || user?._id || user?.sub || user?.userId;

    if (!authId && accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        authId = payload.authId || payload.sub || payload.id || payload.userId;
      } catch { }
    }

    if (!accessToken || !authId) {
      throw new Error('Invalid response structure received from server');
    }

    // Extra guard: verify that the authenticated account has an approved email address
    const resolvedEmail = user?.email || (() => {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return payload.email;
      } catch {
        return null;
      }
    })();

    if (!resolvedEmail || !isApprovedEmail(resolvedEmail)) {
      setErrorMessage(UNAUTHORIZED_EMAIL_MESSAGE);
      safeToastError(UNAUTHORIZED_EMAIL_MESSAGE);
      return;
    }

    setTokens(accessToken, refreshToken);
    localStorage.setItem('authId', String(authId));
    localStorage.setItem('user_id', String(user?.id || user?._id || authId));
    localStorage.setItem('spa_logged_in', 'true');

    const nameParts = (user?.fullName || '').split(' ');
    localStorage.setItem('firstName', user?.firstName || nameParts[0] || 'User');
    localStorage.setItem('phoneNumber', user?.phone || user?.phoneNumber || '');
    localStorage.setItem('lastName', user?.lastName || nameParts.slice(1).join(' ') || '');
    if (user?.email) localStorage.setItem('email', user.email);
    const avatar = user?.uploadedImage || user?.profilePic || user?.profileImageUrl || user?.profileImage;
    if (avatar) localStorage.setItem('profileImageUrl', avatar);

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.roleCode) localStorage.setItem('role', payload.roleCode);
    } catch {
      /* ignore decode error */
    }

    refreshUser();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authchange'));
    }

    safeToastSuccess('Login Successful! Welcome to ReNote');

    if (onSuccess) {
      onSuccess();
    } else {
      const target = redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/';
      router.push(target);
    }
  };

  /* ── Handle Login Submit ── */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your phone number or email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (cleanIdentifier.includes('@')) {
      if (!isApprovedEmail(cleanIdentifier)) {
        setErrorMessage(UNAUTHORIZED_EMAIL_MESSAGE);
        safeToastError(UNAUTHORIZED_EMAIL_MESSAGE);
        return;
      }
    }

    setLoading(true);
    try {
      const loginPayload = {
        emailOrPhone: cleanIdentifier,
        password,
        appCode: AUTH_APP_CODE,
      };

      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, loginPayload, {
        withCredentials: true,
      });

      if (res.data?.success && res.data?.data) {
        finalizeAuth(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response?.data?.errors.join(', ') : null) ||
        err.message ||
        'Login failed. Please check your credentials.';
      setErrorMessage(serverMsg);
      safeToastError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Handle Register Submit ── */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = regPhone.replace(/\D/g, '').trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanFirst) {
      setErrorMessage('First name is required.');
      return;
    }
    if (!cleanEmail || !isApprovedEmail(cleanEmail)) {
      setErrorMessage(UNAUTHORIZED_EMAIL_MESSAGE);
      safeToastError(UNAUTHORIZED_EMAIL_MESSAGE);
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const registerPayload: any = {
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        email: cleanEmail,
        password: regPassword,
        appCode: AUTH_APP_CODE,
        roleCode: AUTH_ROLE_CODE,
      };

      const res = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, registerPayload);

      if (res.data?.success && res.data?.data) {
        finalizeAuth(res.data.data);
      } else {
        safeToastSuccess('Registration successful! Please sign in.');
        setIdentifier(cleanPhone || cleanEmail);
        setPassword(regPassword);
        setMode('login');
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response?.data?.errors.join(', ') : null) ||
        err.message ||
        'Registration failed. Please check your details.';
      setErrorMessage(serverMsg);
      safeToastError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth Redirect ── */
  const handleGoogleLogin = () => {
    window.location.href = API_ENDPOINTS.AUTH.GOOGLE_LOGIN(AUTH_APP_CODE, AUTH_ROLE_CODE);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen min-h-screen bg-white overflow-hidden font-sans select-none">
      {/* ── Left Side: Illustration matching reference design ── */}
      <div className="hidden md:flex w-1/2 justify-center items-center bg-white p-6">
        <img
          src="/login-illustration.png"
          alt="Login Illustration"
          className="w-[420px] max-w-full select-none pointer-events-none drop-shadow-sm"
        />
      </div>

      {/* ── Right Side: Elevated Form Container ── */}
      <div className="w-full h-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[420px] p-6 sm:p-8 bg-white shadow-xl rounded-2xl flex flex-col border border-gray-100">
          {mode === 'login' ? (
            /* ═══════════ LOGIN MODE ═══════════ */
            <form onSubmit={handleLoginSubmit} noValidate className="flex flex-col">
              <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                Welcome Back! 🌟
              </h2>

              {errorMessage && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-red-400 hover:text-red-600 ml-2 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Identifier Input */}
              <div className="relative w-full mb-3.5">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Phone number or Email"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-3.5 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 bg-white transition-colors focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              {/* Password Input */}
              <div className="relative w-full mb-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={loading}
                  className="w-full py-2.5 px-3.5 pr-10 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 bg-white transition-colors focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password link */}
              <div className="flex justify-end w-full mb-4">
                <button
                  type="button"
                  onClick={() => router.push('/pages/forgotPassword')}
                  className="text-xs text-red-500 font-medium hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#FF6B00] text-white font-semibold text-sm hover:bg-[#E05E00] active:scale-[0.99] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

              {/* Create account toggle */}
              <div className="text-center mt-3 text-xs">
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('register');
                  }}
                  className="text-orange-500 font-medium hover:underline cursor-pointer"
                >
                  Create an account?
                </span>
              </div>

              {/* Divider */}
              <div className="flex items-center my-3">
                <div className="flex-grow h-px bg-gray-200" />
                <span className="px-3 text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-grow h-px bg-gray-200" />
              </div>

              {/* Google login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm shadow-sm hover:bg-gray-50 transition-all cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </form>
          ) : (
            /* ═══════════ REGISTER MODE ═══════════ */
            <form onSubmit={handleRegisterSubmit} noValidate className="flex flex-col gap-2.5">
              <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Create an Account! 🌟
              </h2>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-red-400 hover:text-red-600 ml-2 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <input
                id="regPhone"
                name="regPhone"
                type="tel"
                placeholder="Phone Number (10 digits) *"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />

              <input
                id="regEmail"
                name="regEmail"
                type="email"
                placeholder="Official Krishub Email (@krishub.in) *"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />

              <div className="relative w-full">
                <input
                  id="regPassword"
                  name="regPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Password (min 8 chars) *"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={loading}
                  className="w-full py-2 px-3 pr-10 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <input
                id="regConfirmPassword"
                name="regConfirmPassword"
                type="password"
                placeholder="Confirm Password *"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-1 rounded-lg bg-[#FF6B00] text-white font-semibold text-sm hover:bg-[#E05E00] active:scale-[0.99] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              <div className="text-center mt-1 text-xs">
                <span
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="text-orange-500 font-medium hover:underline cursor-pointer"
                >
                  Already have an account? Sign In
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
