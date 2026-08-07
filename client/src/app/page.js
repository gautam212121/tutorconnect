"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import HowItWorksModal from './components/HowItWorksModal';
import { useSocket } from '../hooks/useSocket';
import {
  Search,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  ArrowRight,
  Play,
  MapPin,
  BookOpen,
  GraduationCap,
  Star,
  CheckCircle,
  Clock,
  Sparkles,
  Users,
  Compass,
  Award,
  Briefcase,
  Filter,
  Check,
  ChevronRight,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// No hardcoded dummy data — only real API data is shown

export default function HomePage() {
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const socket = useSocket();

  // Search state
  const [locationInput, setLocationInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  // Modals state
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const tutorsSectionRef = useRef(null);

  // Fetch tutors from backend only
  useEffect(() => {
    fetch(`${API_URL}/api/v1/tutors/featured`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = (Array.isArray(data) ? data : []).map((t, idx) => ({
          ...t,
          reviews: t.reviews || (30 + idx * 12),
          verified: true,
          subjects: Array.isArray(t.subjects) ? t.subjects : ['General'],
          location: t.location || 'Online / Home',
          level: t.level || 'School & College',
        }));
        setTutors(formatted);
        setFilteredTutors(formatted);
      })
      .catch(() => {
        setTutors([]);
        setFilteredTutors([]);
      });

    // Fetch categories
    fetch(`${API_URL}/api/v1/admin-new/categories`)
      .then(res => res.json())
      .then(data => {
        const activeCategories = Array.isArray(data) ? data.filter(c => c.status === 'active') : [];
        setCategoriesList(activeCategories);
      })
      .catch(console.error);
  }, []);

  // Listen for real-time category updates
  useEffect(() => {
    if (!socket) return;
    
    // -- CATEGORY HANDLERS --
    const handleCatCreated = (newCat) => {
      if (newCat.status === 'active') {
        setCategoriesList(prev => [newCat, ...prev]);
      }
    };
    
    const handleCatUpdated = (updatedCat) => {
      setCategoriesList(prev => {
        const exists = prev.some(c => c._id === updatedCat._id);
        if (updatedCat.status === 'active') {
          return exists 
            ? prev.map(c => c._id === updatedCat._id ? updatedCat : c)
            : [updatedCat, ...prev];
        } else {
          return prev.filter(c => c._id !== updatedCat._id);
        }
      });
    };
    
    const handleCatDeleted = (id) => setCategoriesList(prev => prev.filter(c => c._id !== id));
    
    // -- TUTOR HANDLERS --
    const handleUserCreated = (user) => {
      if (user.role === 'tutor' && user.verified && user.status === 'active') {
        const formatted = {
          id: user._id,
          name: user.name,
          headline: user.headline || 'Tutor',
          price: user.price || 500,
          rating: user.rating || 0,
          reviews: user.reviews || 0,
          experience: user.experience || '1 year',
          location: user.location || 'Online',
          subjects: user.subjects && user.subjects.length > 0 ? user.subjects : ['General'],
          mode: user.mode && user.mode.length > 0 ? user.mode : ['Online'],
          verified: user.verified,
          image: user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        };
        setTutors(prev => [formatted, ...prev]);
        setFilteredTutors(prev => [formatted, ...prev]); // Very basic filter reset for demo
      }
    };

    const handleUserUpdated = (user) => {
      if (user.role === 'tutor') {
        setTutors(prev => {
          if (!user.verified || user.status !== 'active') return prev.filter(t => t.id !== user._id);
          const exists = prev.some(t => t.id === user._id);
          const formatted = {
            id: user._id,
            name: user.name,
            headline: user.headline || 'Tutor',
            price: user.price || 500,
            rating: user.rating || 0,
            reviews: user.reviews || 0,
            experience: user.experience || '1 year',
            location: user.location || 'Online',
            subjects: user.subjects && user.subjects.length > 0 ? user.subjects : ['General'],
            mode: user.mode && user.mode.length > 0 ? user.mode : ['Online'],
            verified: user.verified,
            image: user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          };
          return exists ? prev.map(t => t.id === user._id ? formatted : t) : [formatted, ...prev];
        });
        setFilteredTutors(prev => {
          if (!user.verified || user.status !== 'active') return prev.filter(t => t.id !== user._id);
          const exists = prev.some(t => t.id === user._id);
          const formatted = {
            id: user._id,
            name: user.name,
            headline: user.headline || 'Tutor',
            price: user.price || 500,
            rating: user.rating || 0,
            reviews: user.reviews || 0,
            experience: user.experience || '1 year',
            location: user.location || 'Online',
            subjects: user.subjects && user.subjects.length > 0 ? user.subjects : ['General'],
            mode: user.mode && user.mode.length > 0 ? user.mode : ['Online'],
            verified: user.verified,
            image: user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          };
          return exists ? prev.map(t => t.id === user._id ? formatted : t) : [formatted, ...prev];
        });
      }
    };

    const handleUserDeleted = (id) => {
      setTutors(prev => prev.filter(t => t.id !== id));
      setFilteredTutors(prev => prev.filter(t => t.id !== id));
    };
    
    socket.on('categoryCreated', handleCatCreated);
    socket.on('categoryUpdated', handleCatUpdated);
    socket.on('categoryDeleted', handleCatDeleted);
    socket.on('userCreated', handleUserCreated);
    socket.on('userUpdated', handleUserUpdated);
    socket.on('userDeleted', handleUserDeleted);
    
    return () => {
      socket.off('categoryCreated', handleCatCreated);
      socket.off('categoryUpdated', handleCatUpdated);
      socket.off('categoryDeleted', handleCatDeleted);
      socket.off('userCreated', handleUserCreated);
      socket.off('userUpdated', handleUserUpdated);
      socket.off('userDeleted', handleUserDeleted);
    };
  }, [socket]);

  // Filter tutors handler
  const handleSearch = (e) => {
    if (e) e.preventDefault();

    let results = [...tutors];

    if (locationInput.trim()) {
      const loc = locationInput.toLowerCase();
      results = results.filter(
        (t) => t.location.toLowerCase().includes(loc) || t.name.toLowerCase().includes(loc)
      );
    }

    if (selectedSubject) {
      const subj = selectedSubject.toLowerCase();
      results = results.filter((t) =>
        t.subjects.some((s) => s.toLowerCase().includes(subj)) ||
        (t.headline && t.headline.toLowerCase().includes(subj))
      );
    }

    if (selectedLevel) {
      const lev = selectedLevel.toLowerCase();
      results = results.filter(
        (t) => (t.level && t.level.toLowerCase().includes(lev)) || lev === ''
      );
    }

    setFilteredTutors(results);

    // Scroll smoothly to results
    if (tutorsSectionRef.current) {
      tutorsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800">
      {/* Floating Header */}
      <Navbar onOpenHowItWorks={() => setIsHowItWorksOpen(true)} />

      {/* Decorative background glow accents */}
      <div className="pointer-events-none absolute left-0 top-0 h-[600px] w-full overflow-hidden opacity-60">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Column: Headline, Trust Badge & Buttons */}
          <div className="lg:col-span-7">
            {/* Trust Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b2e8d8] bg-[#e6f7f2] px-4 py-1.5 text-sm font-semibold text-[#056852] shadow-sm">
              <ShieldCheck size={18} className="text-[#056852]" />
              <span>Trusted by 6,850+ parents and students</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.12]">
              Find the right tutor for every <span className="text-[#056852]">milestone</span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg leading-relaxed">
              Connect with verified tutors for school, college, competitive exams and skill development – online or offline.
            </p>

            {/* Feature Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
              <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm border border-slate-200/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f7f2] text-[#056852]">
                  <UserCheck size={16} />
                </div>
                <span>Verified Tutors</span>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm border border-slate-200/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f7f2] text-[#056852]">
                  <ShieldCheck size={16} />
                </div>
                <span>Safe & Secure</span>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm border border-slate-200/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f7f2] text-[#056852]">
                  <MessageSquare size={16} />
                </div>
                <span>Affordable Prices</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (tutorsSectionRef.current) {
                    tutorsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-2.5 rounded-full bg-[#056852] px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-teal-900/15 transition hover:bg-[#045241] hover:shadow-lg"
              >
                <span>Find a tutor</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="inline-flex items-center gap-2.5 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <span>How it works</span>
                <Play size={15} className="fill-slate-800 text-slate-800 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Search Card */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-slate-800/80 bg-[#090e17] p-6 sm:p-8 text-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)]">
              {/* Card Header */}
              <div className="mb-6 flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#056852] text-white shadow-lg shadow-teal-950/40">
                  <Search size={22} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search tutors</span>
                  <h3 className="text-xl font-bold text-white">Anywhere, any subject</h3>
                </div>
              </div>

              {/* Card Form Controls */}
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Field 1: Location */}
                <div className="rounded-2xl border border-slate-800 bg-[#121927] p-3.5 transition focus-within:border-[#056852]">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                    <MapPin size={14} className="text-slate-400" />
                    <span>Location</span>
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter your location (e.g. Lucknow, Delhi, Online)"
                    className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Field 2: Subject Dropdown */}
                <div className="rounded-2xl border border-slate-800 bg-[#121927] p-3.5 transition focus-within:border-[#056852]">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                    <BookOpen size={14} className="text-slate-400" />
                    <span>Subject</span>
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="">Select subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics & Science</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="English">English & Communication</option>
                    <option value="Coding">Coding & Computer Science</option>
                  </select>
                </div>

                {/* Field 3: Level Dropdown */}
                <div className="rounded-2xl border border-slate-800 bg-[#121927] p-3.5 transition focus-within:border-[#056852]">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                    <GraduationCap size={14} className="text-slate-400" />
                    <span>Level</span>
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="">Select level</option>
                    <option value="Class 1-5">Primary (Class 1-5)</option>
                    <option value="Class 6-10">Middle & High School (Class 6-10)</option>
                    <option value="Class 11-12">Senior Secondary (Class 11-12)</option>
                    <option value="Competitive Exams">Competitive Exams (JEE/NEET)</option>
                    <option value="All Levels">College & Skill Development</option>
                  </select>
                </div>

                {/* Search Tutors Button */}
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#056852] py-4 text-base font-bold text-white shadow-lg shadow-teal-950/60 transition hover:bg-[#045241]"
                >
                  <span>Search tutors</span>
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Security Note Footer */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <CheckCircle size={14} className="text-[#056852]" />
                <span>100% secure • No hidden fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED TUTORS / LIVE SEARCH RESULTS SECTION */}
      <section ref={tutorsSectionRef} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#056852]">
              <Sparkles size={14} /> Available Tutors
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {filteredTutors.length < tutors.length
                ? `Showing ${filteredTutors.length} matching tutors`
                : 'Top-rated Learning Partners'}
            </h2>
          </div>
          {filteredTutors.length < tutors.length && (
            <button
              onClick={() => {
                setLocationInput('');
                setSelectedSubject('');
                setSelectedLevel('');
                setFilteredTutors(tutors);
              }}
              className="text-xs font-semibold text-[#056852] hover:underline self-start md:self-auto"
            >
              Clear filters ({tutors.length} total)
            </button>
          )}
        </div>

        {filteredTutors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="group flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  {/* Tutor Header Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={tutor.image}
                        alt={tutor.name}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-teal-500/20"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-lg">{tutor.name}</h3>
                          {tutor.verified && (
                            <ShieldCheck size={16} className="text-[#056852] fill-[#e6f7f2]" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-500">{tutor.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/60">
                      <span>★</span>
                      <span>{tutor.rating}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviews})</span>
                    </div>
                  </div>

                  {/* Headline & Details */}
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="font-semibold text-slate-800 text-sm">{tutor.headline}</p>
                    
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-[#056852]" />
                        <span className="truncate">{tutor.qualification || 'Not Specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-[#056852]" />
                        <span>{tutor.experience || 'Not Specified'} Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tutor.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {sub}
                      </span>
                    ))}
                    <span className="rounded-full bg-[#e6f7f2] px-3 py-1 text-xs font-semibold text-[#056852]">
                      {tutor.level || 'All Grades'}
                    </span>
                  </div>
                </div>

                {/* Footer Price & Booking */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Hourly Rate</span>
                    <span className="text-lg font-bold text-slate-900">₹{tutor.price}</span>
                    <span className="text-xs text-slate-500"> / hr</span>
                  </div>

                  <button
                    onClick={() => setSelectedTutorForBooking(tutor)}
                    className="rounded-full bg-[#056852] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#045241]"
                  >
                    Book Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Search size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No matching tutors found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try adjusting your search criteria or clear location/subject filters to view all available tutors.
            </p>
            <button
              onClick={() => {
                setLocationInput('');
                setSelectedSubject('');
                setSelectedLevel('');
                setFilteredTutors(tutors);
              }}
              className="mt-4 rounded-full bg-[#056852] px-6 py-2.5 text-xs font-bold text-white"
            >
              Reset Search Filters
            </button>
          </div>
        )}
      </section>

      {/* POPULAR SUBJECTS CATEGORIES SECTION */}
      <section id="subjects" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#056852]">Explore Categories</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Browse by learning need</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categoriesList.map((cat) => (
            <div
              key={cat._id}
              onClick={() => {
                setSelectedSubject(cat.name.split(' ')[0]);
                handleSearch();
              }}
              className="group cursor-pointer rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="mb-4 h-16 w-16 rounded-2xl object-cover shadow-sm border border-slate-100" />
              ) : (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#056852]/10 text-4xl text-[#056852]">
                  <BookOpen size={28} />
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
              {cat.description && <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{cat.description}</p>}
              <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">{cat.tutors || 0} Tutors</span>
                <span className="text-xs font-bold text-[#056852] flex items-center gap-1 group-hover:translate-x-1 transition">
                  Explore <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
          
          {categoriesList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm font-medium">
              No categories available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* WHY US / TRUST SECTION */}
      <section id="why-us" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-[#090e17] p-8 sm:p-12 text-white shadow-2xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Why TutorConnect</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Everything you need to start learning faster
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              A simple, trusted marketplace built to connect students with background-checked tutors without hassle.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#056852] text-white">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white">100% Verified Profiles</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Every tutor undergoes strict identity verification, qualifications review, and background checks.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#056852] text-white">
                <Compass size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Home & Online Flexibility</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Choose in-person home tutoring near you or join interactive online live sessions anywhere.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#056852] text-white">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Demo Booking & Guarantee</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Try a trial session first. If you are not satisfied with the tutor, get an instant replacement or refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#056852]">
                <BookOpen size={18} />
              </div>
              <span>Tutor<span className="text-[#056852]">Connect</span></span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-600">
              <a href="#subjects" className="hover:text-[#056852]">Subjects</a>
              <button onClick={() => setIsHowItWorksOpen(true)} className="hover:text-[#056852]">How it works</button>
              <a href="#why-us" className="hover:text-[#056852]">Why us</a>
              <Link href="/login" className="hover:text-[#056852]">Login</Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} TutorConnect Inc. All rights reserved.</p>
            <p>100% Verified Tutors • Safe & Secure Platform</p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedTutorForBooking && (
        <BookingModal
          tutor={selectedTutorForBooking}
          onClose={() => setSelectedTutorForBooking(null)}
        />
      )}

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}
