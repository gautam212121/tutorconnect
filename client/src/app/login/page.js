"use client";

import Link from 'next/link';
import AuthForm from '../components/AuthForm';
import { BookOpen, ArrowLeft, ShieldCheck, Star, Users } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col justify-between overflow-hidden py-8 px-4 sm:px-6">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="mx-auto w-full max-w-5xl flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#056852] border border-[#b2e8d8] transition group-hover:scale-105">
            <BookOpen size={22} strokeWidth={2.2} />
          </div>
          <span className="font-extrabold text-slate-900">
            Tutor<span className="text-[#056852]">Connect</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700 backdrop-blur-md shadow-sm hover:bg-slate-100 transition"
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Login Card Container */}
      <div className="my-auto mx-auto w-full max-w-md z-10 py-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.1)] backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7f2] text-[#056852] mb-3 border border-[#b2e8d8]">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-xs text-slate-500">
              Sign in to manage your bookings, schedule classes, or connect with verified tutors.
            </p>
          </div>

          <AuthForm mode="login" />

          {/* Demo Accounts */}
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@tutorconnect.com', pass: 'admin123', color: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100' },
                { label: 'Tutor', email: 'tutor@tutorconnect.com', pass: 'tutor123', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
                { label: 'Student', email: 'student@tutorconnect.com', pass: 'student123', color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' },
              ].map((acc) => (
                <button
                  key={acc.label}
                  onClick={async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: acc.email, password: acc.pass }),
                      });
                      const data = await res.json();
                      if (data.token) {
                        localStorage.setItem('tutorconnect-token', data.token);
                        localStorage.setItem('tutorconnect-user', JSON.stringify(data.user));
                        window.location.href = `/dashboard/${data.user.role}`;
                      }
                    } catch {}
                  }}
                  className={`flex flex-col items-center gap-0.5 rounded-xl border py-2.5 text-center transition ${acc.color}`}
                >
                  <span className="text-base">{acc.label === 'Admin' ? '🛡️' : acc.label === 'Tutor' ? '👨‍🏫' : '👨‍🎓'}</span>
                  <span className="text-[10px] font-bold">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <a href="/register" className="font-bold text-[#056852] hover:underline">Create an account</a>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mx-auto w-full max-w-5xl text-center text-xs text-slate-400 z-10">
        © 2026 TutorConnect. India's trusted 1-on-1 tutoring platform.
      </div>
    </main>
  );
}
