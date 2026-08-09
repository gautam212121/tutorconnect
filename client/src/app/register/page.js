"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?register=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Redirecting to registration...</p>
    </div>
  );
}
