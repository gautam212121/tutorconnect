"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { Search, ShieldAlert, CalendarRange, GraduationCap, CheckCircle2, UserCheck, Flame, BookMarked } from 'lucide-react';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState('student');

  const studentSteps = [
    {
      step: '1',
      icon: <Search size={28} className="text-emerald-600" />,
      title: 'Submit Callback or Search Tutors',
      desc: 'Fill out our quick callback form with your subject, class level, location, and requirements, or explore verified tutor profiles manually.'
    },
    {
      step: '2',
      icon: <UserCheck size={28} className="text-emerald-600" />,
      title: 'Get Matched & Review Profiles',
      desc: 'Our platform matches you with the best available tutors nearby. Review their qualifications, experience, and parent feedback.'
    },
    {
      step: '3',
      icon: <CalendarRange size={28} className="text-emerald-600" />,
      title: 'Take a Free Trial Class',
      desc: 'Coordinate with the tutor to schedule a free online or offline demo session. Ensure they fit your learning style before committing.'
    },
    {
      step: '4',
      icon: <CheckCircle2 size={28} className="text-emerald-600" />,
      title: 'Confirm & Pay Direct',
      desc: 'Finalize schedules and classes per week. Pay the tutor directly, with zero commission or middleman charges.'
    }
  ];

  const tutorSteps = [
    {
      step: '1',
      icon: <GraduationCap size={28} className="text-emerald-600" />,
      title: 'Create Your Profile',
      desc: 'Sign up and fill out your academic qualification, teaching board, subjects, rates, location availability, and upload verification IDs.'
    },
    {
      step: '2',
      icon: <ShieldAlert size={28} className="text-emerald-600" />,
      title: 'Verification Process',
      desc: 'Our team reviews your certificates and documents. Verified profiles get a trust badge, ranking boost, and search visibility.'
    },
    {
      step: '3',
      icon: <Flame size={28} className="text-emerald-600" />,
      title: 'Unlock Leads & Connect',
      desc: 'Browse student callback requests. Tutors get 5 free leads per month to unlock contact information and initiate trial sessions.'
    },
    {
      step: '4',
      icon: <BookMarked size={28} className="text-emerald-600" />,
      title: 'Deliver Classes & Keep 100%',
      desc: 'Schedule classes directly with students. Receive 100% of your earnings straight from the client without any commission cuts.'
    }
  ];

  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col justify-between">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/40 via-transparent to-transparent pointer-events-none z-0" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 z-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
          Guide & Walkthrough
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
          How Verified Tutor Works
        </h1>
        <p className="mt-4 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Simple, safe, and transparent process. Select your role below to learn how you can start using our platform today.
        </p>

        {/* Toggle Switch */}
        <div className="mt-8 inline-flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'student' ? 'bg-[#056852] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            For Students & Parents
          </button>
          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'tutor' ? 'bg-[#056852] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            For Educators / Tutors
          </button>
        </div>
      </section>

      {/* Steps List */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(activeTab === 'student' ? studentSteps : tutorSteps).map((step, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between">
              <div>
                <span className="absolute top-6 right-6 text-3xl font-extrabold text-slate-200">
                  0{step.step}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-12">
        <div className="bg-[#056852] rounded-[32px] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none"></div>
          <h2 className="text-3xl font-extrabold mb-4">
            {activeTab === 'student' ? 'Ready to find your personal tutor?' : 'Grow your tuition career today!'}
          </h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto mb-8">
            {activeTab === 'student'
              ? 'Get matched with background-verified tutors in your locality. Schedule a trial class today.'
              : 'Sign up, complete your profile verification, and start connecting with students near you.'}
          </p>
          <div className="flex justify-center">
            <Link href={activeTab === 'student' ? '/?register=true' : '/careers'} className="px-8 py-3 bg-white text-[#056852] rounded-xl font-bold hover:bg-slate-50 transition text-sm">
              {activeTab === 'student' ? 'Register Now' : 'Apply as Tutor'}
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
