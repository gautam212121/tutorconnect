"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import BookingModal from '../../components/BookingModal';
import {
  BookOpen, Star, ShieldCheck, CheckCircle2, ChevronDown, GraduationCap,
  Users, MapPin, Clock, AlertCircle, Phone, ArrowRight, Loader2, Award,
  Calendar, BadgeCheck, Mail, Globe, Sparkles
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

const CLASSES_LIST = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'JEE', 'NEET', 'CUET'
];

export default function SubjectPage() {
  const params = useParams();
  const subjectId = params.id;

  const [category, setCategory] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tutorsLoading, setTutorsLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    classLevel: 'Class 10',
    subject: '',
    location: 'Lucknow',
    mode: 'Home' // Home, Online, Both
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState(null);

  // Fetch Category Details
  useEffect(() => {
    if (!subjectId) return;

    setLoading(true);
    fetch(`${API}/api/v1/categories/${subjectId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch subject');
        return r.json();
      })
      .then(data => {
        setCategory(data);
        setForm(prev => ({ ...prev, subject: data.name }));
        setLoading(false);

        // Fetch Tutors of this subject
        fetchTutors(data.name);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setTutorsLoading(false);
      });
  }, [subjectId]);

  const fetchTutors = (subjectName) => {
    setTutorsLoading(true);
    fetch(`${API}/api/v1/tutors/search?subject=${encodeURIComponent(subjectName)}`)
      .then(r => r.json())
      .then(data => {
        setTutors(Array.isArray(data.tutors) ? data.tutors : []);
        setTutorsLoading(false);
      })
      .catch(() => {
        setTutors([]);
        setTutorsLoading(false);
      });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${API}/api/v1/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          role: 'student',
          classLevel: form.classLevel,
          subject: form.subject,
          location: form.location,
          mode: form.mode
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#056852] mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading subject details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-sm px-6">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Subject Not Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed">We could not find the subject details you were looking for. It may have been renamed or archived.</p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-[#056852] text-white text-sm font-bold rounded-xl hover:bg-[#045241] transition">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback curriculum if none configured
  const curriculumSections = Array.isArray(category.curriculum) && category.curriculum.length > 0
    ? category.curriculum
    : [
      {
        title: "Class 6-8 (Foundation)",
        description: `Building the fundamental concepts of ${category.name} - basics, concepts, and problem solving Class 9 depends on.`,
        topics: ["Core Concepts", "Introductory Lessons", "Practice Sheets"]
      },
      {
        title: "Class 9-10 (Board Prep)",
        description: `Full syllabus coverage for CBSE, ICSE & state boards including previous years question bank.`,
        topics: ["Syllabus completion", "Mock Tests", "Board Pattern Analysis"]
      },
      {
        title: "Class 11-12 (Entrance Prep)",
        description: `Advanced theory, shortcut methods, and rigorous practice worksheets targeted for school & entrance exams.`,
        topics: ["Deep Dive Lectures", "Formula Sheets", "Weekly Assessment"]
      }
    ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 py-16 lg:py-20 overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[#056852] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} /> Dynamic subject curriculum
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
            Learn <span className="text-[#056852]">{category.name}</span> Online & Offline
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {category.description || `Master ${category.name} with certified personal tutors. Customized lesson plan, regular assignments, and free monthly feedback sessions.`}
          </p>
        </div>
      </section>

      {/* ═══════════════════════ WHAT WE COVER (Image 1) ═══════════════════════ */}
      <section className="py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#056852]">Curriculum</p>
            <h2 className="text-3xl font-extrabold text-slate-900">What We Cover</h2>
            <p className="text-sm text-slate-500">Class-wise structured learning for every level and exam</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculumSections.map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-100/80 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#056852] text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-emerald-100">{idx + 1}</span>
                    <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed min-h-[60px]">{item.description}</p>
                </div>

                {item.topics && item.topics.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
                    {item.topics.map((tag, tIdx) => (
                      <span key={tIdx} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FIND YOUR PERFECT TUTOR (Image 2) ═══════════════════════ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                <Clock size={12} className="text-[#056852]" /> Get Matched Instantly
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Find the Right <span className="text-[#056852]">{category.name}</span> Tutor for You
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Tell us your class, board, and subject — we'll match you with a verified local tutor within hours. First demo class is always free.
              </p>

              {/* Steps */}
              <div className="space-y-4 pt-2">
                {[
                  { step: 1, text: "Share your class, board, and subject area" },
                  { step: 2, text: "Get matched with a verified local tutor" },
                  { step: 3, text: "Book your free demo class — no obligation" }
                ].map((s, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#056852] text-white flex items-center justify-center font-bold text-xs shrink-0">{s.step}</span>
                    <span className="text-sm font-semibold text-slate-700">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Callback Form Column */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#056852] mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#056852] animate-pulse"></span>
                    Find Your Perfect Tutor
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">Get Callback</p>
                  <p className="text-xs text-slate-400 mt-0.5">Free consultation • We call within 30 minutes</p>
                </div>

                {submitted ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4 animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-emerald-100 text-[#056852] rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800">Request Received!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">We've received your request. A tutor match specialist will call you at <strong>{form.phone}</strong> shortly.</p>
                    </div>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm(prev => ({ ...prev, name: '', phone: '' }));
                      }}
                      className="px-5 py-2.5 bg-[#056852] text-white text-xs font-bold rounded-xl hover:bg-[#045241] transition"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {submitError && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Form content is strictly student-only */}

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Enter full name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                        <input
                          required
                          type="tel"
                          pattern="[0-9]{10}"
                          placeholder="10-digit mobile"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Class Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Class / Course *</label>
                        <select
                          value={form.classLevel}
                          onChange={(e) => setForm({ ...form, classLevel: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition appearance-none"
                        >
                          {CLASSES_LIST.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                        <input
                          disabled
                          type="text"
                          value={form.subject}
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">City / Location</label>
                      <input
                        type="text"
                        placeholder="Lucknow"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
                      />
                    </div>

                    {/* Mode Tabs */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Tuition Mode *</label>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                        {[
                          { id: 'Online', label: 'Online' },
                          { id: 'Home', label: 'Home' },
                          { id: 'Both', label: 'Both' }
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setForm({ ...form, mode: m.id })}
                            className={`py-2 rounded-lg text-xs font-bold transition ${form.mode === m.id ? 'bg-white text-slate-800 border border-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#056852] px-4 py-3 text-xs font-bold text-white hover:bg-[#045241] disabled:opacity-75 disabled:cursor-not-allowed transition shadow-md shadow-emerald-100"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Submitting Request...
                        </>
                      ) : (
                        <>
                          Get Free Consultation <ArrowRight size={14} />
                        </>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-slate-400">100% Free · No Spam · Direct Tutor Contact</p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TOP TUTORS LISTING (Image 2) ═══════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Top {category.name} Tutors in Lucknow</h2>
            <p className="text-sm text-slate-500">Verified, background-checked educators</p>
          </div>

          {tutorsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#056852]" />
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-12 pb-0 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 max-w-md mx-auto px-6">
              <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No tutors found</h3>
              <p className="text-xs text-slate-400 mt-1">We are currently onboarding verified tutors for {category.name} in Lucknow. In the meantime, you can submit a callback request to get matched.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 flex flex-col justify-between group">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      {tutor.image ? (
                        <img src={tutor.image} alt={tutor.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-[#056852] flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
                          {tutor.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-slate-800 text-sm truncate">{tutor.name}</h3>
                          {tutor.verified && <BadgeCheck size={14} className="text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{tutor.headline}</p>

                        {/* Rating & Exp */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            <Star size={10} className="fill-amber-400" />
                            <span className="text-[10px] font-bold text-slate-700">{tutor.rating || '5.0'}</span>
                          </div>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-semibold text-[#056852] bg-emerald-50 px-1.5 py-0.5 rounded">Active today</span>
                        </div>
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1">
                      {tutor.subjects?.slice(0, 3).map((sub, sIdx) => (
                        <span key={sIdx} className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                          {sub}
                        </span>
                      ))}
                      {tutor.subjects?.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">+{tutor.subjects.length - 3}</span>
                      )}
                    </div>

                    {/* Bio & Details */}
                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 border-t border-slate-50 mt-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={12} className="text-slate-400" />
                        <span className="truncate">{tutor.experience} Experience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate">{tutor.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="p-5 pt-0 mt-auto space-y-3">
                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                      <span className="text-[10px] text-slate-400">Tuition Fee</span>
                      <span className="text-sm font-extrabold text-slate-800">₹{tutor.price || 500}<span className="text-[10px] font-normal text-slate-400">/hr</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/tutor/${tutor.id}`}
                        className="py-2 text-center text-[11px] font-bold text-[#056852] bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition flex items-center justify-center"
                      >
                        Free Demo
                      </Link>
                      <Link
                        href={`/tutor/${tutor.id}`}
                        className="py-2 text-center text-[11px] font-bold text-white bg-[#056852] hover:bg-[#045241] rounded-xl transition shadow-sm shadow-emerald-50 flex items-center justify-center"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
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
              <p className="text-[11px] text-slate-500">© {new Date().getFullYear()} VerifiedTutors. All Rights Reserved.</p>
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

      {/* Booking Modal */}
      {selectedTutorForBooking && (
        <BookingModal
          tutor={selectedTutorForBooking}
          onClose={() => setSelectedTutorForBooking(null)}
        />
      )}
    </div>
  );
}
