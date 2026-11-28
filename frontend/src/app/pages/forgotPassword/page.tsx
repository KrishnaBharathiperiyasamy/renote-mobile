'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import apiClient from '@utilis/apiClient';
import { API_ENDPOINTS } from '@constants/api';
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from '@constants/approvedEmails';
import {
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step: 1 = Identify, 2 = Verify OTP, 3 = Reset Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // UI State
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(5);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Timers
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 mins
  const [cooldownSeconds, setCooldownSeconds] = useState(60); // 60s resend

  // Expiry countdown timer (Step 2)
  useEffect(() => {
    if (step !== 2) return;
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  // Resend cooldown timer (Step 2)
  useEffect(() => {
    if (step !== 2) return;
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldownSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Validations
  const isEmailValid = isApprovedEmail(email);
  const isPhoneValid = /^\d{10}$/.test(phoneNumber.trim());

  // Password criteria check
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[\W_]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  /**
   * STEP 1: Request OTP
   */
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isEmailValid) {
      return safeToastError(UNAUTHORIZED_EMAIL_MESSAGE);
    }
    if (!isPhoneValid) {
      return safeToastError('Please enter a valid 10-digit registered phone number.');
    }

    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.USERS.FORGOT_REQUEST_OTP, {
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      safeToastSuccess(res.data?.message || 'OTP sent successfully!');
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setExpirySeconds(res.data?.expiresInSeconds || 300);
      setCooldownSeconds(60);
      setRemainingAttempts(5);
      setOtp('');
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to verify account or send OTP.';
      safeToastError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 2: Verify OTP
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      return safeToastError('Please enter the complete 6-digit OTP.');
    }
    if (expirySeconds <= 0) {
      return safeToastError('OTP has expired. Please click "Resend OTP" to receive a new code.');
    }

    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.USERS.FORGOT_VERIFY_OTP, {
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        otp: cleanOtp,
      });

      safeToastSuccess(res.data?.message || 'OTP verified successfully!');
      setResetToken(res.data?.resetToken || '');
      setStep(3);
    } catch (err: any) {
      const resData = err.response?.data;
      if (resData?.remainingAttempts !== undefined) {
        setRemainingAttempts(resData.remainingAttempts);
      }
      const msg = resData?.message || 'Invalid OTP. Please check and try again.';
      safeToastError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 3: Reset Password
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      return safeToastError('Password does not meet the security criteria.');
    }
    if (!isPasswordMatch) {
      return safeToastError('Passwords do not match.');
    }
    if (!resetToken) {
      return safeToastError('Reset authorization expired. Please verify OTP again.');
    }

    setLoading(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.USERS.FORGOT_RESET_PASSWORD, {
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        resetToken,
        newPassword,
      });

      safeToastSuccess(res.data?.message || 'Password reset successfully! Redirecting...');
      setTimeout(() => {
        router.push('/pages/login');
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      safeToastError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen min-h-screen bg-white overflow-hidden font-sans">
      {/* Left side illustration */}
      <div className="hidden md:flex w-1/2 justify-center items-center bg-white p-6 select-none pointer-events-none">
        <img
          src="/login-illustration.png"
          alt="Password Recovery"
          className="w-[420px] max-w-full"
        />
      </div>

      {/* Right side interactive card */}
      <div className="w-full h-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[440px] p-6 sm:p-8 bg-white shadow-xl rounded-2xl flex flex-col border border-gray-100">

          {/* Header & Step Pills */}
          <div className="mb-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5722] mb-3">
              {step === 1 && <ShieldCheck className="w-6 h-6" />}
              {step === 2 && <KeyRound className="w-6 h-6" />}
              {step === 3 && <Lock className="w-6 h-6" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {step === 1 && 'Recover Password'}
              {step === 2 && 'Verify Recovery OTP'}
              {step === 3 && 'Set New Password'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {step === 1 && 'Verify your registered authorized email address & phone number'}
              {step === 2 && `Enter the 6-digit OTP sent to +91 ******${phoneNumber.slice(-4)}`}
              {step === 3 && 'Create a strong, secure password for your account'}
            </p>

            {/* Step Progress indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-8 bg-[#FF5722]' : 'w-4 bg-gray-200'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-8 bg-[#FF5722]' : 'w-4 bg-gray-200'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step === 3 ? 'w-8 bg-[#FF5722]' : 'w-4 bg-gray-200'}`} />
            </div>
          </div>

          {/* Dev OTP Banner (development environment assistance) */}
          {devOtpHint && step === 2 && (
            <div className="mb-4 p-2.5 rounded-lg bg-orange-50/80 border border-orange-200 flex items-center justify-between text-xs text-orange-800">
              <span>Test OTP: <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong></span>
              <button
                type="button"
                onClick={() => setOtp(devOtpHint)}
                className="text-xs font-bold text-[#FF5722] underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* ═══════════════ STEP 1: IDENTIFY ═══════════════ */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 text-xs text-gray-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  Both the authorized email address and phone number must belong to your existing registered account.
                </span>
              </div>

              {/* Registered Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@krishub.in"
                    className="w-full py-2.5 pl-9 pr-3.5 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition"
                  />
                </div>
                {email && !isEmailValid && (
                  <p className="text-red-500 text-[11px] mt-1">{UNAUTHORIZED_EMAIL_MESSAGE}</p>
                )}
              </div>

              {/* Registered Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full py-2.5 pl-9 pr-3.5 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722] transition"
                  />
                </div>
                {phoneNumber && !isPhoneValid && (
                  <p className="text-red-500 text-[11px] mt-1">Must be exactly 10 digits</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isEmailValid || !isPhoneValid}
                className="w-full py-2.5 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] text-white font-semibold text-sm shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Verifying Account...' : 'Send Recovery OTP'}
              </button>
            </form>
          )}

          {/* ═══════════════ STEP 2: VERIFY OTP ═══════════════ */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    Enter 6-Digit OTP
                  </label>
                  <span className={`text-xs font-mono font-medium ${expirySeconds < 60 ? 'text-red-500 font-bold animate-pulse' : 'text-gray-500'}`}>
                    ⏱ Expires: {formatTimer(expirySeconds)}
                  </span>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full py-3 px-4 text-center tracking-[0.5em] text-2xl font-bold font-mono rounded-lg border border-gray-300 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                />
              </div>

              {/* Status & Attempt Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>
                  {remainingAttempts !== null && remainingAttempts < 5 ? (
                    <span className="text-amber-600 font-medium">
                      ⚠️ {remainingAttempts} attempts remaining
                    </span>
                  ) : (
                    <span>Max 5 attempts allowed</span>
                  )}
                </span>

                {/* Resend button */}
                <button
                  type="button"
                  disabled={loading || cooldownSeconds > 0}
                  onClick={() => handleRequestOtp()}
                  className="text-[#FF5722] font-semibold hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>
                    {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend OTP'}
                  </span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || expirySeconds <= 0}
                className="w-full py-2.5 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] text-white font-semibold text-sm shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Change Gmail or Phone number
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════ STEP 3: RESET PASSWORD ═══════════════ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full py-2.5 pl-9 pr-10 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full py-2.5 pl-9 pr-10 rounded-lg border border-gray-300 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !isPasswordMatch && (
                  <p className="text-red-500 text-[11px] mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1 text-gray-600">
                <span className="font-semibold block text-gray-700 mb-1">Password must include:</span>
                <div className="grid grid-cols-2 gap-1">
                  <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 8+ Characters
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasLower ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Number (0-9)
                  </span>
                  <span className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Special character (!@#$%^&*)
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isPasswordValid || !isPasswordMatch}
                className="w-full py-2.5 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] text-white font-semibold text-sm shadow-sm transition active:scale-[0.99] cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login link */}
          <div className="text-center pt-5 mt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/pages/login')}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
