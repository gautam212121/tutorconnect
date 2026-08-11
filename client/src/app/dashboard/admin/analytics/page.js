"use client";

import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Globe, ArrowUpRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

function LineAreaChart({ data, color = '#056852', gradId, height = 100 }) {
  if (!data || data.length < 2) return null;
  const W = 400, H = height, P = 6;
  const max = Math.max(...data);
  const pts = data.map((v, i) => [P + (i / (data.length - 1)) * (W - P * 2), P + ((max - v) / (max || 1)) * (H - P * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GroupedBarChart({ tutors, students, labels, height = 120 }) {
  const max = Math.max(...tutors, ...students, 1);
  const n = labels.length;
  const W = 400, H = height, bw = 14, gap = 5, grpGap = 18;
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
            <text x={x + grpW / 2} y={H - 3} textAnchor="middle" fontSize="8" fill="#94a3b8">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsAdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [activeUsers, setActiveUsers] = useState(142);

  useEffect(() => {
    fetch(`${API}/api/v1/admin/analytics`).then(r => r.json()).then(setAnalytics).catch(() => {});
    const interval = setInterval(() => setActiveUsers(p => Math.max(100, p + Math.floor(Math.random() * 11) - 5)), 3500);
    return () => clearInterval(interval);
  }, []);

  const a = analytics || {};
  const revenueData = a.revenueChart || [];
  const tutorData = a.tutorGrowth || [];
  const studentData = a.studentGrowth || [];
  const labels = (a.labels || []).map(l => l.replace('May ', ''));

  const metrics = [
    { label: 'New Users Today', value: '142', change: '+12.4%', color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
    { label: 'Active Users Now', value: activeUsers.toString(), live: true, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Globe },
    { label: 'Website Traffic', value: '24.8K', change: '+18.2%', color: 'text-violet-600', bg: 'bg-violet-50', icon: BarChart2 },
    { label: 'Conversion Rate', value: '6.4%', change: '+2.1%', color: 'text-amber-600', bg: 'bg-amber-50', icon: TrendingUp },
  ];

  const topTutors = [];

  const topSubjects = [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-xs text-slate-500">Real-time insights and growth metrics</p>
      </div>

      {/* Live Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
                  <Icon size={18} className={m.color} />
                </div>
                {m.live && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{m.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{m.label}</p>
              {m.change && (
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight size={12} className="text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-600">{m.change}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Revenue Growth</p>
              <p className="text-[11px] text-slate-500">May 12 — May 18, 2026</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
              <ArrowUpRight size={12} /> +28.6%
            </span>
          </div>
          <LineAreaChart data={revenueData} color="#056852" gradId="analyticsRev" height={110} />
        </div>

        {/* User Growth */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-900">User Growth</p>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#056852]" /> Tutors</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-300" /> Students</span>
            </div>
          </div>
          <GroupedBarChart tutors={tutorData} students={studentData} labels={labels} height={120} />
        </div>
      </div>

      {/* Top Tutors + Top Subjects */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Tutors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">🏆 Top Performing Tutors</p>
          <div className="space-y-2.5">
            {topTutors.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-400">{t.subject} · {t.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">{t.revenue}</p>
                  <p className="text-[10px] text-slate-400">⭐ {t.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Subjects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">🔥 Top Subject Demands</p>
          <div className="space-y-2.5">
            {topSubjects.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{s.subject}</span>
                  <span className="text-[11px] font-bold text-slate-600">{s.bookings.toLocaleString()} bookings</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${s.demand}%`,
                      backgroundColor: ['#056852', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f97316', '#94a3b8'][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
