"use client";

import Link from 'next/link';
import Navbar from '../components/Navbar';
import { ShieldCheck, Percent, UserCheck, Star, Sparkles, HeartHandshake } from 'lucide-react';

export default function WhyUsPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col justify-between">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/40 via-transparent to-transparent pointer-events-none z-0" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 z-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
          Why Verified Tutor
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
          The Safest & Most Reliable way to <br />
          <span className="text-[#056852]">Find Verified Educators</span>
        </h1>
        <p className="mt-6 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          We understand that education is personal. That's why we build tools that verify qualifications, guarantee safety, and eliminate middleman commissions.
        </p>
      </section>

      {/* Main Core Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: <ShieldCheck size={32} className="text-emerald-600" />,
              title: '100% Background Verified',
              desc: 'We verify academic credentials, teaching experience, government IDs, and references for every tutor. You only study with trusted and verified teachers.'
            },
            {
              icon: <Percent size={32} className="text-emerald-600" />,
              title: 'Zero Commission Model',
              desc: 'We do not take a cut from the tutor\'s hard-earned fee or add hidden charges to the student\'s fee. You pay directly to the tutor.'
            },
            {
              icon: <UserCheck size={32} className="text-emerald-600" />,
              title: 'Customized Matching',
              desc: 'Our intelligent filters let you sort tutors by board, subjects, location, budget, online/offline mode, and gender preference.'
            },
            {
              icon: <Star size={32} className="text-emerald-600" />,
              title: 'Real Reviews & Feedback',
              desc: 'Read authentic reviews left by other parents and students in your area to make an informed, trust-backed decision.'
            },
            {
              icon: <Sparkles size={32} className="text-emerald-600" />,
              title: 'Free Demo Class',
              desc: 'Meet your selected tutor, discuss the syllabus, and take a free trial class to ensure their teaching style aligns with your child.'
            },
            {
              icon: <HeartHandshake size={32} className="text-emerald-600" />,
              title: 'Replacement Guarantee',
              desc: 'If you are not satisfied with the match after a few sessions, contact our helpdesk and we will find a suitable replacement for free.'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-xl transition-all duration-300 flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-12">
        <div className="bg-[#056852] rounded-[32px] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Start Learning with Verified Tutors Today</h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto mb-8">
            Tell us your educational requirements and get instantly matched with verified home and online tutors in your area.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/?register=true" className="px-8 py-3 bg-white text-[#056852] rounded-xl font-bold hover:bg-slate-50 transition text-sm">
              Find My Tutor
            </Link>
            <Link href="/about" className="px-8 py-3 bg-[#045241] border border-white/20 text-white rounded-xl font-bold hover:bg-[#034033] transition text-sm">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Verified Tutor. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
}
