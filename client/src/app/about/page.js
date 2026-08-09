"use client";

import Link from 'next/link';
import Navbar from '../components/Navbar';
import AnimatedCounter from '../components/AnimatedCounter';
import { ShieldCheck, Award, Users, BookOpen, GraduationCap, Heart, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col justify-between">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-50/40 via-transparent to-transparent pointer-events-none z-0" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 z-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
          Our Journey
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
          Empowering Learning through <br />
          <span className="text-[#056852]">Verified Home & Online Tuition</span>
        </h1>
        <p className="mt-6 text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Verified Tutor connects students with India's most trusted, background-checked, and highly qualified educators. We make personalized learning safe, efficient, and results-oriented.
        </p>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 10000, suffix: '+', label: 'Verified Educators', icon: <GraduationCap className="text-emerald-600" /> },
              { target: 50000, suffix: '+', label: 'Happy Students', icon: <Users className="text-blue-500" /> },
              { target: 100, suffix: '+', label: 'Subjects Covered', icon: <BookOpen className="text-purple-500" /> },
              { target: 98, suffix: '%', label: 'Satisfaction Rate', icon: <Heart className="text-rose-500" /> },
            ].map((stat, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                  {stat.icon}
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission & Values */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 gap-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-600 rounded-full inline-block" />
            Our Mission
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Our mission is to democratize customized tutoring. We bridge the gap between students seeking targeted learning support and passionate educators searching for tutoring opportunities. By verification and background screening, we ensure quality education is delivered in a safe home or online environment.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-emerald-600 rounded-full inline-block" />
            Our Core Promise
          </h2>
          <ul className="space-y-3 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>100% Verified Tutors:</strong> We check IDs, certifications, and teaching credentials.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>No Booking Fees:</strong> Clear and direct communication without middleman fees.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Personalized Match:</strong> Search by location, subjects, class grade, and language preference.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center w-full">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-10">Why Choose Verified Tutor?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <ShieldCheck size={28} className="text-emerald-600" />, title: 'Strict Safety Check', desc: 'Every tutor undergoes strict background verification and validation checks before their profiles go public.' },
            { icon: <Award size={28} className="text-emerald-600" />, title: 'Expert Pedagogy', desc: 'Tutors specialized in Board exams (CBSE, ICSE, UP, IB), competitive examinations like JEE, NEET, and language prep.' },
            { icon: <Users size={28} className="text-emerald-600" />, title: 'End-to-End Support', desc: 'Dedicated customer support for parent and student matching, schedules coordination, and replacements if required.' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 text-left hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-12">
        <div className="bg-[#056852] rounded-[32px] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none"></div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to boost your academic growth?</h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto mb-8">
            Find and book the top verified home tutors in your locality. Real verified reviews, zero commission, direct matching.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/?register=true" className="px-8 py-3 bg-white text-[#056852] rounded-xl font-bold hover:bg-slate-50 transition text-sm">
              Register as Student
            </Link>
            <Link href="/careers" className="px-8 py-3 bg-[#045241] border border-white/20 text-white rounded-xl font-bold hover:bg-[#034033] transition text-sm">
              Become a Tutor
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
