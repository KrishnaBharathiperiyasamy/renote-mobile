'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@utilis/apiClient';
import Modal from '@components/Modal';
import { ConfirmationPopUp } from '@components/ConfirmationPopUp';
import { API_ENDPOINTS } from '@constants/api';
import { isApprovedEmail, UNAUTHORIZED_EMAIL_MESSAGE } from '@constants/approvedEmails';
import { useUser } from '@context/UserContext';
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { setTokens } from '@utilis/tokenManager';
import { syncLocalDataToBackend } from '@utilis/syncLocalData';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUser] = useState<{ userId: string; token: string } | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      safeToastError(decodeURIComponent(oauthError));
      router.replace('/pages/login');
      return;
    }

    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const authId = searchParams.get('authId');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const emailFromGoogle = searchParams.get('email');
    const phoneFromGoogle = searchParams.get('phoneNumber');
    if (!token || !authId) {
      router.replace('/pages/login');
      return;
    }

    if (!emailFromGoogle || !isApprovedEmail(emailFromGoogle)) {
      safeToastError(UNAUTHORIZED_EMAIL_MESSAGE);
      router.replace('/pages/login');
      return;
    }

    const handleLogin = async () => {
      try {
        setTokens(token, refreshToken || undefined);
        localStorage.setItem('authId', authId);
        localStorage.setItem('spa_logged_in', 'true');

        // Extract role from JWT for superadmin access
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.roleCode || payload.role;
          if (role) localStorage.setItem('role', role);
        } catch { /* ignore decode errors */ }
        localStorage.setItem('firstName', firstName || '');
        localStorage.setItem('lastName', lastName || '');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authchange'));
        }

        const { data } = await apiClient.post(API_ENDPOINTS.USERS.CREATE_USER, {
          authId,
          firstName,
          lastName,
          email: emailFromGoogle || '',
          phoneNumber: phoneFromGoogle || '',
        }, { headers: { Authorization: `Bearer ${token}` } });

        localStorage.setItem('user_id', data.user_id);
        if (emailFromGoogle)
          localStorage.setItem('email', emailFromGoogle)
        if (phoneFromGoogle)
          localStorage.setItem('phoneNumber', phoneFromGoogle)
        // Check local data
        const localVendorCompanies = JSON.parse(localStorage.getItem('vendor_companies') || '[]');
        const localCustomerCompanies = JSON.parse(localStorage.getItem('customer_companies') || '[]');
        const localInvoices = JSON.parse(localStorage.getItem("guestInvoices") || "[]");
        const localQuotations = JSON.parse(localStorage.getItem('local_quotations') || '[]');
        const localPosters = JSON.parse(localStorage.getItem('guest_posters') || '[]');

        const hasLocalData =
          localVendorCompanies.length > 0 ||
          localCustomerCompanies.length > 0 ||
          localInvoices.length > 0 ||
          localQuotations.length > 0 ||
          localPosters.length > 0;

        if (hasLocalData) {
          try {
            await syncLocalDataToBackend(data.user_id, token);
          } catch (syncErr) {
            console.warn("Background data sync notice:", syncErr);
          }
          localStorage.removeItem('vendor_companies');
          localStorage.removeItem('customer_companies');
          localStorage.removeItem('guestInvoices');
          localStorage.removeItem('local_quotations');
          localStorage.removeItem('guest_posters');
        }
        window.location.replace('/pages/home');
      } catch (err) {
        safeToastError('Google login failed');
        window.location.replace('/pages/login');
      }
    };

    handleLogin();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-orange-50">
      <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg w-full max-w-sm">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-800">Signing you in with Google...</h2>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Please wait while we prepare your workspace.
        </p>
      </div>

      {/* 🔹 Sync confirmation modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <ConfirmationPopUp
          message="We found some Local Datas. Do you want to save them to your account?"
          onYes={async () => {
            if (pendingUser) {
              await syncLocalDataToBackend(pendingUser.userId, pendingUser.token);
            }
            setShowConfirmModal(false);
            safeToastSuccess('Google Login Successful!');
            setTimeout(() => router.push('/pages/home'), 800);
          }}
          onNo={() => {
            localStorage.removeItem('vendor_companies');
            localStorage.removeItem('customer_companies');
            localStorage.removeItem('guestInvoices');
            localStorage.removeItem('local_quotations');
            localStorage.removeItem('guest_posters');
            setShowConfirmModal(false);
            safeToastSuccess('Google Login Successful!');
            setTimeout(() => router.push('/pages/home'), 800);
          }}
        />
      </Modal>
    </div>
  );
}
