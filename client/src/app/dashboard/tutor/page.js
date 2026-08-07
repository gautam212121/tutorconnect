"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { usePoll, fetchApi } from '../../lib/api';
import { RefreshCw } from 'lucide-react';

// ── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, color = '#0f766e', height = 100 }) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const W = 320, H = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (W - 24) + 12;
      const y = H - ((value - min) / range) * (H - 24) - 12;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const fill = `${points} L${((data.length - 1) / (data.length - 1)) * (W - 24) + 12},${H} L12,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function MetricCard({ title, value, badge, color }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2.5 text-2xl font-extrabold text-slate-900">{value}</p>
        </div>
        <span className={`mt-1 shrink-0 rounded-2xl px-2.5 py-1.5 text-[11px] font-bold ${color}`}>{badge}</span>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, label, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Live Indicator ────────────────────────────────────────────────────────────
function LiveIndicator({ lastUpdate }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[10px] font-semibold text-emerald-600">Live</span>
      {lastUpdate && (
        <span className="text-[10px] text-slate-400">
          · Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TutorDashboardPage() {
  const [lastUpdate, setLastUpdate] = useState(null);

  const { data: dashData, loading, reload } = usePoll('/api/v1/tutor/dashboard', 30000, null);
  const socket = useSocket();

  useEffect(() => {
    if (!loading && dashData) setLastUpdate(new Date());
  }, [loading, dashData]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => reload();
    
    socket.on('bookingCreated', handleUpdate);
    socket.on('bookingUpdated', handleUpdate);
    socket.on('reviewAdded', handleUpdate);
    
    return () => {
      socket.off('bookingCreated', handleUpdate);
      socket.off('bookingUpdated', handleUpdate);
      socket.off('reviewAdded', handleUpdate);
    };
  }, [socket, reload]);

  const d = dashData || {};
  const metrics = d.metrics || {};
  const schedule = d.schedule || [];
  const revenueBySubject = d.revenueBySubject || [];
  const alerts = d.alerts || [];
  const weeklyEarnings = d.weeklyEarnings || [0, 0, 0, 0, 0, 0, 0];
  const monthlyEarnings = d.monthlyEarnings || [0, 0, 0, 0, 0, 0, 0];
  const studentGrowth = d.studentGrowth || [0, 0, 0, 0, 0, 0, 0];
  const bookingStats = d.bookingStats || { confirmed: 0, pending: 0 };

  const metricCards = [
    {
      title: 'Total Students', value: loading ? '…' : (metrics.totalStudents || 0).toLocaleString(),
      badge: metrics.studentGrowthBadge || '+0%', color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Active Courses', value: loading ? '…' : (metrics.activeCourses || 0),
      badge: metrics.courseGrowthBadge || '+0%', color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Average Rating', value: loading ? '…' : (metrics.avgRating || 0),
      badge: '⭐', color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Monthly Earnings', value: loading ? '…' : `₹${((metrics.monthlyEarnings || 0) / 1000).toFixed(1)}k`,
      badge: metrics.earningsGrowthBadge || '+0%', color: 'bg-teal-50 text-teal-700',
    },
    {
      title: "Today's Classes", value: loading ? '…' : (metrics.todayClasses || 0),
      badge: 'Live', color: 'bg-rose-50 text-rose-700',
    },
    {
      title: 'New Enquiries', value: loading ? '…' : (metrics.newEnquiries || 0),
      badge: 'New', color: 'bg-violet-50 text-violet-700',
    },
    {
      title: 'Profile Views', value: loading ? '…' : (metrics.profileViews || 0).toLocaleString(),
      badge: metrics.profileViewsBadge || '+0%', color: 'bg-cyan-50 text-cyan-700',
    },
    {
      title: 'Unread Messages', value: loading ? '…' : (metrics.unreadMessages || 0),
      badge: 'Open', color: 'bg-amber-50 text-amber-700',
    },
  ];

  const skeletonClass = "animate-pulse bg-slate-200 rounded-xl";

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#056852]">Tutor Dashboard</p>
              <h1 className="mt-1.5 text-2xl font-bold text-slate-900">Everything you need to run your teaching business</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Monitor student growth, schedule, earnings and messages from one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LiveIndicator lastUpdate={lastUpdate} />
              <button
                onClick={reload}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw size={12} /> Refresh
              </button>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                {metrics.newEnquiries || 8} new enquiries
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                Live classes active
              </div>
              <div className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                Profile views +22%
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <MetricCard key={card.title} {...card} />
          ))}
        </section>

        {/* Charts Row */}
        <section className="grid gap-5 xl:grid-cols-3">
          {/* Weekly Earnings */}
          <div className="col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Weekly Earnings</p>
                <p className="text-[11px] text-slate-500">Track revenue for your tutoring sessions</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                ₹{((weeklyEarnings[weeklyEarnings.length - 1]) / 1000).toFixed(1)}k this week
              </span>
            </div>
            {loading ? <div className={`${skeletonClass} h-28`} /> : <div className="h-28"><LineChart data={weeklyEarnings} /></div>}
            <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-slate-500">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">+24%</p>
                <p>Week over week</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">{metrics.todayClasses || 3} sessions</p>
                <p>Confirmed today</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">₹{((weeklyEarnings.reduce((a,b)=>a+b,0)/weeklyEarnings.length)/1000).toFixed(1)}k</p>
                <p>Avg income/day</p>
              </div>
            </div>
          </div>

          {/* Monthly Earnings */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Monthly Earnings</p>
                <p className="text-[11px] text-slate-500">Last 7 weeks overview</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                ₹{(monthlyEarnings.reduce((a,b)=>a+b,0)/1000).toFixed(0)}k
              </span>
            </div>
            {loading ? <div className={`${skeletonClass} h-28`} /> : <div className="h-28"><LineChart data={monthlyEarnings} color="#2563eb" /></div>}
            <div className="mt-4 space-y-2 text-[11px] text-slate-500">
              <p><span className="font-bold text-slate-900">3.8%</span> increase from last month</p>
              <p><span className="font-bold text-slate-900">₹12,400</span> pending payouts</p>
            </div>
          </div>
        </section>

        {/* Analytics Row */}
        <section className="grid gap-5 xl:grid-cols-3">
          {/* Student Growth */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-900">Student Growth</p>
              <span className="text-[11px] font-semibold text-slate-400">Last 7 days</span>
            </div>
            {loading ? <div className={`${skeletonClass} h-24`} /> : <div className="h-24"><LineChart data={studentGrowth} color="#059669" /></div>}
            <div className="mt-3 text-sm font-semibold text-slate-900">+{studentGrowth[studentGrowth.length - 1]} new students</div>
          </div>

          {/* Booking Stats */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-900">Booking Statistics</p>
              <span className="text-[11px] font-semibold text-slate-400">Confirmed / Pending</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-700">{loading ? '…' : bookingStats.confirmed}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Confirmed</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-700">{loading ? '…' : bookingStats.pending}</p>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">Pending</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <ProgressBar label="Booking rate" value={Math.round((bookingStats.confirmed / (bookingStats.confirmed + bookingStats.pending + 1)) * 100)} color="#059669" />
            </div>
          </div>

          {/* Class Completion Rate */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-900">Class Completion</p>
              <span className="text-[11px] font-semibold text-slate-400">Monthly</span>
            </div>
            <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-50">
              <div className="text-center">
                <p className="text-4xl font-extrabold text-slate-900">87%</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">On-time completion</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <ProgressBar label="Classes attended" value={87} color="#0f766e" />
              <ProgressBar label="Reschedule rate" value={8} color="#f59e0b" />
              <ProgressBar label="Cancellation rate" value={5} color="#ef4444" />
            </div>
          </div>
        </section>

        {/* Schedule + Revenue + Alerts */}
        <section className="grid gap-5 xl:grid-cols-3">
          {/* Today's Schedule */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">Today's Schedule</p>
              <span className="text-[11px] font-semibold text-slate-400">Live</span>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className={`${skeletonClass} h-14`} />)
              ) : schedule.map((item) => (
                <div key={item.time} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">{item.time}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      item.status === 'Ongoing'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-rose-100 text-rose-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-slate-900">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.subject} · {item.students} students</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subject-wise Revenue */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900 mb-4">Subject-wise Revenue</p>
            <div className="space-y-3">
              {loading ? (
                [1,2,3,4,5,6].map(i => <div key={i} className={`${skeletonClass} h-8`} />)
              ) : revenueBySubject.map((item) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                    <span className="text-[11px]">{item.subject}</span>
                    <span className="text-[11px] font-bold text-slate-900">₹{item.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#056852] transition-all duration-700" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Messages */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-900">Messages & Enquiries</p>
              <span className="text-[11px] font-semibold text-slate-400">Recent</span>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className={`${skeletonClass} h-12`} />)
              ) : alerts.map((alert, i) => (
                <div key={i} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {alert.type === 'enquiry' ? '📬' : alert.type === 'payment' ? '💰' : alert.type === 'schedule' ? '📅' : '⭐'}
                      </span>
                      <p className="text-[11px] font-semibold text-slate-800">{alert.label}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="grid gap-5 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <p className="text-sm font-bold text-slate-900 mb-4">Performance Metrics</p>
            <div className="space-y-4">
              <ProgressBar label="Response Time" value={92} color="#2563eb" />
              <ProgressBar label="Acceptance Rate" value={89} color="#059669" />
              <ProgressBar label="Cancellation Rate" value={6} color="#ef4444" />
              <ProgressBar label="Student Satisfaction" value={96} color="#f59e0b" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900 mb-4">Live Classes</p>
            <div className="space-y-2.5">
              {['Zoom', 'Google Meet', 'In-app'].map((tool) => (
                <div key={tool} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="text-[11px] font-semibold text-slate-700">{tool}</span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900 mb-4">KYC Documents</p>
            <div className="space-y-2.5">
              {[
                { label: 'KYC Status', status: 'Verified', ok: true },
                { label: 'PAN Card', status: 'Uploaded', ok: true },
                { label: 'Aadhaar', status: 'Uploaded', ok: true },
                { label: 'Degree', status: 'Pending', ok: false },
              ].map((doc) => (
                <div key={doc.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-[11px] font-medium text-slate-700">{doc.label}</span>
                  <span className={`text-[10px] font-bold ${doc.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{doc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
