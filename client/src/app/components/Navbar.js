"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronDown, Globe, Search, User, LogOut, LayoutDashboard, Video, Home, Menu } from 'lucide-react';

export default function Navbar({ onOpenHowItWorks }) {
  const [findTutorsOpen, setFindTutorsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('EN');
  const [user, setUser] = useState(null);
  const router = useRouter();

  const findTutorsRef = useRef(null);
  const subjectsRef = useRef(null);
  const langRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sync auth status
  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('tutorconnect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (findTutorsRef.current && !findTutorsRef.current.contains(event.target)) {
        setFindTutorsOpen(false);
      }
      if (subjectsRef.current && !subjectsRef.current.contains(event.target)) {
        setSubjectsOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tutorconnect-token');
    localStorage.removeItem('tutorconnect-user');
    setUser(null);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'HI', name: 'Hindi (हिंदी)' },
    { code: 'ES', name: 'Spanish (Español)' },
  ];

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/95 px-5 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#056852] border border-[#b2e8d8] transition group-hover:scale-105">
            <BookOpen size={20} strokeWidth={2.2} />
          </div>
          <span className="font-extrabold text-slate-900">
            Tutor<span className="text-[#056852]">Connect</span>
          </span>
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {/* Find Tutors Dropdown */}
          <div className="relative" ref={findTutorsRef}>
            <button
              onClick={() => {
                setFindTutorsOpen(!findTutorsOpen);
                setSubjectsOpen(false);
                setLangOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 py-1 text-slate-700 transition hover:text-[#056852] focus:outline-none"
            >
              <span>Find Tutors</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${findTutorsOpen ? 'rotate-180 text-[#056852]' : 'text-slate-400'}`} />
            </button>

            {findTutorsOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/tutors"
                  onClick={() => setFindTutorsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <Search size={16} className="text-[#056852]" />
                  <div>
                    <div className="font-semibold">Browse All Tutors</div>
                    <div className="text-xs text-slate-400">1,280+ verified experts</div>
                  </div>
                </Link>
                <Link
                  href="/tutors?mode=online"
                  onClick={() => setFindTutorsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <Video size={16} className="text-[#056852]" />
                  <div>
                    <div className="font-semibold">Online Classes</div>
                    <div className="text-xs text-slate-400">Interactive live 1-on-1</div>
                  </div>
                </Link>
                <Link
                  href="/tutors?mode=home"
                  onClick={() => setFindTutorsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <Home size={16} className="text-[#056852]" />
                  <div>
                    <div className="font-semibold">Home Tutors</div>
                    <div className="text-xs text-slate-400">Personalized in-person</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Subjects Dropdown */}
          <div className="relative" ref={subjectsRef}>
            <button
              onClick={() => {
                setSubjectsOpen(!subjectsOpen);
                setFindTutorsOpen(false);
                setLangOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 py-1 text-slate-700 transition hover:text-[#056852] focus:outline-none"
            >
              <span>Subjects</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${subjectsOpen ? 'rotate-180 text-[#056852]' : 'text-slate-400'}`} />
            </button>

            {subjectsOpen && (
              <div className="absolute left-0 mt-3 w-60 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/tutors?subject=math"
                  onClick={() => setSubjectsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <span>Mathematics</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">180</span>
                </Link>
                <Link
                  href="/tutors?subject=physics"
                  onClick={() => setSubjectsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <span>Physics & Science</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">142</span>
                </Link>
                <Link
                  href="/tutors?subject=english"
                  onClick={() => setSubjectsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <span>English & Communication</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">126</span>
                </Link>
                <Link
                  href="/tutors?subject=coding"
                  onClick={() => setSubjectsOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                >
                  <span>Coding & Tech</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">98</span>
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenHowItWorks && onOpenHowItWorks()}
            className="py-1 text-slate-700 transition hover:text-[#056852] focus:outline-none"
          >
            How it works
          </button>

          <Link href="/careers" className="py-1 text-slate-700 transition hover:text-[#056852]">
            Job Careers
          </Link>

          <a href="#why-us" className="py-1 text-slate-700 transition hover:text-[#056852]">
            Why us
          </a>
        </div>

        {/* Right Section (EN Selector & User State / Login Button) */}
        <div className="flex items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative hidden md:block" ref={langRef}>
            <button
              onClick={() => {
                setLangOpen(!langOpen);
                setFindTutorsOpen(false);
                setSubjectsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition focus:outline-none"
            >
              <Globe size={16} className="text-slate-500" />
              <span>{selectedLang}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      selectedLang === lang.code ? 'bg-[#e6f7f2] text-[#056852]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {selectedLang === lang.code && <span className="text-[#056852]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logged in User Menu OR Auth Buttons */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setFindTutorsOpen(false);
                  setSubjectsOpen(false);
                  setLangOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-teal-600/30 bg-[#e6f7f2] p-1 md:pl-2 md:pr-3 md:py-1.5 text-xs font-bold text-[#056852] hover:bg-[#d8f3eb] transition focus:outline-none shadow-sm"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#056852] text-white text-[11px]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline-block max-w-[100px] truncate">{user.name}</span>
                <span className="hidden md:inline-block rounded-full bg-[#056852]/10 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                  {user.role}
                </span>
                <ChevronDown size={14} className="hidden md:block text-[#056852]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    href={`/dashboard/${user.role || 'student'}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#e6f7f2] hover:text-[#056852] transition"
                  >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex h-8 w-8 md:h-auto md:w-auto items-center justify-center rounded-full border border-slate-300 md:px-4 md:py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition shadow-sm"
                title="Login"
              >
                <User size={16} className="md:hidden" />
                <span className="hidden md:inline">Login</span>
              </Link>
              {/* Register button removed per request */}
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 focus:outline-none md:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-4 right-4 top-[72px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-4">
            <Link href="/tutors" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Find Tutors</Link>
            <Link href="/tutors?subject=math" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Subjects</Link>
            <button onClick={() => { onOpenHowItWorks && onOpenHowItWorks(); setMobileMenuOpen(false); }} className="text-left text-sm font-medium text-slate-700 hover:text-[#056852]">How it works</button>
            <Link href="/careers" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Job Careers</Link>
            <a href="#why-us" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Why us</a>
          </div>
        </div>
      )}
    </nav>
  );
}
