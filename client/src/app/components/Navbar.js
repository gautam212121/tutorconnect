"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronDown, Globe, Search, User, LogOut, LayoutDashboard, Video, Home, Menu, X } from 'lucide-react';
import RegisterModal from './RegisterModal';

export default function Navbar({ onOpenHowItWorks }) {
  const [findTutorsOpen, setFindTutorsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('EN');
  const [user, setUser] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true') {
        setIsRegisterOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const findTutorsRef = useRef(null);
  const subjectsRef = useRef(null);
  const langRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);

  // Sync auth status
  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('verifiedtutor-user');
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

  // Recurring timer to show register modal until user logs in
  useEffect(() => {
    if (user) return;

    // Show initial timer popup after 12s, then repeat every 25s if user remains logged out
    const timeout = setTimeout(() => {
      const storedToken = localStorage.getItem('verifiedtutor-token');
      if (!storedToken) {
        setIsRegisterOpen(true);
      }
    }, 12000);

    const interval = setInterval(() => {
      const storedToken = localStorage.getItem('verifiedtutor-token');
      if (!storedToken) {
        setIsRegisterOpen(true);
      }
    }, 25000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [user]);

  // Close dropdowns and mobile menu when clicking outside
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
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('verifiedtutor-token');
    localStorage.removeItem('verifiedtutor-user');
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
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/verified-tutor-logo.png" alt="Verified Tutor" className="h-9 w-auto object-contain transition group-hover:scale-105" />
        </Link>

        {/* Center Navigation Links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/about" className="py-1 text-slate-700 transition hover:text-[#056852]">
            About
          </Link>

          <Link href="/blog" className="py-1 text-slate-700 transition hover:text-[#056852]">
            Blog
          </Link>

          <Link href="/how-it-works" className="py-1 text-slate-700 transition hover:text-[#056852]">
            How it works
          </Link>

          <Link href="/careers" className="py-1 text-slate-700 transition hover:text-[#056852]">
            Job Careers
          </Link>

          <Link href="/why-us" className="py-1 text-slate-700 transition hover:text-[#056852]">
            Why us
          </Link>
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-700 transition shadow-sm hover:border-slate-400 hover:bg-slate-50 md:h-auto md:w-auto md:px-4 md:py-1.5"
                title="Login"
              >
                <User size={16} className="md:hidden" />
                <span className="hidden md:inline">Login</span>
              </Link>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="rounded-full bg-[#056852] px-3 py-1.5 text-[11px] font-bold text-white transition shadow-sm hover:bg-[#045241] md:px-4 md:text-xs"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            ref={mobileMenuBtnRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 focus:outline-none md:hidden"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute left-4 right-4 top-[72px] z-50 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl md:hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex flex-col gap-4">
            <Link href="/about" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/blog" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            <Link href="/how-it-works" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
            <Link href="/careers" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Job Careers</Link>
            <Link href="/why-us" className="text-sm font-medium text-slate-700 hover:text-[#056852]" onClick={() => setMobileMenuOpen(false)}>Why us</Link>
          </div>
        </div>
      )}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </nav>
  );
}
