import React from 'react';
import { usePoll } from '../../../lib/api';
import { Users, Calendar, Star, CircleDollarSign, BarChart2, BookOpen, CheckSquare, RefreshCw } from 'lucide-react';

export default function TutorAnalyticsSection() {
  const { data: analytics, loading, reload } = usePoll('/api/v1/tutor/analytics', 15000, null);

  if (loading && !analytics) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Analyzing learning statistics...
      </div>
    );
  }

  const stats = [
    { label: 'Total Students', value: analytics?.totalStudents || 0, icon: <Users size={20} />, bg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Students', value: analytics?.activeStudents || 0, icon: <Users size={20} />, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Completed Classes', value: analytics?.completedSessions || 0, icon: <Calendar size={20} />, bg: 'bg-purple-50 text-purple-600' },
    { label: 'Upcoming Classes', value: analytics?.upcomingSessions || 0, icon: <Calendar size={20} />, bg: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Teaching Analytics</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time stats compiled from database schedules and transactions</p>
        </div>
        <button
          onClick={reload}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-3 rounded-2xl ${item.bg}`}>
              {item.icon}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{item.label}</span>
              <strong className="text-xl text-slate-800">{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Main Aggregations */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Earnings & Ratings overview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Earnings & Ratings</h3>
            <p className="text-[11px] text-slate-400">Dynamically compiled billing and profile averages</p>
          </div>

          <div className="space-y-3 font-medium text-xs text-slate-700">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <CircleDollarSign size={16} className="text-emerald-600" /> Lifetime Tutor Share
              </span>
              <strong className="text-slate-900 text-sm">₹{(analytics?.totalEarnings || 0).toLocaleString()}</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Clock size={16} className="text-amber-500" /> Pending Payout
              </span>
              <strong className="text-slate-900 text-sm">₹{(analytics?.pendingEarnings || 0).toLocaleString()}</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="flex items-center gap-2 text-slate-500">
                <Star size={16} className="text-amber-400 fill-amber-400" /> Average Rating
              </span>
              <strong className="text-slate-900 text-sm">{analytics?.avgRating || 0} / 5.0</strong>
            </div>
          </div>
        </div>

        {/* Subject wise stats */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Booking Distribution</h3>
            <p className="text-[11px] text-slate-400">Total assignments by subject track</p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {(!analytics?.subjectStats || analytics.subjectStats.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">No subject tracking data found.</div>
            ) : (
              analytics.subjectStats.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>{item.name}</span>
                    <span>{item.count} bookings</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#056852] h-full rounded-full" style={{ width: `${Math.min(100, item.count * 15)}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assignment Performance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Assignment Index</h3>
            <p className="text-[11px] text-slate-400">Tasks shared and student submissions</p>
          </div>

          <div className="space-y-3 text-xs font-semibold text-slate-700">
            <div className="flex justify-between items-center p-2.5 border-b border-slate-50">
              <span className="flex items-center gap-2 text-slate-500">
                <BookOpen size={15} /> Total Shared Tasks
              </span>
              <strong className="text-slate-900">{analytics?.assignmentStats?.total || 0}</strong>
            </div>

            <div className="flex justify-between items-center p-2.5 border-b border-slate-50">
              <span className="flex items-center gap-2 text-slate-500">
                <CheckSquare size={15} /> Total Submissions
              </span>
              <strong className="text-slate-900">{analytics?.assignmentStats?.submitted || 0}</strong>
            </div>

            <div className="flex justify-between items-center p-2.5">
              <span className="flex items-center gap-2 text-slate-500">
                <Award size={15} /> Graded Submissions
              </span>
              <strong className="text-emerald-700">{analytics?.assignmentStats?.graded || 0}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Inline fallback for Clock icon missing
function Clock({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
