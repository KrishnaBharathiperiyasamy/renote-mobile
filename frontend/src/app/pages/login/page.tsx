'use client';

import React, { Suspense } from 'react';
import AuthLoginPage from '@components/Auth/AuthLoginPage';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthLoginPage />
    </Suspense>
  );
}
