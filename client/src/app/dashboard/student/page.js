"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePoll } from '../../lib/api';
import {
  Search, Calendar, BookOpen, Clock, CreditCard, Star,
  MessageSquare, Phone, ArrowRight, ChevronRight, User,
  MapPin, RefreshCw, CheckCircle, TrendingUp, Award,
} from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';

// ── Countdown Timer ────────────────────────────────────────────────────────
function Countdown({ targetIso }) {
  const [t, setT] = useState({ h: 1, m: 45, s: 30 });
  useEffect(() => {
    function tick() {
      const diff = new Date(targetIso) - new Date();
      if (diff <= 0) { setT({ h: 0, m: 0, s: 0 }); return; }
      setT({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-end gap-3">
      {[{ v: t.h, l: 'HRS' }, { v: t.m, l: 'MIN' }, { v: t.s, l: 'SEC' }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{pad(v)}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

// ── Circular Progress Ring ─────────────────────────────────────────────────
function Ring({ value = 68, size = 96 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#056852" strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Simple progress bar ────────────────────────────────────────────────────
function Bar({ value, color = '#056852' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Activity row icon ──────────────────────────────────────────────────────
const iconMap = {
  demo: '🎓', accept: '✅', payment: '💰', homework: '📝', default: '🔔',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('Good evening');
  const [lastRefresh, setLastRefresh] = useState(null);

  const { data: dash, loading, reload } = usePoll('/api/v1/student/dashboard', 25000, null);
  const { data: recTutors } = usePoll('/api/v1/tutors/recommended', 60000, []);

  const socket = useSocket();

  useEffect(() => {
    const s = localStorage.getItem('tutorconnect-user');
    if (s) setUser(JSON.parse(s));
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => reload();
    
    socket.on('bookingCreated', handleUpdate);
    socket.on('bookingUpdated', handleUpdate);
    
    return () => {
      socket.off('bookingCreated', handleUpdate);
      socket.off('bookingUpdated', handleUpdate);
    };
  }, [socket, reload]);

  useEffect(() => { if (!loading && dash) setLastRefresh(new Date()); }, [loading, dash]);

  const d = dash || {};
  const tutor = d.myTutor || {};
  const nc = d.nextClass || {};
  const stats = d.stats || {};
  const sched = d.weeklySchedule || [];
  const subjects = d.subjects || [];
  const prog = d.learningProgress || {};
  const activity = d.recentActivity || [];
  const tutorList = Array.isArray(recTutors) ? recTutors : [];

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-8">

      {/* ── TOP WELCOME BAR ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-5 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">Here's what's happening in your learning today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tutors"
              className="hidden sm:flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#056852]/20 hover:bg-[#044d3d] transition"
            >
              <Search size={15} /> Find Tutor
            </Link>
            <button
              className="flex items-center gap-2 rounded-xl border-2 border-[#056852] px-4 py-2 text-sm font-semibold text-[#056852] hover:bg-teal-50 transition"
            >
              <Calendar size={15} /> Book Demo
            </button>
            {lastRefresh && (
              <button
                onClick={reload}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 transition"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 md:px-8">

        {/* ── STATS ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* My Tutor */}
          <StatCard
            loading={loading}
            label="My Tutor"
            icon="👨‍🏫"
            iconBg="bg-blue-50"
          >
            <div className="flex items-center gap-2 mt-1">
              {tutor.image ? (
                <img src={tutor.image} alt={tutor.name} className="h-7 w-7 rounded-full object-cover ring-2 ring-white shadow" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {tutor.name?.charAt(0) || 'T'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">{tutor.name || 'Not assigned'}</p>
                {tutor.verified && <p className="text-[9px] text-emerald-600 font-semibold">✓ Verified</p>}
              </div>
            </div>
          </StatCard>

          {/* Next Class */}
          <StatCard loading={loading} label="Next Class" icon="🕐" iconBg="bg-teal-50">
            <p className="mt-1 text-sm font-bold text-slate-900">{stats.nextClassTime || 'No upcoming'}</p>
            <p className="text-[10px] text-slate-400">{stats.nextClassDetails || 'Schedule a class'}</p>
          </StatCard>

          {/* Subjects */}
          {/* Subjects */}
          <StatCard loading={loading} label="Subjects" icon="📚" iconBg="bg-violet-50">
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.subjects || 0}</p>
            <p className="text-[10px] text-slate-400 truncate">{stats.subjectNames || 'None yet'}</p>
          </StatCard>

          {/* Weekly Classes */}
          <StatCard loading={loading} label="Weekly Classes" icon="📅" iconBg="bg-amber-50">
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.weeklyClasses || 0} Days</p>
            <p className="text-[10px] text-slate-400">{stats.weeklyClassDays || 'None scheduled'}</p>
          </StatCard>

          {/* Demo Status */}
          <StatCard loading={loading} label="Demo Status" icon="🎯" iconBg="bg-emerald-50">
            <p className="mt-1 text-sm font-extrabold text-emerald-600">{stats.demoStatus || 'Not started'}</p>
            <p className="text-[10px] text-slate-400">{stats.demoNote || 'Book a demo'}</p>
          </StatCard>

          {/* Pending Payment */}
          <StatCard loading={loading} label="Pending Payment" icon="💳" iconBg="bg-rose-50" urgent>
            <p className="mt-1 text-lg font-extrabold text-rose-600">₹{(stats.pendingPayment || 0).toLocaleString()}</p>
            <p className="text-[10px] text-rose-400">{stats.pendingPaymentDue || 'No dues'}</p>
          </StatCard>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="mt-5 grid gap-5 lg:grid-cols-5">

          {/* LEFT (3 cols) */}
          <div className="space-y-5 lg:col-span-3">

            {/* ── UPCOMING HOME VISIT ────────────────────────────────── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">📍 Upcoming Home Visit</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Confirmed</span>
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-5 sm:flex-row">
                  {/* Tutor Card */}
                  <div className="flex flex-col items-center gap-2 sm:w-28 shrink-0">
                    <div className="relative">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl ring-4 ring-teal-50 shadow-md">
                        {loading ? (
                          <div className="h-full w-full animate-pulse bg-slate-200" />
                        ) : (
                          <img
                            src={tutor.image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
                            alt={tutor.name || 'Tutor'}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      {tutor.verified && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-white bg-emerald-500 px-2 py-0.5 text-[8px] font-bold text-white shadow">
                          ✓ VERIFIED
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs font-bold text-slate-900">{loading ? '—' : (tutor.name || 'Not assigned')}</p>
                      <p className="text-[9px] text-slate-400">{tutor.experience || 'N/A'}</p>
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        <Star size={9} fill="#f59e0b" stroke="#f59e0b" />
                        <span className="text-[9px] font-bold text-slate-700">{tutor.rating || 0}</span>
                        <span className="text-[9px] text-slate-400">({tutor.reviews || 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />)}
                      </div>
                    ) : (
                      <>
                        <Row icon={<BookOpen size={13} className="text-[#056852]" />} label="Subjects" val={nc.subjects || 'N/A'} />
                        <Row icon={<Calendar size={13} className="text-[#056852]" />} label="Date" val={nc.date || 'N/A'} />
                        <Row icon={<Clock size={13} className="text-[#056852]" />} label="Time" val={nc.time || 'N/A'} />
                        <Row icon={<User size={13} className="text-[#056852]" />} label="Mode" val={nc.mode || 'N/A'} />
                        <Row icon={<MapPin size={13} className="text-[#056852]" />} label="Address" val={nc.address || 'N/A'} />
                      </>
                    )}
                  </div>

                  {/* Countdown + Actions */}
                  <div className="flex flex-col items-center gap-3 sm:w-36 shrink-0">
                    <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Class starts in</p>
                      {nc.startsAt
                        ? <Countdown targetIso={nc.startsAt} />
                        : <div className="flex justify-center gap-3">
                            {[['01','HRS'],['45','MIN'],['30','SEC']].map(([v,l]) => (
                              <div key={l} className="text-center">
                                <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{v}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{l}</div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                    <button className="w-full rounded-xl bg-[#056852] py-2 text-[11px] font-bold text-white shadow hover:bg-[#044d3d] transition">
                      View Details
                    </button>
                    <div className="flex w-full gap-1.5">
                      <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition">
                        <MessageSquare size={11} /> Chat
                      </button>
                      <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition">
                        <Phone size={11} /> Call
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── MY SUBJECTS + PROGRESS ─────────────────────────────── */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* My Subjects */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">My Subjects</h2>
                  <button className="text-[11px] font-semibold text-[#056852] hover:underline">View All</button>
                </div>
                {loading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}</div>
                ) : subjects.length > 0 ? (
                  <div className="space-y-4">
                    {subjects.map((s) => (
                      <div key={s.name}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.tutor}</p>
                          </div>
                          <span className="text-xs font-bold text-[#056852]">{s.progress}%</span>
                        </div>
                        <Bar value={s.progress} />
                        {s.next && <p className="mt-1 text-[10px] text-slate-400">{s.next}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <BookOpen size={28} className="text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400">No subjects enrolled yet</p>
                  </div>
                )}
              </div>

              {/* Learning Progress */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Learning Progress</h2>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">This Month</span>
                </div>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <Ring value={prog.overall || 0} size={96} />
                      <div className="absolute text-center">
                        <p className="text-xl font-extrabold text-slate-900">{prog.overall || 0}%</p>
                        <p className="text-[9px] text-slate-400">Overall</p>
                      </div>
                    </div>
                    <div className="w-full space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Classes Attended</span>
                        <span className="font-bold text-slate-900">{prog.classesAttended || 0}/{prog.totalClasses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assignments Done</span>
                        <span className="font-bold text-slate-900">{prog.assignmentsDone || 0}/{prog.totalAssignments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Attendance</span>
                        <span className="font-bold text-[#056852]">{prog.attendance || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg. Rating</span>
                        <span className="font-bold text-slate-900">⭐ {prog.avgRating || 0}/5</span>
                      </div>
                    </div>
                    <button className="w-full rounded-xl border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition">
                      View Detailed Progress
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── RECOMMENDED TUTORS ─────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Recommended Tutors</h2>
                <Link href="/tutors" className="text-[11px] font-semibold text-[#056852] hover:underline">View All</Link>
              </div>
              {loading ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1,2,3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tutorList.slice(0, 3).map((t) => (
                    <div key={t.id} className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.image}
                          alt={t.name}
                          className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow group-hover:ring-teal-200 transition"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900">{t.name}</p>
                          <p className="truncate text-[10px] text-slate-500">{t.headline}</p>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Star size={9} fill="#f59e0b" stroke="#f59e0b" />
                            <span className="text-[9px] font-bold text-slate-700">{t.rating}</span>
                            <span className="text-[9px] text-slate-400">· {t.experience}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">₹{t.price}–{(t.priceMax || t.price + 200)}/hr</span>
                        <button className="rounded-lg bg-[#056852] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#044d3d] transition shadow-sm">
                          Book Demo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT (2 cols) */}
          <div className="space-y-5 lg:col-span-2">

            {/* ── WEEKLY SCHEDULE ───────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Weekly Schedule</h2>
                <button className="text-[11px] font-semibold text-[#056852] hover:underline">Full Calendar</button>
              </div>

              {/* Day indicators */}
              <div className="mb-3 grid grid-cols-7 gap-1">
                {(sched.length > 0 ? sched : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ day: d, active: false }))).map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition ${
                      s.active ? 'bg-[#056852] text-white shadow-md shadow-[#056852]/30' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {(s.day || '?').slice(0, 1)}
                    </div>
                    <span className={`text-[9px] font-semibold ${s.active ? 'text-[#056852]' : 'text-slate-300'}`}>
                      {(s.day || '').slice(0, 3)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Class slots */}
              <div className="space-y-2">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)
                ) : sched.filter(s => s.subject).length > 0 ? (
                  sched.filter(s => s.subject).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        s.mode === 'Home Visit' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.day?.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900">{s.subject}</p>
                        <p className="text-[10px] text-slate-400">{s.time} · {s.mode}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        s.mode === 'Home Visit' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'
                      }`}>{s.mode === 'Home Visit' ? '🏠' : '💻'}</span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">No classes scheduled this week</p>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                {sched.filter(s => s.subject).length} classes this week ({sched.filter(s => s.subject && s.mode === 'Home Visit').length} Home · {sched.filter(s => s.subject && s.mode !== 'Home Visit').length} Online)
              </p>
            </div>

            {/* ── RECENT ACTIVITY ───────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
                <button className="text-[11px] font-semibold text-[#056852] hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  [1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)
                ) : activity.length > 0 ? (
                  activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition cursor-pointer">
                      <span className="text-lg shrink-0">{iconMap[a.icon] || iconMap.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[11px] font-semibold text-slate-800">{a.text}</p>
                        <p className="text-[10px] text-slate-400">{a.time}</p>
                      </div>
                      <ChevronRight size={13} className="text-slate-300 shrink-0" />
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-slate-400">No recent activity</p>
                )}
              </div>
            </div>

            {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '🔍', label: 'Find Tutor', href: '/tutors', color: 'hover:bg-blue-50 hover:border-blue-200' },
                  { icon: '📅', label: 'Book Demo', href: '/tutors', color: 'hover:bg-teal-50 hover:border-teal-200' },
                  { icon: '🗓️', label: 'Schedule', href: '/dashboard/student?section=schedule', color: 'hover:bg-amber-50 hover:border-amber-200' },
                  { icon: '📝', label: 'Homework', href: '/dashboard/student?section=homework', color: 'hover:bg-violet-50 hover:border-violet-200' },
                  { icon: '💳', label: 'Payments', href: '/dashboard/student?section=payments', color: 'hover:bg-rose-50 hover:border-rose-200' },
                  { icon: '💬', label: 'Chat Tutor', href: '/dashboard/student?section=messages', color: 'hover:bg-emerald-50 hover:border-emerald-200' },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 py-3 text-center transition ${a.color}`}
                  >
                    <span className="text-xl leading-none">{a.icon}</span>
                    <span className="text-[9px] font-semibold text-slate-600 leading-tight">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────────────
function StatCard({ label, icon, iconBg, loading, children, urgent }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${urgent ? 'border-rose-100' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm ${iconBg}`}>{icon}</span>
      </div>
      {loading ? (
        <div className="space-y-1.5 mt-2">
          <div className="h-4 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      ) : children}
    </div>
  );
}

function Row({ icon, label, val }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="shrink-0 font-semibold text-slate-400 w-14">{label}</span>
      <span className="font-semibold text-slate-800">{val}</span>
    </div>
  );
}
