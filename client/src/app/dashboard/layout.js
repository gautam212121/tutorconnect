"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, LayoutDashboard, Calendar, UserCheck, LogOut, Home,
  GraduationCap, MessageSquare, MessageCircle, Bell, Settings, Star, Video,
  User, CreditCard, FileText, Folder, BarChart2, Menu, X,
  Search, Gift, HelpCircle, TrendingUp, ArrowRight, ChevronRight,
} from 'lucide-react';
import { usePoll } from '../lib/api';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith('/dashboard/admin');

  // Poll notifications for badge count
  const { data: notifs } = usePoll(!isAdminRoute ? '/api/v1/notifications' : null, 30000, []);
  const unreadCount = Array.isArray(notifs) ? notifs.filter((n) => !n.read).length : 0;

  // Poll messages for badge count
  const { data: conversations } = usePoll(user && !isAdminRoute ? `/api/v1/messages/inbox/${user.id}` : null, 30000, []);
  const unreadMessagesCount = Array.isArray(conversations) ? conversations.reduce((acc, conv) => acc + (conv.unread || 0), 0) : 0;

  useEffect(() => {
    if (isAdminRoute) return;
    const storedUser = localStorage.getItem('verifiedtutor-user');
    if (!storedUser) { router.replace('/login'); return; }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      router.replace(`/dashboard/${parsedUser.role || 'student'}`);
    }
  }, [pathname, isAdminRoute, router]);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('verifiedtutor-token');
    localStorage.removeItem('verifiedtutor-user');
    window.dispatchEvent(new Event('auth-change'));
    router.replace('/login');
  };

  if (isAdminRoute) return <>{children}</>;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#056852] border-t-transparent" style={{ borderWidth: 3 }} />
          <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const role = user.role || 'student';

  // ── Nav definitions ────────────────────────────────────────────────────────
  // Each item gets a unique key so active state works correctly.
  // Items without a real sub-page use section= query to distinguish.
  const roleNavs = {
    student: [
      { key: 'dashboard', name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard, exact: true },
      { key: 'bookings', name: 'My Bookings', href: '/dashboard/student?section=bookings', icon: Calendar },
      { key: 'schedule', name: 'My Schedule', href: '/dashboard/student?section=schedule', icon: Calendar },
      { key: 'subjects', name: 'Subjects', href: '/dashboard/student?section=subjects', icon: BookOpen },
      { key: 'find-tutors', name: 'Find Tutors', href: '/tutors', icon: User },
      { key: 'messages', name: 'Messages', href: '/dashboard/student?section=messages', icon: MessageSquare, badge: unreadMessagesCount },
      { key: 'assignments', name: 'Assignments', href: '/dashboard/student?section=assignments', icon: FileText },
      { key: 'payments', name: 'Payments', href: '/dashboard/student?section=payments', icon: CreditCard },
      { key: 'progress', name: 'My Progress', href: '/dashboard/student?section=progress', icon: TrendingUp },
      { key: 'reviews', name: 'Reviews', href: '/dashboard/student?section=reviews', icon: Star },
      { key: 'notifications', name: 'Notifications', href: '/dashboard/student?section=notifications', icon: Bell, badge: unreadCount },
      { key: 'settings', name: 'Settings', href: '/dashboard/student?section=settings', icon: Settings },
      { key: 'support', name: 'Support', href: '/dashboard/student?section=support', icon: HelpCircle },
    ],
    tutor: [
      { key: 'dashboard', name: 'Overview', href: '/dashboard/tutor', icon: LayoutDashboard, exact: true },
      { key: 'students', name: 'Students', href: '/dashboard/tutor/students', icon: GraduationCap },
      { key: 'courses', name: 'Courses', href: '/dashboard/tutor/courses', icon: BookOpen },
      { key: 'schedule', name: 'Schedule', href: '/dashboard/tutor?section=schedule', icon: Calendar },
      { key: 'live', name: 'Live Classes', href: '/dashboard/tutor/live-classes', icon: Video },
      { key: 'material', name: 'Study Material', href: '/dashboard/tutor/study-material', icon: FileText },
      { key: 'assignments', name: 'Assignments', href: '/dashboard/tutor/assignments', icon: Folder },
      { key: 'messages', name: 'Messages', href: '/dashboard/tutor/messages', icon: MessageSquare, badge: unreadMessagesCount },
      { key: 'reviews', name: 'Reviews', href: '/dashboard/tutor/reviews', icon: Star },
      { key: 'earnings', name: 'Earnings', href: '/dashboard/tutor/earnings', icon: CreditCard },
      { key: 'analytics', name: 'Analytics', href: '/dashboard/tutor?section=analytics', icon: BarChart2 },
      { key: 'notifications', name: 'Notifications', href: '/dashboard/tutor/notifications', icon: Bell, badge: unreadCount },
      { key: 'profile', name: 'Profile', href: '/dashboard/tutor/profile', icon: User },
      { key: 'settings', name: 'Settings', href: '/dashboard/tutor/settings', icon: Settings },
    ],
  };

  const navigation = roleNavs[role] || roleNavs.student;

  // ── Active state: Only the exact matching href is active ──────────────────
  const isActive = (item) => {
    if (item.exact) return pathname === item.href.split('?')[0];
    const [itemPath, itemQuery] = item.href.split('?');
    const [currentPath, currentQuery] = (pathname + (typeof window !== 'undefined' ? window.location.search : '')).split('?');
    if (itemPath !== currentPath) return false;
    if (!itemQuery) return !currentQuery;
    return currentQuery === itemQuery;
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-100 shadow-sm transition-transform duration-300 md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-2">
            <img src="/verified-tutor-logo.png" alt="Verified Tutors" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* User Info */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#056852] to-teal-400 text-white font-bold text-sm shadow">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#056852]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#056852]">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-150 ${active
                    ? 'bg-[#056852] text-white shadow-md shadow-[#056852]/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                />
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge ? (
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <button
            onClick={handleLogout}
            className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150"
          >
            <LogOut size={16} className="shrink-0 text-slate-400 group-hover:text-slate-600" />
            <span className="flex-1 truncate text-left">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <img src="/verified-tutor-logo-icon.png" alt="Verified Tutors" className="h-7 w-auto object-contain" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="relative">
              <Bell size={18} className="text-slate-500" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            </div>
          )}
          <button
            onClick={() => setMobileNavOpen((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main className="min-h-screen md:pl-64 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────────────── */}
      {!isAdminRoute && user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-t border-slate-200 px-4 py-2 pb-safe md:hidden shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          {[
            { key: 'dashboard', name: 'Home', href: `/dashboard/${role}`, icon: Home },
            { key: 'bookings', name: 'Bookings', href: role === 'student' ? '/dashboard/student?section=bookings' : '/dashboard/tutor?section=schedule', icon: Calendar },
            { key: 'messages', name: 'Messages', href: role === 'student' ? '/dashboard/student?section=messages' : '/dashboard/tutor/messages', icon: MessageCircle, badge: unreadMessagesCount },
            { key: 'notifications', name: 'Notifications', href: role === 'student' ? '/dashboard/student?section=notifications' : '/dashboard/tutor/notifications', icon: Bell, badge: unreadCount },
            { key: 'profile', name: 'Profile', href: role === 'student' ? '/dashboard/student?section=settings' : '/dashboard/tutor/profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive({ ...item, exact: item.key === 'dashboard' });
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 w-16 transition-colors ${
                  active ? 'text-[#056852]' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={active && item.key === 'dashboard' ? 'fill-[#056852]' : ''}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
