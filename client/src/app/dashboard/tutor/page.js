"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TutorScheduleView from './components/TutorScheduleView';
import {
  Users, Star, Calendar, ArrowRight, CreditCard, TrendingUp, ArrowUpRight,
  MapPin, GraduationCap, Clock, Award, ChevronRight, Wallet, Shield,
  RefreshCw, AlertCircle, Zap, Crown, Info, FileText, MessageSquare,
  BarChart2, BadgeCheck, CircleDollarSign, ExternalLink, Phone,
} from 'lucide-react';
import { usePoll } from '../../lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

// Simple Chart component
function MiniLineChart({ data = [], height = 80 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1 || 1)) * 200,
    y: height - (val / max) * height,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = path + ` L200,${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 200 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <path d={path} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TutorDashboardContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [commissionStructure, setCommissionStructure] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('verifiedtutor-user');
    if (stored) setUser(JSON.parse(stored));

    fetch(`${API}/api/v1/config/commission`)
      .then(r => r.json())
      .then(setCommissionStructure)
      .catch(() => {});
  }, []);

  const { data: dashboard, loading: dashLoading } = usePoll('/api/v1/tutor/dashboard', 10000, null);
  
  // Combine loading state
  useEffect(() => {
    if (!dashLoading && dashboard) {
      setLoading(false);
    }
  }, [dashLoading, dashboard]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-56 skeleton rounded-2xl" />
          <div className="h-56 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const commission = dashboard?.commission || {};
  const leads = dashboard?.leads || [];
  const upcomingSessions = dashboard?.upcomingSessions || [];
  const assignedStudents = dashboard?.assignedStudents || [];
  const monthlyEarnings = dashboard?.monthlyEarnings || [];
  const recentPayouts = dashboard?.recentPayouts || [];
  const completedSessions = dashboard?.completedSessions || 0;
  const hourlyRate = dashboard?.hourlyRate ?? dashboard?.rateSummary?.hourly ?? 0;
  const monthlyRate = dashboard?.monthlyRate ?? dashboard?.rateSummary?.monthly ?? 0;
  const freeLeads = stats.freeLeads || { used: 0, limit: 5, remaining: 5 };
  const tiers = commissionStructure?.tiers || [];

  if (section === 'schedule') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <TutorScheduleView user={user} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Here&apos;s your teaching overview and performance summary.</p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            icon: <Users size={20} />, iconBg: 'bg-emerald-50 text-emerald-600',
            value: `${freeLeads.remaining}/${freeLeads.limit}`, label: 'Free Leads Remaining',
            sub: 'This Month', badge: null,
          },
          {
            icon: <FileText size={20} />, iconBg: 'bg-blue-50 text-blue-600',
            value: stats.activeLeads || 0, label: 'Active Leads',
            sub: `Responded: ${stats.respondedLeads || 0}`, badge: null,
          },
          {
            icon: <Calendar size={20} />, iconBg: 'bg-purple-50 text-purple-600',
            value: stats.upcomingSessions || 0, label: 'Upcoming Sessions',
            sub: 'This Week', badge: null,
          },
          {
            icon: <CircleDollarSign size={20} />, iconBg: 'bg-green-50 text-green-600',
            value: `₹${(stats.totalEarnings || 0).toLocaleString()}`, label: 'Total Earnings',
            sub: 'This Month', badge: null,
          },
          {
            icon: <Wallet size={20} />, iconBg: 'bg-amber-50 text-amber-600',
            value: `₹${(stats.walletBalance || 0).toLocaleString()}`, label: 'Wallet Balance',
            sub: 'Available', badge: null,
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} mb-2`}>
              {card.icon}
            </div>
            <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{card.label}</p>
            <p className="text-[10px] text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Commission Rate + Premium Upsell ───────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Your Rates</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Current tutoring pricing</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-emerald-600">₹{Number(hourlyRate || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Hourly</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Hourly Rate</p>
              <p className="mt-1 text-lg font-extrabold text-slate-800">₹{Number(hourlyRate || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Monthly Rate</p>
              <p className="mt-1 text-lg font-extrabold text-emerald-700">₹{Number(monthlyRate || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Premium Upsell */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={20} className="text-amber-400" />
            <h3 className="text-sm font-bold">Want Lower Commission & More Leads?</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Upgrade to a Pro or Premium plan and get more leads, lower commission rates, search boost, and priority support.
          </p>

          <div className="space-y-2 mb-4">
            {[
              '50 leads/month (Basic: 20)',
              '5% commission rate',
              'Search boost & priority badge',
              'Premium support',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-slate-200">
                <BadgeCheck size={12} className="text-emerald-400 shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/tutor/settings?tab=subscription"
            className="flex items-center justify-center gap-1 w-full py-2.5 bg-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-600 transition"
          >
            View Subscription Plans <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Commission Rate */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Your Commission Rate</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Based on your completed sessions tier</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-emerald-600">
                {Math.round((commission.rate || 0.15) * 100)}%
              </p>
              <p className="text-[10px] text-slate-400">{commission.tier || '0 – 20 Sessions'}</p>
            </div>
          </div>

          {/* Commission Tiers Table */}
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 text-slate-500 font-semibold">Session Range</th>
                  <th className="text-center px-3 py-2 text-slate-500 font-semibold">Commission Rate</th>
                  <th className="text-center px-3 py-2 text-slate-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {(tiers.length > 0 ? tiers : [
                  { label: '0 – 20 Sessions', ratePercent: '15%', minSessions: 0, maxSessions: 20 },
                  { label: '21 – 100 Sessions', ratePercent: '10%', minSessions: 21, maxSessions: 100 },
                  { label: '100+ Sessions', ratePercent: '5%', minSessions: 101, maxSessions: 999999 },
                ]).map((tier, i) => {
                  const isActive = completedSessions >= tier.minSessions && completedSessions <= tier.maxSessions;
                  return (
                    <tr key={i} className={isActive ? 'bg-emerald-50' : ''}>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{tier.label}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-800">{tier.ratePercent}</td>
                      <td className="px-3 py-2.5 text-center">
                        {isActive ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Current</span>
                        ) : completedSessions > (tier.maxSessions || 0) ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">Completed</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold">Upcoming</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Link href="#" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <Info size={12} /> View Full Commission Structure
          </Link>
        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Assigned Students</h3>
            <span className="text-[10px] text-slate-400">Live bookings</span>
          </div>
          {assignedStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No assigned students yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedStudents.map((student, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.studentName || 'Student'}</p>
                      <p className="text-[10px] text-slate-500">{student.selectedSubjects?.join(', ') || 'General subject'}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{student.status || 'Pending'}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                    <div><span className="block text-[9px] uppercase tracking-wide text-slate-400">Class</span>{student.classLevel || 'N/A'}</div>
                    <div><span className="block text-[9px] uppercase tracking-wide text-slate-400">Location</span>{student.location || 'N/A'}</div>
                    <div><span className="block text-[9px] uppercase tracking-wide text-slate-400">Schedule</span>{student.schedule ? new Date(student.schedule).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Flexible'}</div>
                    <div><span className="block text-[9px] uppercase tracking-wide text-slate-400">Contact</span>{student.contact || 'N/A'}</div>
                  </div>
                  <div className="mt-3 rounded-xl bg-white p-3 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Amount</span>
                      <strong>₹{Number(student.totalAmount || student.amount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Payment</span>
                      <strong>{student.paymentStatus || 'Pending'}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Message Activity</h3>
            <Link href="/dashboard/tutor/messages" className="text-[11px] font-semibold text-emerald-600">Open Inbox</Link>
          </div>
          <div className="space-y-3 text-[11px] text-slate-500">
            <div className="rounded-xl bg-slate-50 p-3">Tutor → student messages are shared with the student and admin in the live inbox.</div>
            <div className="rounded-xl bg-slate-50 p-3">Student replies are mirrored to student, tutor, and admin via the shared conversation API.</div>
            <div className="rounded-xl bg-slate-50 p-3">Socket events emit in real time for new messages and read receipts.</div>
          </div>
        </div>
      </div>

      {/* ── Upcoming Sessions + My Leads ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Upcoming Sessions</h3>
            <Link href="/dashboard/tutor?section=schedule" className="text-[11px] font-semibold text-emerald-600">View All</Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={36} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session, i) => {
                const date = session.scheduledAt ? new Date(session.scheduledAt) : null;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    {date && (
                      <div className="w-12 h-14 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        <span className="text-lg font-extrabold text-slate-800 -mt-0.5">{date.getDate()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{session.subject} – {session.grade || ''}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Users size={10} /> {session.student?.name || 'Student'}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {session.address?.area || 'Location'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-600">₹{session.amount || 0}</p>
                      <p className="text-[10px] text-slate-400">{session.duration || 60} min</p>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold mt-0.5 inline-block">
                        {session.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Leads */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">My Leads</h3>
            <Link href="/dashboard/tutor?section=leads" className="text-[11px] font-semibold text-emerald-600">View All</Link>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={36} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No leads yet. Complete your profile to start receiving leads.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.slice(0, 4).map((lead, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                    {lead.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{lead.student?.name || 'Student'}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {lead.classLevel} • {lead.subject}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lead.status === 'new' ? 'bg-blue-50 text-blue-600' :
                    lead.status === 'contacted' ? 'bg-amber-50 text-amber-600' :
                    lead.status === 'responded' ? 'bg-emerald-50 text-emerald-600' :
                    lead.status === 'converted' ? 'bg-green-50 text-green-600' :
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Earnings Overview + Lead Policy + Progress ─────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Earnings Overview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Earnings Overview</h3>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Earnings</span>
              <span className="font-bold text-slate-800">₹{(stats.grossEarnings || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Commission Paid</span>
              <span className="font-bold text-red-500">- ₹{(stats.totalCommission || 0).toLocaleString()}</span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-600">Net Earnings</span>
              <span className="font-extrabold text-emerald-600">₹{(stats.totalEarnings || 0).toLocaleString()}</span>
            </div>
          </div>
          <MiniLineChart data={monthlyEarnings.map(m => m.earnings)} height={60} />
          <Link href="/dashboard/tutor/earnings" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            View Full Report <ArrowRight size={12} />
          </Link>
        </div>

        {/* Lead Policy */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Lead Usage & Replacement Policy</h3>
          <div className="bg-blue-50 rounded-xl p-3 mb-3">
            <p className="text-[11px] text-blue-800 leading-relaxed">
              <strong>Every verified tutor</strong> gets {commissionStructure?.freeLeadsPerMonth || 5} free leads per month.
              If a lead is fake or not responding, you can <strong>report it within {commissionStructure?.leadDisputeWindowHours || 48} hours</strong> and
              we&apos;ll replace it automatically.
            </p>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-400">Free Leads Used</span><span className="font-bold text-slate-700">{freeLeads.used} / {freeLeads.limit}</span></div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (freeLeads.used / (typeof freeLeads.limit === 'number' ? freeLeads.limit : 5)) * 100)}%` }} />
            </div>
            <div className="flex justify-between"><span className="text-slate-400">Remaining</span><span className="font-bold text-emerald-600">{freeLeads.remaining}</span></div>
          </div>
          <button className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
            <AlertCircle size={12} /> Report a Lead
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Your Progress</h3>

          {/* Circular progress */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#059669" strokeWidth="8"
                  strokeDasharray={`${Math.min(100, (completedSessions / 100) * 100) * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-800">{completedSessions}</span>
                <span className="text-[9px] text-slate-400">of 100</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700">
              Current Tier: <span className="text-emerald-600">{commission.tier || '0 – 20 Sessions'}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Complete {Math.max(0, (completedSessions <= 20 ? 21 : completedSessions <= 100 ? 101 : 0) - completedSessions)} more sessions to unlock lower commission
            </p>
          </div>

          <Link href="#" className="mt-3 block text-center text-[11px] font-semibold text-emerald-600">
            <Info size={12} className="inline mr-0.5" /> How tiers work?
          </Link>
        </div>
      </div>

      {/* ── Recent Payouts ─────────────────────────────────────────────────── */}
      {recentPayouts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Payouts</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {recentPayouts.map((payout, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400">{payout.payoutDisplayId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    payout.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                    payout.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {payout.status}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-slate-800">₹{payout.amount?.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap size={28} className="text-amber-300" />
          <div>
            <h3 className="text-lg font-bold text-white">Become a Top Rated Tutor!</h3>
            <p className="text-xs text-emerald-100">Complete your profile, respond to leads quickly, and maintain high ratings.</p>
          </div>
        </div>
        <Link
          href="/dashboard/tutor/profile"
          className="px-6 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition shrink-0"
        >
          Boost My Profile
        </Link>
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <TutorDashboardContent />
    </Suspense>
  );
}
