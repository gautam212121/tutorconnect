"use client";

import Link from 'next/link';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingModal from '../components/BookingModal';
import {
  MapPin, Star, Clock, BookOpen, Home, ChevronDown,
  SlidersHorizontal, X, Heart, CheckCircle, Search,
  ChevronLeft, ChevronRight, MoreHorizontal, CalendarDays,
  Users, Zap, ArrowUpDown, RotateCcw,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SUBJECT_ICONS = {
  Mathematics: '𝜋',
  Physics: '⚛',
  Chemistry: '🧪',
  English: '📖',
  Coding: '</>',
  Biology: '🌿',
  History: '🏛',
  default: '📚',
};

const SUBJECT_COLORS = {
  Mathematics: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', active: 'bg-purple-600' },
  Physics:     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   active: 'bg-blue-600' },
  Chemistry:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  active: 'bg-green-600' },
  English:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', active: 'bg-orange-600' },
  Coding:      { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   active: 'bg-cyan-600' },
  Biology:     { bg: 'bg-lime-50',   text: 'text-lime-700',   border: 'border-lime-200',   active: 'bg-lime-600' },
  default:     { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   active: 'bg-[#056852]' },
};

const TAG_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
];

const ITEMS_PER_PAGE = 5;

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function TutorCard({ tutor, onBook, onProfile, index }) {
  const [liked, setLiked] = useState(false);
  const exp = tutor.experience || (3 + (index % 5)) + '+ years experience';
  const availability = tutor.availability || 'Mon - Sat';
  const subjects = tutor.subjects && tutor.subjects.length ? tutor.subjects : ['General'];

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Wishlist */}
      <button
        onClick={() => setLiked((l) => !l)}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-all"
        aria-label="Save tutor"
      >
        <Heart size={14} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-2xl font-bold text-teal-700">
            {tutor.image
              ? <img src={tutor.image} alt={tutor.name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              : tutor.name && tutor.name.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
            <CheckCircle size={10} className="text-white fill-white" strokeWidth={0} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h2 className="text-base font-bold text-slate-900 truncate">{tutor.name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
              <Star size={10} className="fill-amber-500 text-amber-500" />
              {tutor.rating || '4.8'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{exp}</span>
          </div>

          <p className="text-sm text-slate-500 truncate mb-2">
            {tutor.headline || tutor.subject || 'Expert Tutor'}
            {tutor.location && (
              <> &nbsp;·&nbsp; <span className="inline-flex items-center gap-0.5"><MapPin size={11} className="shrink-0" />{tutor.location}</span></>
            )}
          </p>

          {/* Subject Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {subjects.slice(0, 4).map((sub, i) => (
              <span key={sub} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG_COLORS[i % TAG_COLORS.length]}`}>{sub}</span>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Home size={11} />home tuition</span>
            <span className="flex items-center gap-1"><Users size={11} />{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1"><CalendarDays size={11} />{availability}</span>
            <span className="flex items-center gap-1 font-medium text-slate-700">₹{tutor.price || tutor.rate || 500}/hr</span>
          </div>
        </div>

        {/* Right: Price + CTA */}
        <div className="flex sm:flex-col sm:items-end items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">₹{tutor.price || tutor.rate || 500}<span className="text-sm font-normal text-slate-500">/hr</span></p>
            <p className="text-xs text-slate-400">Starts at</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => onBook(tutor)}
              className="rounded-xl bg-[#056852] px-4 py-2 text-sm font-semibold text-white hover:bg-[#045241] active:scale-95 transition-all shadow-sm shadow-[#056852]/20 whitespace-nowrap"
            >
              Book Demo
            </button>
            <button
              onClick={() => onProfile(tutor)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[#056852] hover:text-[#056852] transition-all whitespace-nowrap"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvailableBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Available
    </span>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#056852] hover:text-[#056852] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === '...'
          ? <span key={'dots-' + i} className="flex h-8 w-8 items-center justify-center text-slate-400"><MoreHorizontal size={14} /></span>
          : <button
              key={p}
              onClick={() => onChange(p)}
              className={'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ' + (
                page === p
                  ? 'bg-[#056852] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#056852] hover:text-[#056852]'
              )}
            >
              {p}
            </button>
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#056852] hover:text-[#056852] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function TutorsPageContent() {
  const searchParams = useSearchParams();

  const [selectedTutor, setSelectedTutor] = useState(null);
  const [profileTutor, setProfileTutor] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [location, setLocation] = useState('');
  const [grade, setGrade] = useState('');
  const [priceMax, setPriceMax] = useState(2000);
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(API_URL + '/api/v1/subjects')
      .then((r) => r.json())
      .then((d) => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    const sub = searchParams.get('subject') || 'all';
    setSelectedSubject(sub);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedSubject !== 'all') params.set('subject', selectedSubject);
    const query = params.toString() ? '?' + params.toString() : '';
    fetch(API_URL + '/api/v1/tutors/search' + query)
      .then((r) => r.json())
      .then((d) => { setTutors(d.tutors || []); setPage(1); })
      .catch(() => setTutors([]))
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  const filtered = tutors.filter((t) => {
    if (location.trim() && !t.location?.toLowerCase().includes(location.toLowerCase())) return false;
    if (priceMax < 2000 && (t.price || t.rate || 0) > priceMax) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price || a.rate || 0) - (b.price || b.rate || 0);
    if (sortBy === 'price_desc') return (b.price || b.rate || 0) - (a.price || a.rate || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleReset = () => {
    setLocation('');
    setGrade('');
    setPriceMax(2000);
    setAvailability('');
    setSelectedSubject('all');
  };

  const allSubjects = [
    { id: 'all', name: 'All Subjects', count: tutors.length },
    ...subjects.map((s) => ({
      ...s,
      count: tutors.filter((t) => (t.subjects && t.subjects.includes(s.name)) || t.subject === s.name).length,
    })),
  ];

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">Filters</h2>
        <button onClick={handleReset} className="flex items-center gap-1 text-xs font-semibold text-[#056852] hover:underline">
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject</label>
        <div className="relative">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#056852] focus:ring-1 outline-none"
          >
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Location</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your area"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 focus:border-[#056852] outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Class / Grade</label>
        <div className="relative">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#056852] outline-none"
          >
            <option value="">All classes</option>
            {['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','Graduation','Competitive Exams'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Price Range
          <span className="normal-case font-normal text-slate-500">₹0 – ₹{priceMax === 2000 ? '2000+' : priceMax}</span>
        </label>
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className="w-full accent-[#056852] cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>₹0</span>
          <span>₹2000+/hr</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600 uppercase tracking-wide">Availability</label>
        <div className="relative">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#056852] outline-none"
          >
            <option value="">Any time</option>
            <option>Weekdays</option>
            <option>Weekends</option>
            <option>Mon - Sat</option>
            <option>Mon - Sun</option>
            <option>Evenings only</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#056852] py-2.5 text-sm font-semibold text-white hover:bg-[#045241] active:scale-95 transition-all shadow-sm shadow-[#056852]/20">
        <SlidersHorizontal size={14} /> Apply Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* HERO BANNER */}
      <div className="bg-white border-b border-slate-100 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#056852] mb-1">Tutor Discovery</p>
              <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl leading-tight">
                Find the right tutor for you
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">Book a demo class and start learning at home.</p>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-[#056852]/20 bg-gradient-to-br from-[#056852]/5 to-teal-50 px-5 py-4 shadow-sm lg:max-w-sm w-full">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#056852]/10 text-3xl">🏠</div>
              <div>
                <p className="text-sm font-bold text-slate-800">Home tutoring</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Personalized learning at your convenience. One-on-one sessions.</p>
              </div>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {allSubjects.map((sub) => {
              const colors = SUBJECT_COLORS[sub.name] || SUBJECT_COLORS.default;
              const icon = SUBJECT_ICONS[sub.name] || SUBJECT_ICONS.default;
              const active = selectedSubject === sub.id || (sub.id === 'all' && selectedSubject === 'all');
              return (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubject(sub.id); setPage(1); }}
                  className={'flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-150 ' + (
                    active
                      ? 'border-[#056852] bg-[#056852] text-white shadow-sm shadow-[#056852]/20'
                      : colors.bg + ' ' + colors.text + ' ' + colors.border + ' hover:shadow-sm'
                  )}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span>{sub.name}</span>
                  {sub.count !== undefined && (
                    <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (active ? 'bg-white/20 text-white' : 'bg-white/60')}>
                      {sub.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Mobile filter toggle */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold text-slate-700">
            {loading ? 'Loading…' : filtered.length + ' tutors found'}
          </p>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-[#056852] hover:text-[#056852] transition"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
                  <X size={16} />
                </button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* SIDEBAR */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FilterPanel />
            </div>
          </aside>

          {/* MAIN */}
          <section className="flex-1 min-w-0">
            {/* Header row */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700">
                {loading
                  ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#056852] border-t-transparent" /> Loading…</span>
                  : <><span className="text-[#056852] font-bold">{filtered.length}</span> Tutors found</>
                }
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#056852] outline-none cursor-pointer"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Tutor cards */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex gap-4">
                      <div className="skeleton h-16 w-16 rounded-2xl" />
                      <div className="flex-1 space-y-3 pt-1">
                        <div className="skeleton h-4 w-40 rounded-full" />
                        <div className="skeleton h-3 w-64 rounded-full" />
                        <div className="flex gap-2">
                          <div className="skeleton h-5 w-16 rounded-full" />
                          <div className="skeleton h-5 w-16 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : paginated.length > 0 ? (
              <div className="space-y-3">
                {paginated.map((tutor, i) => (
                  <div key={tutor.id || i} className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <AvailableBadge />
                    </div>
                    <div className="pt-6">
                      <TutorCard
                        tutor={tutor}
                        index={(page - 1) * ITEMS_PER_PAGE + i}
                        onBook={setSelectedTutor}
                        onProfile={setProfileTutor}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl mb-3">🔍</div>
                <p className="font-semibold text-slate-700">No tutors found</p>
                <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search a different subject.</p>
                <button onClick={handleReset} className="mt-4 rounded-xl bg-[#056852] px-5 py-2 text-sm font-semibold text-white hover:bg-[#045241] transition">
                  Reset Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && sorted.length > ITEMS_PER_PAGE && (
              <div className="mt-6">
                <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Booking modal */}
      {selectedTutor && <BookingModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} />}

      {/* Profile quick-view */}
      {profileTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#056852]">Tutor Profile</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{profileTutor.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{profileTutor.headline || profileTutor.subject}</p>
              </div>
              <button onClick={() => setProfileTutor(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {profileTutor.location && (
                <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} />{profileTutor.location}</div>
              )}
              <div className="flex items-center gap-2 text-slate-600"><Star size={14} className="text-amber-500" />Rating: {profileTutor.rating || '4.8'} / 5.0</div>
              <div className="flex items-center gap-2 text-slate-600"><Clock size={14} />Experience: {profileTutor.experience || '5+ years'}</div>
              <div className="flex items-center gap-2 text-slate-600"><BookOpen size={14} />Subjects: {profileTutor.subjects ? profileTutor.subjects.join(', ') : profileTutor.subject}</div>
              <div className="flex items-center gap-2 font-semibold text-slate-800">Price: ₹{profileTutor.price || profileTutor.rate || 500}/hr</div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setSelectedTutor(profileTutor); setProfileTutor(null); }} className="flex-1 rounded-xl bg-[#056852] py-2.5 text-sm font-semibold text-white hover:bg-[#045241] transition">
                Book Demo
              </button>
              <button onClick={() => setProfileTutor(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#056852] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading tutors…</p>
        </div>
      </div>
    }>
      <TutorsPageContent />
    </Suspense>
  );
}
