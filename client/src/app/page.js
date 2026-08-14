"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnimatedCounter from './components/AnimatedCounter';
import BookingModal from './components/BookingModal';
import RegisterModal from './components/RegisterModal';
import { useSocket } from '../hooks/useSocket';
import {
  Search, ShieldCheck, UserCheck, ArrowRight, MapPin, BookOpen,
  GraduationCap, Star, CheckCircle, Clock, Users, Award, ChevronDown,
  ChevronRight, Phone, Mail, Instagram, Facebook, Youtube, Linkedin,
  RefreshCw, BadgeCheck, Headphones, DollarSign, Calendar, X,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API}${url}`;
  return url;
};

// Subject icons mapping
const SUBJECT_ICONS = {
  Maths: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬',
  English: '📝', Accountancy: '📊', JEE: '🎯', NEET: '🩺',
  Science: '🔬', Computer: '💻', Hindi: '📚', Economics: '📈',
  Commerce: '🏦', Arts: '🎨', Music: '🎵', Dance: '💃',
};

const CLASSES_LIST = [
  'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4',
  'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'JEE', 'NEET', 'CUET',
];

export default function HomePage() {
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ totalTutors: 0, activeStudents: 0, demoBookings: 0 });
  const [searchSubject, setSearchSubject] = useState('');
  const [searchClass, setSearchClass] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState('student');
  const [heroSettings, setHeroSettings] = useState({
    heroTitle: 'Quality Home Tuition',
    heroSubtitle: 'Verified tutors at your doorstep',
    heroImage: '/hero-banner.jpg'
  });
  const [showTutorCta, setShowTutorCta] = useState(true);
  const [showStudentCta, setShowStudentCta] = useState(true);
  const featuredTutorsMobileRef = useRef(null);

  // Callback Form State
  const [callbackForm, setCallbackForm] = useState({
    name: '',
    phone: '',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    location: 'Lucknow',
    mode: 'Home'
  });
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [callbackError, setCallbackError] = useState('');

  const handleCallbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCallback(true);
    setCallbackError('');

    try {
      const response = await fetch(`${API}/api/v1/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: callbackForm.name,
          phone: callbackForm.phone,
          role: 'student',
          classLevel: callbackForm.classLevel,
          subject: callbackForm.subject,
          location: callbackForm.location,
          mode: callbackForm.mode
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Something went wrong');
      }

      setCallbackSubmitted(true);
    } catch (err) {
      setCallbackError(err.message);
    } finally {
      setSubmittingCallback(false);
    }
  };

  // Newsletter State & Handler
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(''); // 'loading', 'success', 'error'
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleNewsletterSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    setNewsletterMessage('');
    try {
      const response = await fetch(`${API}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setNewsletterStatus('success');
        setNewsletterEmail('');
        setNewsletterMessage('Thank you for subscribing!');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(data.message || 'Subscription failed');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Server connection error. Please try again.');
    }
  };

  const socket = useSocket();

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API}/api/v1/subjects`);
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setSubjects([]);
    }
  };

  useEffect(() => {
    // Fetch featured tutors
    fetch(`${API}/api/v1/tutors/featured`)
      .then(r => r.json())
      .then(data => setTutors(Array.isArray(data) ? data : []))
      .catch(() => setTutors([]));

    fetchSubjects();

    // Fetch stats
    fetch(`${API}/api/v1/stats/platform`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => { });

    // Fetch hero settings
    fetch(`${API}/api/v1/settings`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setHeroSettings({
            heroTitle: data.heroTitle || 'Quality Home Tuition',
            heroSubtitle: data.heroSubtitle || 'Verified tutors at your doorstep',
            heroImage: data.heroImage || '/hero-banner.jpg'
          });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCategoryChange = () => {
      fetchSubjects();
    };

    socket.on('categoryCreated', handleCategoryChange);
    socket.on('categoryUpdated', handleCategoryChange);
    socket.on('categoryDeleted', handleCategoryChange);

    return () => {
      socket.off('categoryCreated', handleCategoryChange);
      socket.off('categoryUpdated', handleCategoryChange);
      socket.off('categoryDeleted', handleCategoryChange);
    };
  }, [socket]);

  useEffect(() => {
    const container = featuredTutorsMobileRef.current;
    if (!container || typeof window === 'undefined') return;

    if (!window.matchMedia('(max-width: 639px)').matches || tutors.length < 2) return;

    const timer = window.setInterval(() => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft <= 0) return;

      const nextLeft = container.scrollLeft + Math.max(180, Math.floor(container.clientWidth * 0.52));
      if (nextLeft >= maxScrollLeft - 2) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ left: nextLeft, behavior: 'smooth' });
      }
    }, 2600);

    return () => window.clearInterval(timer);
  }, [tutors]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchSubject) params.set('subject', searchSubject);
    if (searchClass) params.set('class', searchClass);
    if (searchLocation) params.set('area', searchLocation);
    window.location.href = `/tutors?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-0">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left content */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Find the Right Tutor.{' '}
                <span className="text-emerald-600">Learn Better.</span>{' '}
                <span className="text-emerald-600">Achieve More.</span>
              </h1>
              <p className="mt-5 text-sm text-slate-500 max-w-lg leading-relaxed">
                Personalized home tuitions for Class 1 to 12, JEE, NEET and all major subjects.
                Verified tutors. Real results.
              </p>

              {/* Search Bar */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl w-full">
                <div className="grid w-full grid-cols-[minmax(88px,auto)_1fr_auto] items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-lg sm:flex sm:gap-3 sm:p-1.5">
                  {/* Location Dropdown */}
                  <select
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="min-w-0 border-r border-slate-200 bg-transparent text-xs text-slate-700 outline-none sm:min-w-fit sm:rounded-xl sm:border-r sm:bg-white sm:px-4 sm:text-sm"
                  >
                    <option value="">📍 Lucknow</option>
                    <option value="Lucknow">📍 Lucknow</option>
                    <option value="Delhi">📍 Delhi</option>
                    <option value="Mumbai">📍 Mumbai</option>
                    <option value="Bangalore">📍 Bangalore</option>
                    <option value="Hyderabad">📍 Hyderabad</option>
                    <option value="Pune">📍 Pune</option>
                    <option value="Chennai">📍 Chennai</option>
                    <option value="Kolkata">📍 Kolkata</option>
                  </select>

                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Subject, class, or tutor name..."
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="min-w-0 px-3 py-3 text-xs text-slate-700 outline-none sm:flex-1 sm:px-4 sm:text-sm"
                  />

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-slate-800 sm:px-6 sm:text-sm"
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
              </div>

              {/* Student/Teacher Choice Cards */}
              <div className="mt-12 grid grid-cols-2 gap-3 max-w-2xl sm:grid-cols-2 sm:gap-6">
                {/* Student Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 text-center hover:shadow-lg transition-all duration-300 sm:p-6">
                  <h3 className="mb-1 text-sm font-bold text-slate-900 sm:mb-2 sm:text-xl">I'm a Student</h3>
                  <p className="mb-2 text-[11px] text-slate-600 sm:mb-4 sm:text-sm">Find Your Perfect Tutor</p>
                  <p className="mb-3 text-[10px] leading-relaxed text-slate-500 sm:mb-6 sm:text-xs">Connect with 5000+ verified tutors for any subject, class or exam</p>
                  <button
                    onClick={() => {
                      setRegisterRole('student');
                      setIsRegisterOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 px-3 py-2.5 text-[11px] font-bold text-slate-900 transition-all duration-200 hover:bg-slate-900 hover:text-white sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <span className="hidden sm:inline">Register as Student</span>
                    <span className="sm:hidden">Register Student</span>
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                  </button>
                </div>

                {/* Teacher Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 text-center hover:shadow-lg transition-all duration-300 sm:p-6">
                  <h3 className="mb-1 text-sm font-bold text-slate-900 sm:mb-2 sm:text-xl">I'm a Teacher</h3>
                  <p className="mb-2 text-[11px] font-semibold text-emerald-700 sm:mb-4 sm:text-sm">Grow Your Impact</p>
                  <p className="mb-3 text-[10px] leading-relaxed text-slate-500 sm:mb-6 sm:text-xs">Reach more students, earn more, and build your teaching brand</p>
                  <button
                    onClick={() => {
                      setRegisterRole('tutor');
                      setIsRegisterOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-700 px-3 py-2.5 text-[11px] font-bold text-emerald-700 transition-all duration-200 hover:bg-emerald-700 hover:text-white sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <span className="hidden sm:inline">Register as Teacher</span>
                    <span className="sm:hidden">Register Teacher</span>
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                  </button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-4">
                {[
                  { icon: <RefreshCw size={14} />, text: '5 Free Leads / Month', sub: 'For every tutor' },
                  { icon: <DollarSign size={14} />, text: 'Only Pay on Success', sub: 'Commission on results' },
                  { icon: <BadgeCheck size={14} />, text: 'Verified & Trusted', sub: 'ID & background verified' },
                  { icon: <RefreshCw size={14} />, text: 'Auto Replace Policy', sub: "Fake leads? We replace" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-emerald-600">{badge.icon}</span>
                    <div>
                      <span className="font-semibold text-slate-700">{badge.text}</span>
                      <span className="block text-[10px] text-slate-400">{badge.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Tutor CTA Card (floating) */}
            <div className="relative w-full mt-8 lg:mt-0">
              <div className="w-full h-[320px] sm:h-[460px] lg:h-[420px] rounded-3xl overflow-hidden relative shadow-lg">
                <img
                  src={getImageUrl(heroSettings.heroImage || '/hero-banner.jpg')}
                  alt="Quality Home Tuition"
                  className="w-full h-full object-cover"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8 text-left">
                  <h3 className="text-2xl font-extrabold text-white leading-tight">
                    {heroSettings.heroTitle || 'Quality Home Tuition'}
                  </h3>
                  <p className="text-white/95 text-sm font-semibold mt-2">
                    {heroSettings.heroSubtitle || 'Verified tutors at your doorstep'}
                  </p>
                </div>
              </div>

              {/* Floating CTAs Container */}
              <div className="absolute top-4 sm:top-8 right-2 sm:right-4 flex flex-col gap-3 z-20">
                {showTutorCta && (
                  <div className="bg-white rounded-2xl shadow-xl p-5 w-56 sm:w-64 border border-slate-100 relative">
                    <button
                      onClick={() => setShowTutorCta(false)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">Are you a Tutor?</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Join Verified Tutor and start getting free leads.</p>
                    <Link
                      href="/careers"
                      className="mt-3 flex items-center justify-center gap-1 py-2 border border-slate-800 rounded-xl text-[10px] sm:text-xs font-bold text-slate-800 hover:bg-slate-800 hover:text-white transition"
                    >
                      Join as Tutor
                    </Link>
                  </div>
                )}

                {showStudentCta && (
                  <div className="bg-white rounded-2xl shadow-xl p-5 w-56 sm:w-64 border border-slate-100 relative">
                    <button
                      onClick={() => setShowStudentCta(false)}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                    <p className="font-bold text-slate-800 text-xs sm:text-sm">Looking for a Tutor?</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Find the best verified home tutors near you.</p>
                    <button
                      onClick={() => {
                        setRegisterRole('student');
                        setIsRegisterOpen(true);
                      }}
                      className="mt-3 flex w-full items-center justify-center gap-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] sm:text-xs font-bold text-white transition"
                    >
                      Find Tutor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ POPULAR SUBJECTS ═══════════════════════ */}
      <section className="py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl mb-5 sm:text-3xl font-extrabold text-center text-slate-900">Popular Subjects</h2>

          <div className="grid grid-cols-3 gap-2 sm:hidden">
            {(subjects.length > 0 ? subjects : [
              { name: 'Maths' }, { name: 'Physics' }, { name: 'Chemistry' }, { name: 'Biology' },
              { name: 'English' }, { name: 'Accountancy' }, { name: 'JEE' }, { name: 'NEET' },
            ]).slice(0, 6).map((sub, i) => (
              <Link
                key={sub.id || i}
                href={sub.id ? `/subject/${sub.id}` : `/subject/${sub.name}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 transition group-hover:bg-emerald-50">
                  {sub.image ? (
                    <img src={getImageUrl(sub.image)} alt={sub.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl">{SUBJECT_ICONS[sub.name] || '📖'}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold leading-tight text-slate-800">{sub.name}</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">Classes 1 – 12</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-0 hidden gap-4 sm:grid sm:grid-cols-4 lg:grid-cols-8">
            {(subjects.length > 0 ? subjects : [
              { name: 'Maths' }, { name: 'Physics' }, { name: 'Chemistry' }, { name: 'Biology' },
              { name: 'English' }, { name: 'Accountancy' }, { name: 'JEE' }, { name: 'NEET' },
            ]).map((sub, i) => (
              <Link
                key={sub.id || i}
                href={sub.id ? `/subject/${sub.id}` : `/subject/${sub.name}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50"
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 transition group-hover:bg-emerald-50">
                  {sub.image ? (
                    <img src={getImageUrl(sub.image)} alt={sub.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">{SUBJECT_ICONS[sub.name] || '📖'}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800">{sub.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">Classes 1 – 12</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-2 text-center">
            <Link href="/subjects" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition">
              View All Subjects <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-5 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900">How VerifiedTutor Works</h2>

          <div className="mt-0 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {[
              { step: '1', icon: <BookOpen size={28} />, title: 'Tell Us What You Need', desc: 'Choose subject, class, location and your learning goal.' },
              { step: '2', icon: <Users size={28} />, title: 'Get Matched', desc: 'We connect you with the best verified tutors near you.' },
              { step: '3', icon: <Calendar size={28} />, title: 'Start Learning', desc: 'Book a demo or start sessions at your convenient time.' },
              { step: '4', icon: <Award size={28} />, title: 'Achieve Your Goals', desc: 'Track progress and achieve better results.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center p-6">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                  {item.icon}
                </div>
                <p className="text-xs font-bold text-emerald-600 mb-1">{item.step}.</p>
                <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{item.desc}</p>
                {i < 3 && (
                  <ArrowRight size={18} className="hidden lg:block absolute top-10 -right-3 text-slate-300" />
                )}
              </div>
            ))}
          </div>

          {/* Stats boxes */}
          <div className="mt-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { target: stats.totalTutors || 10000, suffix: '+', label: 'Verified Tutors', icon: <GraduationCap size={20} className="text-emerald-600" /> },
              { target: stats.activeStudents || 50000, suffix: '+', label: 'Students Helped', icon: <Users size={20} className="text-blue-500" /> },
              { target: 100, suffix: '+', label: 'Subjects Covered', icon: <BookOpen size={20} className="text-purple-500" /> },
              { target: 4.8, suffix: '', label: 'Average Rating', icon: <Star size={20} className="text-amber-500" />, isStar: true },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                    {stat.isStar && <Star size={14} className="inline text-amber-400 fill-amber-400 ml-0.5 -mt-0.5" />}
                  </p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHY CHOOSE US ═══════════════════════ */}
      <section className="py-5 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <ShieldCheck size={22} />, title: 'Safe & Secure', desc: 'ID verified tutors & safe learning', color: 'emerald' },
              { icon: <Clock size={22} />, title: 'Flexible Scheduling', desc: 'Learn at a time that suits you', color: 'blue' },
              { icon: <DollarSign size={22} />, title: 'Affordable Pricing', desc: 'Pay only for results, not for leads', color: 'purple' },
              { icon: <Headphones size={22} />, title: 'Parent Support', desc: "We're here to help you anytime", color: 'amber' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${item.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  item.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    item.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-amber-100 text-amber-600'
                  }`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURED TUTORS ═══════════════════════ */}
      {tutors.length > 0 && (
        <section className="py-5 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900">Featured Tutors</h2>
            <p className="text-center text-slate-400 mt-2">Top-rated, verified tutors ready to help you succeed</p>

            <div
              ref={featuredTutorsMobileRef}
              className=" flex gap-4 overflow-x-auto pb-3 sm:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {tutors.map((tutor, i) => (
                <div key={tutor.id || i} className="min-w-[calc(50%-0.5rem)] snap-start">
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white">
                          {tutor.name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-sm font-bold text-slate-800">{tutor.name}</h3>
                            {tutor.verified && <BadgeCheck size={13} className="shrink-0 text-emerald-500" />}
                          </div>
                          <p className="truncate text-[10px] text-slate-400">{tutor.headline}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-semibold text-slate-700">{tutor.rating}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{tutor.experience}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {(tutor.subjects || []).slice(0, 2).map((s, j) => (
                          <span key={j} className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {tutor.location}</span>
                        <span className="font-bold text-slate-800">₹{tutor.price}<span className="font-normal text-slate-400">/hr</span></span>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/tutor/${tutor.id}`}
                          className="block w-full rounded-xl border border-emerald-200 py-2 text-center text-[11px] font-semibold text-emerald-600 transition hover:bg-emerald-50"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-0 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {tutors.map((tutor, i) => (
                <div key={tutor.id || i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {tutor.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-800 truncate">{tutor.name}</h3>
                          {tutor.verified && <BadgeCheck size={14} className="text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{tutor.headline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold text-slate-700">{tutor.rating}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{tutor.experience}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(tutor.subjects || []).slice(0, 3).map((s, j) => (
                        <span key={j} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {tutor.location}</span>
                      <span className="font-bold text-slate-800">₹{tutor.price}<span className="text-slate-400 font-normal">/hr</span></span>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <Link
                      href={`/tutor/${tutor.id}`}
                      className="block w-full py-2 text-center text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ CALLBACK / CONSULTATION FORM ═══════════════════════ */}
      <section className="py-5 bg-[#056852]/5 border-y border-emerald-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-extrabold text-[#056852] shadow-xs">
                <Clock size={14} className="text-[#056852]" /> Free Consultation • 30-Min Callback
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Find Your <span className="text-[#056852]">Perfect Home Tutor</span>
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tell us your class, subject, and location — we will match you with a background-checked expert tutor in your city within 30 minutes. First demo class is 100% free!
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "100% Verified local home & online tutors",
                  "Free 1-on-1 trial demo class before committing",
                  "Direct contact & customized learning plan"
                ].map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#056852] text-white flex items-center justify-center font-bold text-xs shrink-0">✓</div>
                    <span className="text-xs font-semibold text-slate-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#056852] mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#056852] animate-pulse"></span>
                    Find Your Perfect Tutor
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Get Callback</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Free consultation • We call within 30 minutes</p>
                </div>

                {callbackSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
                    <div className="w-12 h-12 bg-emerald-100 text-[#056852] rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-slate-800">Request Submitted Successfully!</h4>
                      <p className="text-xs text-slate-600 max-w-xs mx-auto">Thank you <strong>{callbackForm.name}</strong>. Our tutor match advisor will call you at <strong>{callbackForm.phone}</strong> shortly.</p>
                    </div>
                    <button
                      onClick={() => {
                        setCallbackSubmitted(false);
                        setCallbackForm(prev => ({ ...prev, name: '', phone: '' }));
                      }}
                      className="px-5 py-2.5 bg-[#056852] text-white text-xs font-bold rounded-xl hover:bg-[#045241] transition"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCallbackSubmit} className="space-y-4">
                    {callbackError && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{callbackError}</span>
                      </div>
                    )}

                    {/* Your Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Enter full name"
                        value={callbackForm.name}
                        onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                        <input
                          required
                          type="tel"
                          pattern="[0-9]{10}"
                          placeholder="10-digit mobile"
                          value={callbackForm.phone}
                          onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Class Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Class / Course *</label>
                        <select
                          value={callbackForm.classLevel}
                          onChange={(e) => setCallbackForm({ ...callbackForm, classLevel: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                        >
                          {CLASSES_LIST.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                        <input
                          type="text"
                          placeholder="e.g. Mathematics"
                          value={callbackForm.subject}
                          onChange={(e) => setCallbackForm({ ...callbackForm, subject: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
                      <input
                        type="text"
                        placeholder="Lucknow"
                        value={callbackForm.location}
                        onChange={(e) => setCallbackForm({ ...callbackForm, location: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                      />
                    </div>

                    {/* Mode */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Tuition Mode *</label>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                        {[
                          { id: 'Online', label: 'Online' },
                          { id: 'Home', label: 'Home' },
                          { id: 'Both', label: 'Both' }
                        ].map((m) => (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setCallbackForm({ ...callbackForm, mode: m.id })}
                            className={`py-2 rounded-lg text-xs font-bold transition ${callbackForm.mode === m.id ? 'bg-white text-slate-800 border border-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingCallback}
                      className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#056852] px-4 py-3 text-xs font-bold text-white hover:bg-[#045241] disabled:opacity-75 transition shadow-md shadow-emerald-100"
                    >
                      {submittingCallback ? (
                        <>Submitting Request...</>
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

      {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { icon: <GraduationCap size={24} className="text-emerald-600" />, target: 10000, suffix: '+', label: 'Verified Tutors' },
              { icon: <Users size={24} className="text-blue-500" />, target: 50000, suffix: '+', label: 'Students Helped' },
              { icon: <BookOpen size={24} className="text-purple-500" />, target: 100, suffix: '+', label: 'Subjects Covered' },
              { icon: <Star size={24} className="text-amber-400" />, target: 4.8, suffix: '/5', label: 'Average Rating' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-center gap-3">
                {s.icon}
                <div className="text-left">
                  <p className="text-xl font-extrabold text-emerald-700">
                    <AnimatedCounter target={s.target} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <Footer />

      {/* ═══════════════════════ BOOKING MODAL ═══════════════════════ */}
      {selectedTutorForBooking && (
        <BookingModal
          tutor={selectedTutorForBooking}
          onClose={() => setSelectedTutorForBooking(null)}
        />
      )}

      {/* ═══════════════════════ REGISTRATION MODAL ═══════════════════════ */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        initialRole={registerRole}
      />
    </div>
  );
}
