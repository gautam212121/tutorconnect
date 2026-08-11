"use client";

import { X, Search, Calendar, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f7f2] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#056852]">
          <CheckCircle2 size={14} /> Simple 3-Step Process
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
          How <span className="text-[#056852]">VerifiedTutors</span> Works
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Find verified tutors for home or online classes in 3 easy steps.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#056852] text-white font-bold shadow-md shadow-teal-900/20">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Search & Select Tutor</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Enter your location, subject, and grade level to compare verified tutor profiles, ratings, and hourly fees.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#056852] text-white font-bold shadow-md shadow-teal-900/20">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Book Free / Low-Cost Demo</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Schedule a live trial class at your preferred time. Assess the teaching style before committing to monthly classes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#056852] text-white font-bold shadow-md shadow-teal-900/20">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Start Learning & Track Progress</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Begin regular classes (home or online), track study milestones, and manage payments securely with 100% money-back guarantee.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-[#056852] py-3.5 font-bold text-white shadow-lg shadow-teal-900/20 hover:bg-[#045241] transition"
        >
          Got it, let's find a tutor
        </button>
      </div>
    </div>
  );
}
