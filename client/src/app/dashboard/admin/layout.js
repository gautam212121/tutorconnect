"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, LayoutDashboard, Users, GraduationCap, BookOpen as CourseIcon,
  Calendar, CreditCard, Star, Bell, FileText, Settings,
  ChevronDown, Menu, Search, LogOut, ExternalLink, X, Briefcase, Mail,
} from 'lucide-react';


const NAV = [
  { id: 'dashboard',     label: 'Dashboard',     href: '/dashboard/admin',              icon: LayoutDashboard },
  { id: 'tutors',        label: 'Tutors',         href: '/dashboard/admin/tutors',       icon: Users },
  { id: 'careers',       label: 'Careers',        href: '/dashboard/admin/careers',      icon: Briefcase },
  { id: 'students',      label: 'Students',       href: '/dashboard/admin/students',     icon: GraduationCap },
  { id: 'courses',       label: 'Courses',        href: '/dashboard/admin/courses',      icon: CourseIcon },
  { id: 'bookings',      label: 'Bookings',       href: '/dashboard/admin/bookings',     icon: Calendar },
  { id: 'payments',      label: 'Payments',       href: '/dashboard/admin/payments',     icon: CreditCard },
  { id: 'reviews',       label: 'Reviews',        href: '/dashboard/admin/reviews',      icon: Star },
  { id: 'newsletter',    label: 'Newsletter',     href: '/dashboard/admin/newsletter',   icon: Mail },
  { id: 'blogs',         label: 'Blogs',          href: '/dashboard/admin/blogs',        icon: FileText },
  { id: 'notifications', label: 'Notifications',  href: '/dashboard/admin/notifications',icon: Bell, badge: 12 },
  { id: 'reports',       label: 'Reports',        href: '/dashboard/admin/reports',      icon: FileText },
  { id: 'settings',      label: 'Settings',       href: '/dashboard/admin/settings',     icon: Settings },
];


export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('tutorconnect-user');
    if (!stored) { router.replace('/login'); return; }
    const u = JSON.parse(stored);
    if (u.role !== 'admin') { router.replace(`/dashboard/${u.role}`); return; }
    setUser(u);
    setLoading(false);

    // Auto-expand relevant sections
    const auto = {};
    NAV.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href.split('?')[0]))) {
        auto[item.id] = true;
      }
    });
    setExpanded(auto);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('tutorconnect-token');
    localStorage.removeItem('tutorconnect-user');
    window.dispatchEvent(new Event('auth-change'));
    router.replace('/login');
  };

  const isActive = (href) => {
    const base = href.split('?')[0];
    if (base === '/dashboard/admin') return pathname === base;
    return pathname.startsWith(base);
  };
  const isParentActive = (item) => item.children?.some(c => isActive(c.href));

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#056852] border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Loading admin panel...</p>
      </div>
    </div>
  );

  const sidebarW = collapsed ? 72 : 260;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        style={{ width: sidebarW }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo Row */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#056852] border border-[#b2e8d8]">
                <BookOpen size={17} />
              </div>
              <span className="font-extrabold text-slate-900 text-[15px]">Tutor<span className="text-[#056852]">Connect</span></span>
            </Link>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#056852] border border-[#b2e8d8]">
              <BookOpen size={17} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition shrink-0"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Admin User Badge */}
        {!collapsed && user && (
          <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#056852] text-white font-bold text-xs">
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                  <span className="bg-[#056852] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">ADMIN</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = item.href ? isActive(item.href) : false;
            const parentActive = isParentActive(item);
            const isExp = expanded[item.id];

            return (
              <div key={item.id}>
                {item.href && !item.children ? (
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all ${
                      active ? 'bg-[#056852] text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={17} className={`shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-all ${
                        parentActive ? 'bg-[#e6f7f2] text-[#056852]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={17} className={`shrink-0 ${parentActive ? 'text-[#056852]' : 'text-slate-500'}`} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isExp ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                    {!collapsed && isExp && (
                      <div className="ml-8 mt-0.5 space-y-0.5">
                        {item.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-medium transition ${
                              isActive(child.href)
                                ? 'bg-[#056852]/10 text-[#056852] font-semibold'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive(child.href) ? 'bg-[#056852]' : 'bg-slate-300'}`} />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* View Website */}
        {!collapsed && (
          <div className="shrink-0 border-t border-slate-100 px-3 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <ExternalLink size={13} />
              View Website
            </Link>
          </div>
        )}
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div
        style={{ marginLeft: sidebarW }}
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm z-20">
          {/* Left */}
          <div className="flex flex-1 items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:flex max-w-xs w-full items-center">
              <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs placeholder-slate-400 focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition">
              <Bell size={19} />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">4</span>
            </button>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#056852] text-white font-bold text-xs shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-700">{user?.name || 'Admin'}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2 mb-1">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
