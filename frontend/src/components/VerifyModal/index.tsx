'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@constants/api';
import { inputRegister, PrimaryBtn } from '@components/Button';
import { safeToastError, safeToastSuccess } from '@utilis/toastHelper';

interface VerifyOtpModalProps {
  phoneNumber?: string;         
  purpose: 'register' | 'login'; 
  onClose: () => void;
  onVerified?: () => void;
  showMessage?: string;
}

export default function VerifyOtpModal({
  phoneNumber: initialPhone,
  purpose,
  onClose,
  onVerified,
  showMessage,
}: VerifyOtpModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(purpose === 'register');
  const validateOtp = (value: string) => {
    if (!value) return 'OTP is required';
    if (value.length !== 6) return 'OTP must be 6 digits';
    return '';
  };

  const requestOtp = async () => {
    if (!phoneNumber) return safeToastError('Phone number is required');
    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.AUTH.REQUEST_OTP, {
        phoneNumber,
        purpose: 'register',
      });
      safeToastSuccess('OTP sent successfully!');
      setOtpSent(true);
    } catch (err: any) {
      safeToastError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpError = validateOtp(otp);
    if (otpError) return safeToastError(otpError);

    setLoading(true);
    try {
      await axios.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        phoneNumber,
        otp,
        purpose: 'register',
      });
      safeToastSuccess('Phone number verified successfully!');
      if (onVerified) onVerified();
      onClose();
    } catch (err: any) {
      safeToastError(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-30 z-50">
      <form
        onSubmit={handleVerify}
        className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 flex flex-col gap-4 relative"
      >
        <h2 className="text-xl font-semibold text-center text-gray-800">Verify Phone Number</h2>

        {showMessage && (
          <div className="text-sm text-center py-2 px-4 rounded bg-green-100 text-green-700">
            {showMessage}
          </div>
        )}

        {/* Only show phone input for login */}
        {purpose === 'login' && !otpSent && (
          <>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className={inputRegister}
            />
            <PrimaryBtn
              type="button"
              label={loading ? 'Sending OTP...' : 'Request OTP'}
              onClick={requestOtp}
              disabled={loading}
            />
          </>
        )}

        {/* OTP input for both flows */}
        {otpSent && (
          <>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className={inputRegister}
            />
            <PrimaryBtn
              type="submit"
              label={loading ? 'Verifying...' : 'Verify OTP'}
              disabled={loading}
            />
          </>
        )}
      </form>
    </div>
  );
}
