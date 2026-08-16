"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { fetchApi, usePoll } from '../../lib/api';
import { useSocket } from '../../../hooks/useSocket';
import {
  Users, GraduationCap, BookOpen, TrendingUp, Calendar, Star,
  AlertTriangle, Ban, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Wifi, Server, Database, Mail, Video, RefreshCw, UserPlus,
  MessageSquare, BarChart2, Settings, Plus, Bell, FileText, Zap
} from 'lucide-react';

// ── Inline SVG Charts ─────────────────────────────────────────────────────────

function LineAreaChart({ data, color = '#056852', gradId, height = 110 }) {
  if (!data || data.length < 2) return null;
  const W = 500, H = height, PAD = 8;
  const max = Math.max(...data);
  const pts = data.map((v, i) => [
    PAD + (i / (data.length - 1)) * (W - PAD * 2),
    PAD + ((max - v) / (max || 1)) * (H - PAD * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GroupedBarChart({ tutors, students, labels, height = 130 }) {
  const max = Math.max(...tutors, ...students, 1);
  const n = labels.length;
  const W = 500, H = height, bw = 16, gap = 6, grpGap = 20;
  const grpW = bw * 2 + gap;
  const totalGrpW = n * grpW + (n - 1) * grpGap;
  const offsetX = (W - totalGrpW) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {tutors.map((tv, i) => {
        const sv = students[i];
        const x = offsetX + i * (grpW + grpGap);
        const th = ((tv / max) * (H - 24)).toFixed(1);
        const sh = ((sv / max) * (H - 24)).toFixed(1);
        return (
          <g key={i}>
            <rect x={x} y={H - 20 - th} width={bw} height={th} rx="3" fill="#056852" opacity="0.9" />
            <rect x={x + bw + gap} y={H - 20 - sh} width={bw} height={sh} rx="3" fill="#93c5fd" opacity="0.85" />
            <text x={x + grpW / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#94a3b8">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.42, ri = size * 0.27;
  let angle = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {segments.map((seg, idx) => {
        const a = (seg.value / total) * 2 * Math.PI;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
        const xi1 = cx + ri * Math.cos(angle + a), yi1 = cy + ri * Math.sin(angle + a);
        const xi2 = cx + ri * Math.cos(angle), yi2 = cy + ri * Math.sin(angle);
        const lg = a > Math.PI ? 1 : 0;
        const d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ri},${ri} 0 ${lg},0 ${xi2.toFixed(2)},${yi2.toFixed(2)} Z`;
        angle += a;
        return <path key={idx} d={d} fill={seg.color} />;
      })}
      <circle cx={cx} cy={cy} r={ri * 0.85} fill="white" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e293b">100%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#64748b">Total</text>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, change, changeType, icon: Icon, iconBg, iconColor, suffix = '', urgent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
            {suffix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {changeType === 'up' ? (
            <ArrowUpRight size={14} className="text-emerald-600" />
          ) : (
            <ArrowDownRight size={14} className="text-rose-500" />
          )}
          <span className={`text-[11px] font-bold ${changeType === 'up' ? 'text-emerald-600' : 'text-rose-500'}`}>
            {change}
          </span>
          <span className="text-[11px] text-slate-400">{urgent ? 'Action required' : 'this month'}</span>
        </div>
      )}
      {urgent && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase">Action Required</span>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [activeUsers, setActiveUsers] = useState(142);
  const [dateRange, setDateRange] = useState('This Month');
  const [approvalStatus, setApprovalStatus] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  // Real-time polling — longer intervals to reduce server load
  const { data: stats, loading: statsLoading, reload: reloadStats } = usePoll('/api/v1/admin/stats', 60000, null);
  const { data: analytics } = usePoll('/api/v1/admin/analytics', 120000, null);
  const { data: bookingsData, reload: reloadBookings } = usePoll('/api/v1/admin/bookings', 45000, []);
  const { data: usersData } = usePoll('/api/v1/admin/users', 60000, []);
  const { data: activityData } = usePoll('/api/v1/admin/recent-activity', 45000, []);
  const { data: notifs } = usePoll('/api/v1/notifications', 60000, []);

  const loading = statsLoading;
  const bookings = Array.isArray(bookingsData) ? bookingsData : [];
  const users = Array.isArray(usersData) ? usersData : [];

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const reloadAll = () => {
      reloadStats();
      reloadBookings();
    };

    socket.on('bookingCreated', reloadAll);
    socket.on('bookingUpdated', reloadAll);
    socket.on('userCreated', reloadAll);
    socket.on('userUpdated', reloadAll);
    
    return () => {
      socket.off('bookingCreated', reloadAll);
      socket.off('bookingUpdated', reloadAll);
      socket.off('userCreated', reloadAll);
      socket.off('userUpdated', reloadAll);
    };
  }, [socket, reloadStats, reloadBookings]);

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (stats) setLastUpdate(new Date());
  }, [stats]);

  useEffect(() => {
    // Simulate real-time active user count
    const interval = setInterval(() => {
      setActiveUsers(prev => Math.max(100, prev + Math.floor(Math.random() * 11) - 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApproval = useCallback(async (tutorId, tutorName, action) => {
    setApprovalStatus(prev => ({ ...prev, [tutorId]: 'loading' }));
    try {
      await fetchApi(`/api/v1/admin/tutors/${tutorId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      setApprovalStatus(prev => ({ ...prev, [tutorId]: action === 'approve' ? 'approved' : 'rejected' }));
      reloadStats();
    } catch (err) {
      setApprovalStatus(prev => ({ ...prev, [tutorId]: 'error' }));
    }
  }, [reloadStats]);

  const s = stats || {};
  const a = analytics || {};

  const statCards = [
    {
      title: 'Total Tutors', value: s.totalTutors || 0, change: s.tutorChange || '+0%', changeType: 'up',
      icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-600',
    },
    {
      title: 'Total Students', value: s.totalStudents || 0, change: s.studentChange || '+0%', changeType: 'up',
      icon: GraduationCap, iconBg: 'bg-teal-50', iconColor: 'text-[#056852]',
    },
    {
      title: 'Active Courses', value: s.activeCourses || 0, change: s.courseChange || '+0%', changeType: 'up',
      icon: BookOpen, iconBg: 'bg-violet-50', iconColor: 'text-violet-600',
    },
    {
      title: 'Total Revenue', value: `₹${((s.totalRevenue || 0) / 100000).toFixed(2)}L`, change: s.revenueChange || '+0%', changeType: 'up',
      icon: TrendingUp, iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
    },
    {
      title: "Today's Bookings", value: s.todaysBookings || 0, change: s.bookingChange || '+0%', changeType: 'up',
      icon: Calendar, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
    },
    {
      title: 'Pending Approvals', value: s.pendingApprovals || 0, urgent: (s.pendingApprovals || 0) > 0,
      icon: AlertTriangle, iconBg: 'bg-rose-50', iconColor: 'text-rose-500',
    },
  ];

  const categories = [
    { label: 'Programming', value: 28, color: '#056852' },
    { label: 'Language', value: 22, color: '#0ea5e9' },
    { label: 'Academic', value: 16, color: '#8b5cf6' },
    { label: 'Design', value: 14, color: '#f59e0b' },
    { label: 'Music', value: 10, color: '#f97316' },
    { label: 'Others', value: 10, color: '#94a3b8' },
  ];

  const recentRegistrations = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map(u => ({
    name: u.name,
    email: u.email,
    role: u.role,
    time: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recently'
  }));

  const pendingApprovals = users.filter(u => u.role === 'tutor' && u.status === 'pending').map(u => ({
    id: u._id || u.id,
    name: u.name,
    subject: u.subjects?.join(', ') || 'No subject listed',
    time: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recently'
  }));

  const health = [
    { name: 'Web Server', ok: true },
    { name: 'Database', ok: true },
    { name: 'Payment Gateway', ok: true },
    { name: 'Email Service', ok: true },
    { name: 'Live Classes', ok: true },
  ];

  const notifications = Array.isArray(notifs) ? notifs.slice(0, 4) : [];

  const quickActions = [
    { label: 'Add Tutor', emoji: '👨‍🏫', href: '/dashboard/admin/tutors', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
    { label: 'Add Student', emoji: '👨‍🎓', href: '/dashboard/admin/students', color: 'bg-teal-50 hover:bg-teal-100 text-teal-700' },
    { label: 'Create Course', emoji: '📚', href: '/dashboard/admin/courses', color: 'bg-violet-50 hover:bg-violet-100 text-violet-700' },
    { label: 'Send Notification', emoji: '🔔', href: '/dashboard/admin/notifications', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
    { label: 'Generate Report', emoji: '📊', href: '/dashboard/admin/reports', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700' },
    { label: 'System Settings', emoji: '⚙️', href: '/dashboard/admin/settings', color: 'bg-slate-50 hover:bg-slate-100 text-slate-700' },
  ];

  const revenueData = a.revenueChart || [0, 0, 0, 0, 0, 0, 0];
  const tutorData = a.tutorGrowth || [0, 0, 0, 0, 0, 0, 0];
  const studentData = a.studentGrowth || [0, 0, 0, 0, 0, 0, 0];
  const chartLabels = a.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Welcome back, Admin! 👋</h1>
          <p className="mt-0.5 text-xs text-slate-500">Here's what's happening on your platform today.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Real-time indicator */}
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-emerald-700">{activeUsers} Active Now</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-400 shadow-sm">
              Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
            <Calendar size={13} className="text-slate-400" />
            {today}
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Week</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Revenue Overview</p>
              <p className="text-[11px] text-slate-500">₹{(revenueData.reduce((a, b) => a + b, 0) / 100000).toFixed(2)}L total</p>
            </div>
            <select className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 focus:outline-none">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          {/* Y-axis labels */}
          <div className="flex gap-2">
            <div className="flex flex-col justify-between text-[10px] text-slate-400 py-1 w-8 text-right">
              <span>₹4L</span><span>₹3L</span><span>₹2L</span><span>₹1L</span><span>₹0</span>
            </div>
            <div className="flex-1">
              <LineAreaChart data={revenueData} color="#056852" gradId="revGrad" height={110} />
              <div className="flex justify-between mt-1">
                {chartLabels.map((l, i) => (
                  <span key={i} className="text-[9px] text-slate-400">{l.replace('May ', '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-bold text-slate-900">User Growth</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#056852]" /> Tutors</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-300" /> Students</span>
            </div>
          </div>
          <GroupedBarChart tutors={tutorData} students={studentData} labels={chartLabels.map(l => l.replace('May ', ''))} height={128} />
        </div>

        {/* Top Categories Donut */}
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">Top Categories</p>
          <div className="flex items-center gap-3">
            <DonutChart segments={categories} size={120} />
            <div className="space-y-1.5 flex-1">
              {categories.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-[11px] text-slate-600">{c.label}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">{c.value}%</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-1 text-[10px] text-slate-400">Total: 100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Registrations + Approvals + Health ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Registrations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Recent Registrations</p>
            <Link href="/dashboard/admin/tutors" className="text-[11px] font-semibold text-[#056852] hover:underline">View All</Link>
          </div>
          <div className="space-y-2.5">
            {recentRegistrations.map((reg, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                  {reg.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{reg.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{reg.email}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    reg.role === 'tutor' ? 'bg-blue-100 text-blue-700' :
                    reg.role === 'student' ? 'bg-teal-100 text-teal-700' :
                    'bg-violet-100 text-violet-700'
                  }`}>{reg.role}</span>
                  <span className="text-[10px] text-slate-400">{reg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Pending Approvals</p>
            <Link href="/dashboard/admin/tutors?filter=pending" className="text-[11px] font-semibold text-[#056852] hover:underline">View All</Link>
          </div>
          <div className="space-y-2.5">
            {pendingApprovals.filter(p => !['approved','rejected'].includes(approvalStatus[p.id])).map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-700">
                  {p.name?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.subject}</p>
                  <p className="text-[10px] text-slate-400">Submitted {p.time}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {approvalStatus[p.id] === 'loading' ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#056852] border-t-transparent" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproval(p.id, p.name, 'approve')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
                        title="Approve"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => handleApproval(p.id, p.name, 'reject')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition"
                        title="Reject"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {pendingApprovals.every(p => ['approved','rejected'].includes(approvalStatus[p.id])) && (
              <p className="text-[11px] text-center text-emerald-600 font-semibold py-2">✅ All approvals processed!</p>
            )}
          </div>
        </div>

        {/* Platform Health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Platform Health</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">All Systems Operational</span>
          </div>
          <div className="space-y-2.5">
            {[
              { name: 'Web Server', icon: Server },
              { name: 'Database', icon: Database },
              { name: 'Payment Gateway', icon: TrendingUp },
              { name: 'Email Service', icon: Mail },
              { name: 'Live Classes', icon: Video },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-emerald-600">Operational</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition">
            <RefreshCw size={12} /> Refresh Status
          </button>
        </div>
      </div>

      {/* ── Bottom Row: Notifications + Quick Actions ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Notifications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Recent Notifications</p>
            <Link href="/dashboard/admin/notifications" className="text-[11px] font-semibold text-[#056852] hover:underline">View All</Link>
          </div>
          <div className="space-y-2.5">
            {notifications.map((n, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="text-lg shrink-0">{n.icon}</span>
                <p className="flex-1 text-xs font-medium text-slate-700">{n.text}</p>
                <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 gap-2.5">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 text-center transition ${action.color}`}
              >
                <span className="text-2xl">{action.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bookings Table (Real API Data) ── */}
      {bookings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Recent Bookings</p>
            <Link href="/dashboard/admin/bookings" className="text-[11px] font-semibold text-[#056852] hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-2 text-left">Student</th>
                  <th className="pb-2 text-left">Tutor</th>
                  <th className="pb-2 text-left">Time</th>
                  <th className="pb-2 text-left">Status</th>
                  <th className="pb-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="py-2">
                    <td className="py-2.5 font-medium text-slate-900">{b.student}</td>
                    <td className="py-2.5 text-slate-600">{b.tutor}</td>
                    <td className="py-2.5 text-slate-400">{b.time}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        b.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        b.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-600'
                      }`}>{b.status || 'Pending'}</span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={async () => {
                            await fetchApi(`/api/v1/admin/bookings/${b.id}`, {
                              method: 'PUT',
                              body: JSON.stringify({ status: 'Confirmed' }),
                            });
                            reloadBookings();
                          }}
                          className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-200 transition"
                        >Confirm</button>
                        <button
                          onClick={async () => {
                            await fetchApi(`/api/v1/admin/bookings/${b.id}`, {
                              method: 'PUT',
                              body: JSON.stringify({ status: 'Declined' }),
                            });
                            reloadBookings();
                          }}
                          className="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-200 transition"
                        >Decline</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Today's Classes ── */}
      {bookings.filter(b => b.status === 'Confirmed' && new Date(b.createdAt).toDateString() === new Date().toDateString()).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">📅 Today's Live Classes</p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {bookings
              .filter(b => b.status === 'Confirmed' && new Date(b.createdAt).toDateString() === new Date().toDateString())
              .slice(0, 3)
              .map((cls, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#056852]/10 text-sm font-bold text-[#056852]">
                  {(cls.tutor?.name || cls.tutor || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{cls.tutor?.name || cls.tutor}</p>
                  <p className="text-[11px] text-slate-500 truncate">{cls.course?.title || 'Class'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">Scheduled</span>
                  </div>
                </div>
                <div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Upcoming</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
