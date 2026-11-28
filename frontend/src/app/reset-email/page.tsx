'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PrimaryBtn, inputRegister } from '@components/Button';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import apiClient from '@utilis/apiClient';
import { safeToastSuccess, safeToastError } from '@utilis/toastHelper';
import { API_ENDPOINTS } from '@constants/api';

export default function ResetPasswordEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({ newPassword: false, confirmPassword: false });

  useEffect(() => {
    if (!token) {
      safeToastError('Invalid or missing token');
      router.push('/pages/login');
    }
  }, [token, router]);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain an uppercase letter')
      .matches(/[0-9]/, 'Password must contain a number')
      .matches(/[!@#$%^&*]/, 'Password must contain a special character')
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
      .required('Confirm password is required'),
  });

  const formik = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await apiClient.post(API_ENDPOINTS.AUTH.EMAIL_VERIFICATION, {
          token,
          password: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
        safeToastSuccess('Password reset successfully!');
        router.push('/pages/login');
      } catch (err: any) {
        safeToastError(err?.response?.data?.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50 dark:bg-[#0D0E12] text-gray-900 dark:text-[#E0E2EC] transition-colors">
      <form className="w-full max-w-md bg-white dark:bg-[#16181E] border border-transparent dark:border-white/[0.08] shadow-xl rounded-2xl p-6 flex flex-col gap-4" onSubmit={formik.handleSubmit}>
        <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white mb-4">Reset Password 🔒</h2>

        {/* New Password */}
        <div className="relative w-full">
          <input
            type={showPassword.newPassword ? 'text' : 'password'}
            name="newPassword"
            placeholder="New Password"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputRegister + (formik.touched.newPassword && formik.errors.newPassword ? ' border-red-500' : '')}
          />
          <span
            onClick={() => setShowPassword(prev => ({ ...prev, newPassword: !prev.newPassword }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            👁️
          </span>
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative w-full">
          <input
            type={showPassword.confirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputRegister + (formik.touched.confirmPassword && formik.errors.confirmPassword ? ' border-red-500' : '')}
          />
          <span
            onClick={() => setShowPassword(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            👁️
          </span>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <PrimaryBtn type="submit" label={loading ? 'Submitting...' : 'Reset Password'} className="mt-2 py-3 text-lg" disabled={loading} />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Remember your password?{' '}
          <span className="text-orange-500 font-medium ml-1 hover:underline cursor-pointer" onClick={() => router.push('/pages/login')}>
            Back to Login
          </span>
        </p>
      </form>
    </div>
  );
}
