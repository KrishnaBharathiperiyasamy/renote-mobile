'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pages/login?tab=register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white">
      <div className="w-7 h-7 border-2 border-[#FF6B1A] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
