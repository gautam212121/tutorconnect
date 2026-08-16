import React, { useState, useEffect } from 'react';
import { Award, Calendar, BookOpen, Percent, RefreshCw, BarChart2, Star } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentProgressSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Calculating real-time academic progress...
      </div>
    );
  }

  const stats = data?.stats || {
    completedClasses: 0,
    totalClasses: 0,
    attendance: 100,
    completedAssignments: 0,
    totalAssignments: 0,
    assignmentRate: 100,
    avgScore: 0
  };

  const subjectsProgress = data?.subjectsProgress || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Academic Progress</h2>
          <p className="text-sm text-slate-500">Track your attendance, assignments, and learning metrics</p>
        </div>
        <button
          onClick={fetchProgress}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Attendance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-[#056852]">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Attendance</span>
            <strong className="text-lg text-slate-800">{stats.attendance}%</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {stats.completedClasses} of {stats.totalClasses} classes
            </span>
          </div>
        </div>

        {/* Classes Completed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <BarChart2 size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Sessions Done</span>
            <strong className="text-lg text-slate-800">{stats.completedClasses}</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">Total registered classes</span>
          </div>
        </div>

        {/* Assignments Rate */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <BookOpen size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Assignments</span>
            <strong className="text-lg text-slate-800">{stats.assignmentRate}%</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {stats.completedAssignments} of {stats.totalAssignments} done
            </span>
          </div>
        </div>

        {/* Average Grade Score */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
            <Award size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Avg Grade / Score</span>
            <strong className="text-lg text-slate-800">{stats.avgScore > 0 ? `${stats.avgScore}%` : 'N/A'}</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">From graded submissions</span>
          </div>
        </div>

      </div>

      {/* Details Sections */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Subject-Wise Progress */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs md:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Subject Masteries</h3>
            <p className="text-[11px] text-slate-400">Class completion index mapped to specific booking tracks</p>
          </div>

          <div className="space-y-4">
            {subjectsProgress.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                No active subjects found in booking contracts.
              </div>
            ) : (
              subjectsProgress.map((sub, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{sub.name}</span>
                    <span className="text-[#056852]">{sub.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#056852] h-full rounded-full transition-all duration-500"
                      style={{ width: `${sub.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Completed Track</span>
                    <span>{sub.completed} / {sub.total} classes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Academic Standings Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Academic Standing</h3>
            <p className="text-[11px] text-slate-400">Current status based on assignments & scores</p>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-emerald-100/50 rounded-full text-emerald-800 font-bold text-xl w-14 h-14 flex items-center justify-center">
              {stats.avgScore >= 90 ? 'A+' : stats.avgScore >= 80 ? 'A' : stats.avgScore >= 70 ? 'B' : stats.avgScore >= 60 ? 'C' : 'Pass'}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">Excellent Standing</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Keep submitting assignments on time to maintain your rank.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
