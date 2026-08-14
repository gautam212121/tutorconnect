"use client";

import { usePoll } from '../../../lib/api';
import { Video, Calendar, Clock, Users } from 'lucide-react';

export default function TutorLiveClassesPage() {
  const { data: classes = [], loading } = usePoll('/api/v1/tutor/live-classes', 15000, []);

  if (loading && classes.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading live classes...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Live Classes</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Live teaching schedule</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your online sessions, see upcoming live classes, and review past meetings.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Start Live Class', desc: 'Join your active session', icon: <Video size={18} /> },
            { title: 'Meeting History', desc: 'Review past live sessions', icon: <Clock size={18} /> },
            { title: 'Zoom / Google Meet', desc: 'Integration settings', icon: <Users size={18} /> },
            { title: 'Recordings', desc: 'Manage saved classes', icon: <Calendar size={18} /> }
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#056852] cursor-pointer transition group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-[#056852] group-hover:text-white transition">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 group-hover:text-[#056852]">{item.title}</p>
              </div>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Scheduled Online Classes</p>
              <p className="text-xs text-slate-500">Today’s live and upcoming online bookings.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {classes.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400">No live classes scheduled.</div>
            ) : classes.map((cls) => (
              <div key={cls.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{cls.subject} {cls.grade ? `- ${cls.grade}` : ''}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                       <Calendar size={12}/> {new Date(cls.createdAt).toLocaleDateString()}
                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                       <Users size={12}/> {cls.student ? cls.student.name : 'Unknown Student'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${cls.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {cls.status}
                    </span>
                    {cls.status === 'Confirmed' && (
                       <button className="bg-[#056852] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                         Join Call
                       </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
