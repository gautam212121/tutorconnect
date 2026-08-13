"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import {
  BookOpen, Users, Star, Clock, Sparkles, Check, ArrowRight, Loader2,
  ChevronRight, ArrowUpRight, GraduationCap
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

// Subject illustrations mapping
const SUBJECT_ICONS = {
  Maths: '📐', Mathematics: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  English: '📝', 'Spoken English': '🗣️', Accountancy: '📊', JEE: '🎯', 'IIT-JEE': '🎯',
  NEET: '🩺', Science: '🔬', Computer: '💻', Coding: '💻', Hindi: '📚', Economics: '📈',
  Commerce: '🏦', Arts: '🎨', Music: '🎵', Dance: '💃', Guitar: '🎸', Yoga: '🧘'
};

const POPULAR_COLORS = {
  Mathematics: 'from-blue-600 to-blue-700 hover:shadow-blue-500/20 shadow-blue-500/10',
  Maths: 'from-blue-600 to-blue-700 hover:shadow-blue-500/20 shadow-blue-500/10',
  Physics: 'from-violet-600 to-violet-700 hover:shadow-violet-500/20 shadow-violet-500/10',
  Chemistry: 'from-emerald-600 to-emerald-700 hover:shadow-emerald-500/20 shadow-emerald-500/10',
  NEET: 'from-rose-600 to-rose-700 hover:shadow-rose-500/20 shadow-rose-500/10',
  'IIT-JEE': 'from-amber-600 to-amber-700 hover:shadow-amber-500/20 shadow-amber-500/10',
  JEE: 'from-amber-600 to-amber-700 hover:shadow-amber-500/20 shadow-amber-500/10',
  'Spoken English': 'from-cyan-600 to-cyan-700 hover:shadow-cyan-500/20 shadow-cyan-500/10',
  English: 'from-cyan-600 to-cyan-700 hover:shadow-cyan-500/20 shadow-cyan-500/10',
  Guitar: 'from-indigo-600 to-indigo-700 hover:shadow-indigo-500/20 shadow-indigo-500/10',
  Yoga: 'from-teal-600 to-teal-700 hover:shadow-teal-500/20 shadow-teal-500/10',
};

const DEFAULT_POPULAR_COLORS = [
  'from-blue-600 to-blue-700 hover:shadow-blue-500/20 shadow-blue-500/10',
  'from-indigo-600 to-indigo-700 hover:shadow-indigo-500/20 shadow-indigo-500/10',
  'from-emerald-600 to-emerald-700 hover:shadow-emerald-500/20 shadow-emerald-500/10',
  'from-rose-600 to-rose-700 hover:shadow-rose-500/20 shadow-rose-500/10',
  'from-amber-600 to-amber-700 hover:shadow-amber-500/20 shadow-amber-500/10',
  'from-cyan-600 to-cyan-700 hover:shadow-cyan-500/20 shadow-cyan-500/10',
  'from-violet-600 to-violet-700 hover:shadow-violet-500/20 shadow-violet-500/10',
  'from-teal-600 to-teal-700 hover:shadow-teal-500/20 shadow-teal-500/10',
];

const TABS = [
  { id: 'All', label: 'All Subjects' },
  { id: 'Academics', label: 'Academics' },
  { id: 'Competitive Exams', label: 'Competitive Exams' },
  { id: 'Arts & Music', label: 'Arts & Music' },
  { id: 'Fitness & Sports', label: 'Fitness & Sports' },
  { id: 'Skills & Tech', label: 'Skills & Tech' },
  { id: 'Languages', label: 'Languages' },
];

export default function SubjectsDirectoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/v1/categories`)
      .then(r => r.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setCategories([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#056852] mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading subjects directory...</p>
          </div>
        </div>
      </div>
    );
  }

  // Grouping categories dynamically
  const totalCount = categories.length;
  const countByType = (type) => categories.filter(c => c.type === type).length;

  const filteredCategories = activeTab === 'All'
    ? categories
    : categories.filter(c => c.type === activeTab);

  // Popular subjects: categories marked priority high (limit to 8)
  const popularSubjects = categories
    .filter(c => c.priority === 'High')
    .slice(0, 8);

  // Grouped sections
  const academicsList = categories.filter(c => c.type === 'Academics');
  const competitiveList = categories.filter(c => c.type === 'Competitive Exams');
  const artsList = categories.filter(c => c.type === 'Arts & Music');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* Hero Stats Section (as in Image) */}
      <section className="bg-white border-b border-slate-200/50 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[
              { label: '100+ Subjects', desc: 'Academic, arts & more', icon: <BookOpen size={18} className="text-[#056852]" /> },
              { label: '5,000+ Tutors', desc: 'Verified & background-checked', icon: <Users size={18} className="text-blue-500" /> },
              { label: '₹300 Per Hour', desc: 'Affordable home tuition', icon: <Star size={18} className="text-amber-500" /> },
              { label: 'Free Demo Class', desc: 'Try before you commit', icon: <Clock size={18} className="text-purple-500" /> },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-2 sm:p-5">
                <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base">{stat.label}</h3>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 mt-0.5">{stat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Tabs Filters (row) */}
          <div className="flex gap-2 overflow-x-auto pt-6 sm:pt-8 scrollbar-none shrink-0 border-b border-slate-100 pb-3">
            {TABS.map((tab) => {
              const count = tab.id === 'All' ? totalCount : countByType(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-full border transition shrink-0 ${isActive ? 'bg-[#056852] border-[#056852] text-white shadow-md shadow-emerald-50' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Subjects Directory List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-12">

        {/* ═══════════════════════ MOST POPULAR SUBJECTS (Image 1) ═══════════════════════ */}
        {activeTab === 'All' && popularSubjects.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Most Popular Subjects</h2>
              <p className="text-xs text-slate-400 mt-0.5">Highest demand in Lucknow</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 sm:gap-4">
              {popularSubjects.map((sub, index) => {
                const colorClass = POPULAR_COLORS[sub.name] || DEFAULT_POPULAR_COLORS[index % DEFAULT_POPULAR_COLORS.length];
                return (
                  <Link
                    key={sub._id}
                    href={`/subject/${sub._id}`}
                    className={`group flex flex-col justify-between rounded-[20px] bg-gradient-to-br ${colorClass} p-4 text-white shadow-md transition-all duration-300 active:scale-95 hover:scale-105 min-h-[120px] sm:rounded-[24px] sm:min-h-[140px] sm:p-5`}
                  >
                    <div className="text-2xl filter drop-shadow sm:text-3xl">
                      {SUBJECT_ICONS[sub.name] || '📖'}
                    </div>
                    <div>
                      <h4 className="line-clamp-1 text-[11px] font-extrabold tracking-tight sm:text-xs">{sub.name}</h4>
                      <p className="mt-0.5 truncate text-[8px] font-semibold text-white/70 sm:text-[9px]">{sub.description || 'Classes 1 - 12'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════ ACADEMIC SUBJECTS SECTION ═══════════════════════ */}
        {((activeTab === 'All' && academicsList.length > 0) || activeTab === 'Academics') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800">Academic Subjects</h2>
                <p className="text-xs text-slate-400 mt-0.5">{academicsList.length} subjects available</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 sm:gap-4">
              {(activeTab === 'Academics' ? filteredCategories : academicsList).map((sub) => (
                <Link
                  key={sub._id}
                  href={`/subject/${sub._id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-emerald-100 hover:shadow-lg hover:shadow-slate-100 sm:p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg transition group-hover:bg-emerald-50 sm:h-10 sm:w-10 sm:text-xl">
                    {SUBJECT_ICONS[sub.name] || '📖'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-[11px] font-bold text-slate-800 sm:text-xs">{sub.name}</h4>
                    <p className="truncate text-[8px] text-slate-400 sm:text-[9px]">Explore Tutors</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════ COMPETITIVE EXAMS SECTION ═══════════════════════ */}
        {((activeTab === 'All' && competitiveList.length > 0) || activeTab === 'Competitive Exams') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800">Competitive Exams</h2>
                <p className="text-xs text-slate-400 mt-0.5">{competitiveList.length} categories available</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 sm:gap-4">
              {(activeTab === 'Competitive Exams' ? filteredCategories : competitiveList).map((sub) => (
                <Link
                  key={sub._id}
                  href={`/subject/${sub._id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-emerald-100 hover:shadow-lg hover:shadow-slate-100 sm:p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg transition group-hover:bg-emerald-50 sm:h-10 sm:w-10 sm:text-xl">
                    {SUBJECT_ICONS[sub.name] || '📖'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-[11px] font-bold text-slate-800 sm:text-xs">{sub.name}</h4>
                    <p className="truncate text-[8px] text-slate-400 sm:text-[9px]">Explore Tutors</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════ ARTS & MUSIC / OTHER FILTER SECTIONS ═══════════════════════ */}
        {activeTab !== 'All' && activeTab !== 'Academics' && activeTab !== 'Competitive Exams' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800">{activeTab}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{filteredCategories.length} subjects found</p>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-14 bg-white border border-slate-100 rounded-3xl max-w-sm mx-auto p-6 space-y-3">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No subjects here</h4>
                <p className="text-xs text-slate-400 leading-relaxed">We are currently adding subjects for this section. You can check back later or view Academics.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 sm:gap-4">
                {filteredCategories.map((sub) => (
                  <Link
                    key={sub._id}
                    href={`/subject/${sub._id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-emerald-100 hover:shadow-lg hover:shadow-slate-100 sm:p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg transition group-hover:bg-emerald-50 sm:h-10 sm:w-10 sm:text-xl">
                      {SUBJECT_ICONS[sub.name] || '📖'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-[11px] font-bold text-slate-800 sm:text-xs">{sub.name}</h4>
                      <p className="truncate text-[8px] text-slate-400 sm:text-[9px]">Explore Tutors</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/60">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#056852] flex items-center justify-center">
                  <GraduationCap size={16} className="text-white" />
                </div>
                <span className="text-base font-extrabold text-white">Verified<span className="text-emerald-400">Tutors</span></span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connecting students with the right tutors for better learning and brighter futures.
              </p>
              <p className="text-[11px] text-slate-500">© {new Date().getFullYear()} VerifiedTutor. All Rights Reserved.</p>
            </div>
            {['For Students', 'For Tutors', 'Company'].map((title, idx) => (
              <div key={idx}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">{title}</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  {idx === 0
                    ? ['Find a Tutor', 'How It Works', 'Subjects', 'Safety & Security'].map((item) => (
                      <li key={item}><Link href="/" className="hover:text-white transition">{item}</Link></li>
                    ))
                    : idx === 1
                      ? ['Become a Tutor', 'How Tutors Earn', 'Pricing & Commission', 'Help Center'].map((item) => (
                        <li key={item}><Link href="/careers" className="hover:text-white transition">{item}</Link></li>
                      ))
                      : ['About Us', 'Blog', 'Terms & Conditions', 'Privacy Policy'].map((item) => (
                        <li key={item}><Link href="/" className="hover:text-white transition">{item}</Link></li>
                      ))}
                </ul>
              </div>
            ))}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Newsletter</h4>
              <p className="text-xs text-slate-400 mb-3">Subscribe to get tips, updates and learning strategies.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email Address" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none" />
                <button className="px-3 bg-[#056852] hover:bg-[#045241] rounded-xl text-xs font-bold transition">OK</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
