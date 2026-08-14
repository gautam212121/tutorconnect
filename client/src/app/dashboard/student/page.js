"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ScheduleView from './components/ScheduleView';
import {
  Search, MapPin, BookOpen, GraduationCap, Star, Calendar, ArrowRight,
  CreditCard, MessageSquare, Shield, BadgeCheck, ChevronRight, Heart,
  Clock, Users, FileText, HelpCircle, Settings, Bell, User, Headphones,
  Gift, LogOut, Menu, X, CheckCircle, SearchIcon, Video
} from 'lucide-react';
import { fetchApi, usePoll } from '../../lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('verifiedtutor-user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const { data: dashboard, loading } = usePoll('/api/v1/student/dashboard', 10000, null);

  if (loading && !dashboard) {
    return (
      <div className="p-6 space-y-6 animate-pulse max-w-[1400px] mx-auto">
        <div className="h-16 bg-slate-200 rounded-2xl w-full" />
        <div className="h-48 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-4 gap-4"><div className="h-24 bg-slate-200 rounded-2xl col-span-1" /></div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const paymentSummary = dashboard?.paymentSummary || { paid: 0, pending: 0, refunded: 0 };
  const upcomingSessions = dashboard?.upcomingSessions || [];
  const recentBookings = dashboard?.recentBookings || [];
  const recentMessages = dashboard?.recentMessages || [];
  const subjectsProgress = dashboard?.subjectsProgress || [];
  const recommendedTutors = dashboard?.recommendedTutors || [];
  const progressChart = dashboard?.progressChart || { labels: [], data: [] };

  if (section === 'schedule') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <ScheduleView user={user} assignedTutors={dashboard?.assignedTutors || []} />
      </div>
    );
  }

  // Handle unimplemented sections
  const unimplementedSections = ['bookings', 'subjects', 'messages', 'assignments', 'payments', 'progress', 'reviews', 'notifications', 'settings', 'support'];
  if (unimplementedSections.includes(section)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto h-[calc(100vh-100px)] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
          <Settings size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{section}</h2>
        <p className="text-slate-500 max-w-sm text-center">
          This section is currently under development. Please check back later.
        </p>
        <Link href="/dashboard/student" className="mt-6 px-6 py-2 bg-[#056852] text-white rounded-xl font-bold hover:bg-[#045241] transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // --- Helpers for Charts ---
  const totalPayment = paymentSummary.paid + paymentSummary.pending + paymentSummary.refunded || 1; // avoid / 0
  const paidPct = (paymentSummary.paid / totalPayment) * 100;
  const pendingPct = (paymentSummary.pending / totalPayment) * 100;

  // Donut chart SVG config
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const paidDash = (paidPct / 100) * circumference;
  const pendingDash = (pendingPct / 100) * circumference;

  // Line chart SVG config
  const chartHeight = 120;
  const chartWidth = 400;
  const maxData = Math.max(...(progressChart.data.length ? progressChart.data : [100]), 100);
  const points = progressChart.data.map((val, i) => {
    const x = (i / Math.max(progressChart.data.length - 1, 1)) * chartWidth;
    const y = chartHeight - (val / maxData) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      {/* ── Top Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between bg-white px-6 border-b border-slate-100 hidden md:flex">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search tutors, subjects, or courses..."
              className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#056852]/20 focus:outline-none transition"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="relative text-slate-500 hover:text-slate-700 transition">
            <Bell size={20} />
            {(dashboard?.unreadMessages > 0 || 4 > 0) && (
              <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[9px] font-bold text-white px-1">
                {dashboard?.unreadMessages || 4}
              </span>
            )}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#056852] flex items-center justify-center text-white font-bold shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-slate-800">{user?.name || 'Aarav Sharma'}</p>
              <p className="text-[11px] text-slate-500">Class {user?.grade || '10th (CBSE)'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* ── Top Hero & Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Welcome Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[160px]">
            {/* Decorative Background */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50" />

            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-full bg-[#056852] text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm shrink-0 overflow-hidden">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h1 className="text-[22px] font-extrabold text-slate-800 mb-1 leading-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Aarav'}! 👋
                </h1>
                <p className="text-xs text-slate-500 mb-3">Keep learning and achieve your goals.</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User size={13} className="text-slate-400" />
                    <span className="font-medium">Student ID</span>
                    <span className="font-bold text-slate-800 ml-1">STU{user?.id?.toString().slice(-4) || '1001'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <GraduationCap size={13} className="text-slate-400" />
                    <span className="font-medium">Class</span>
                    <span className="font-bold text-slate-800 ml-1">{user?.grade || '10th'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MessageSquare size={13} className="text-slate-400" />
                    <span className="font-medium">Email</span>
                    <span className="font-bold text-slate-800 ml-1 truncate max-w-[100px]">{user?.email || 'email@ex.com'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <SearchIcon size={13} className="text-slate-400" />
                    <span className="font-medium">Phone</span>
                    <span className="font-bold text-slate-800 ml-1">{user?.mobile || '+91 -'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-6 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">Student</div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                  <Calendar size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Upcoming Classes</p>
                <h3 className="text-2xl font-extrabold text-slate-800">{stats.upcomingSessions || 0}</h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">Next: Today, 05:00 PM</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                  <BookOpen size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Total Bookings</p>
                <h3 className="text-2xl font-extrabold text-slate-800">{stats.totalBookings || 0}</h3>
              </div>
              <Link href="/dashboard/student?section=bookings" className="text-[10px] text-slate-400 mt-3 hover:text-slate-600 transition">View all bookings</Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-3">
                  <CheckCircle size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Completed Classes</p>
                <h3 className="text-2xl font-extrabold text-slate-800">{stats.completedClasses || 0}</h3>
              </div>
              <p className="text-[10px] text-emerald-500 font-medium mt-3">Great going!</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-3">
                  <CreditCard size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Total Spent</p>
                <h3 className="text-2xl font-extrabold text-slate-800">₹{(stats.totalSpent || 0).toLocaleString()}</h3>
              </div>
              <Link href="/dashboard/student?section=payments" className="text-[10px] text-slate-400 mt-3 hover:text-slate-600 transition">View payment history</Link>
            </div>
          </div>
        </div>

        {/* ── Middle Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Upcoming Classes List */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">Upcoming Classes</h3>
              <Link href="/dashboard/student?section=schedule" className="text-[11px] font-bold text-[#056852] hover:underline">View Full Schedule</Link>
            </div>

            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No upcoming classes scheduled.</div>
              ) : (
                upcomingSessions.map((session, i) => {
                  const date = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0 overflow-hidden">
                          {session.tutor?.avatar ? <img src={session.tutor.avatar} alt="Tutor" className="w-full h-full object-cover" /> : session.tutor?.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{session.tutor?.name || 'Tutor'}</p>
                          <p className="text-[10px] text-slate-500">{session.subject || 'Subject'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[11px] font-semibold text-slate-700 flex items-center justify-end gap-1"><Calendar size={12} className="text-slate-400" /> {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1"><Clock size={12} className="text-slate-400" /> {isToday ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-slate-700">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-[10px] text-slate-500">- {new Date(date.getTime() + (session.duration || 60) * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 min-w-[80px]">
                          {i === 0 ? (
                            <>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100">Live Class</span>
                              <button className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#056852] px-2.5 py-1 rounded hover:bg-[#045242] transition">
                                <Video size={10} /> Join Now
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100">Upcoming</span>
                              <button className="text-[10px] font-bold text-[#056852] px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 transition w-full text-center">
                                View
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Subjects */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">My Subjects</h3>
              <Link href="/dashboard/student?section=subjects" className="text-[11px] font-bold text-[#056852] hover:underline">View All</Link>
            </div>
            <div className="space-y-5">
              {subjectsProgress.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No subjects active yet.</div>
              ) : (
                subjectsProgress.slice(0, 4).map((sub, i) => {
                  const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-blue-500'];
                  const bgColors = ['bg-emerald-50 text-emerald-600', 'bg-purple-50 text-purple-600', 'bg-amber-50 text-amber-600', 'bg-blue-50 text-blue-600'];
                  const color = colors[i % colors.length];
                  const bgColor = bgColors[i % bgColors.length];

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgColor}`}>
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-slate-800">{sub.name}</p>
                          <span className="text-[10px] font-bold text-slate-500">{sub.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${sub.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-2.5 flex-1 flex flex-col justify-between">
              <Link href="/tutors" className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#056852]/30 hover:bg-emerald-50/30 transition group bg-white">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#056852] group-hover:text-white transition">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Find Tutors</p>
                  <p className="text-[9px] text-slate-500">Browse verified tutors</p>
                </div>
              </Link>

              <Link href="/dashboard/student?section=schedule" className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#056852]/30 hover:bg-emerald-50/30 transition group bg-white">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#056852] group-hover:text-white transition">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Book a Class</p>
                  <p className="text-[9px] text-slate-500">Schedule your session</p>
                </div>
              </Link>

              <Link href="/dashboard/student?section=messages" className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#056852]/30 hover:bg-emerald-50/30 transition group bg-white">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#056852] group-hover:text-white transition">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Ask Doubts</p>
                  <p className="text-[9px] text-slate-500">Get help instantly</p>
                </div>
              </Link>

              <Link href="/dashboard/student?section=homework" className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[#056852]/30 hover:bg-emerald-50/30 transition group bg-white">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-[#056852] group-hover:text-white transition">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Study Materials</p>
                  <p className="text-[9px] text-slate-500">Access notes & resources</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Bottom Row 1 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Recent Messages */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">Recent Messages</h3>
              <Link href="/dashboard/student?section=messages" className="text-[11px] font-bold text-[#056852] hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {recentMessages.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No messages yet.</div>
              ) : (
                recentMessages.map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 relative flex items-center justify-center font-bold text-slate-600">
                      {msg.user.avatar ? <img src={msg.user.avatar} className="w-full h-full object-cover" /> : msg.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 truncate">{msg.user.name} <span className="text-[9px] font-normal text-slate-400">({msg.user.role})</span></p>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {new Date(msg.createdAt).toDateString() === new Date().toDateString() ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Yesterday'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[11px] truncate pr-2 ${!msg.read && !msg.isSender ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                          {msg.isSender ? 'You: ' : ''}{msg.text}
                        </p>
                        {!msg.read && !msg.isSender && (
                          <div className="w-4 h-4 rounded-full bg-[#056852] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                            1
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">Recent Bookings</h3>
              <Link href="/dashboard/student?section=bookings" className="text-[11px] font-bold text-[#056852] hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {recentBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No recent bookings.</div>
              ) : (
                recentBookings.map((booking, i) => {
                  const date = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date(booking.createdAt);
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{booking.subject} Class</p>
                          <p className="text-[10px] text-slate-500">with {booking.tutor?.name || 'Tutor'}</p>
                        </div>
                        <div className="ml-2 flex items-center gap-2 hidden sm:flex">
                          {booking.tutor?.avatar ? (
                            <img src={booking.tutor.avatar} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">{booking.tutor?.name?.charAt(0) || 'T'}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-semibold text-slate-700">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-500">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <div className="w-20 text-right">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-block w-full text-center ${booking.status === 'Confirmed' ? 'text-emerald-600 bg-emerald-50' :
                            booking.status === 'Completed' ? 'text-blue-600 bg-blue-50' :
                              booking.status === 'Cancelled' ? 'text-rose-600 bg-rose-50' :
                                'text-amber-600 bg-amber-50'
                          }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Payment Summary</h3>
              <Link href="/dashboard/student?section=payments" className="text-[11px] font-bold text-[#056852] hover:underline">View All</Link>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#056852]">₹{totalPayment.toLocaleString()}</h2>
                <p className="text-[10px] text-slate-500">Total Spent</p>
              </div>

              {/* SVG Donut Chart */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#10b981" strokeWidth="16" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference - paidDash}
                  />
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference - pendingDash}
                    transform={`rotate(${(paidPct / 100) * 360} 50 50)`}
                  />
                </svg>
              </div>
            </div>

            <div className="mt-6 space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
                  <span className="font-semibold text-slate-600">Paid</span>
                </div>
                <span className="font-bold text-slate-800">₹{paymentSummary.paid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></div>
                  <span className="font-semibold text-slate-600">Pending</span>
                </div>
                <span className="font-bold text-slate-800">₹{paymentSummary.pending.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm"></div>
                  <span className="font-semibold text-slate-600">Refunded</span>
                </div>
                <span className="font-bold text-slate-800">₹{paymentSummary.refunded.toLocaleString()}</span>
              </div>
            </div>

            <button className="w-full mt-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
              View Payment History
            </button>
          </div>
        </div>

        {/* ── Bottom Row 2 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Recommended Tutors */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">Recommended Tutors for You</h3>
              <Link href="/tutors" className="text-[11px] font-bold text-[#056852] hover:underline">View All</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedTutors.length === 0 ? (
                <div className="col-span-full text-center py-6 text-slate-400 text-xs">No tutors found.</div>
              ) : recommendedTutors.map((tutor, i) => (
                <div key={i} className="border border-slate-100 rounded-2xl p-4 flex flex-col hover:shadow-md transition bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 shrink-0">
                      {tutor.avatar ? <img src={tutor.avatar} className="w-full h-full object-cover" /> : tutor.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{tutor.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{tutor.subjects[0] || 'General'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-4">
                    <span className="flex items-center gap-1 font-bold text-amber-500"><Star size={10} className="fill-amber-500" /> {tutor.rating.toFixed(1)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{tutor.experience} Exp.</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[13px] font-extrabold text-[#056852]">₹{tutor.price}<span className="text-[9px] font-medium text-slate-500">/hr</span></span>
                    <button className="px-3 py-1.5 rounded-lg border border-[#056852] text-[#056852] text-[10px] font-bold hover:bg-[#056852] hover:text-white transition">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Overview Chart */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800">My Progress Overview</h3>
              <button className="text-[11px] font-bold text-[#056852] hover:underline">View Report</button>
            </div>

            <div className="relative w-full h-[160px] flex items-end pt-4">
              {/* Y-Axis labels */}
              <div className="absolute left-0 top-0 h-[120px] flex flex-col justify-between text-[9px] text-slate-400 font-medium">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>

              {/* Chart Area */}
              <div className="ml-8 w-full h-[120px] relative">
                {/* Grid lines */}
                <div className="absolute top-0 w-full border-t border-dashed border-slate-200"></div>
                <div className="absolute top-1/2 w-full border-t border-dashed border-slate-200"></div>
                <div className="absolute bottom-0 w-full border-t border-slate-300"></div>

                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>

                  <polyline
                    points={`${0},${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                    fill="url(#gradient)"
                    stroke="none"
                  />

                  <polyline
                    points={points}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points */}
                  {progressChart.data.map((val, i) => {
                    const x = (i / Math.max(progressChart.data.length - 1, 1)) * chartWidth;
                    const y = chartHeight - (val / maxData) * chartHeight;
                    return (
                      <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
                    )
                  })}
                </svg>
              </div>
            </div>

            {/* X-Axis Labels */}
            <div className="ml-8 flex justify-between mt-2 text-[9px] font-medium text-slate-500">
              {progressChart.labels.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-500 animate-pulse">Loading dashboard...</div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
