"use client";

import { usePoll } from '../../../lib/api';
import { Bell, CreditCard, CalendarX, UserPlus, Info } from 'lucide-react';

export default function TutorNotificationsPage() {
  const { data: notifications = [], loading } = usePoll('/api/v1/tutor/notifications', 15000, []);

  if (loading && notifications.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading notifications...</div>;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard size={18} className="text-emerald-600" />;
      case 'cancellation': return <CalendarX size={18} className="text-rose-600" />;
      case 'booking': return <UserPlus size={18} className="text-indigo-600" />;
      default: return <Info size={18} className="text-blue-600" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'payment': return 'bg-emerald-50';
      case 'cancellation': return 'bg-rose-50';
      case 'booking': return 'bg-indigo-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Notifications</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Alerts & updates</h1>
          <p className="mt-2 text-sm text-slate-500">Stay on top of enquiries, payments and class changes.</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={18} className="text-slate-900" />
            <p className="text-sm font-bold text-slate-900">Recent Activity</p>
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400">You're all caught up! No new notifications.</div>
            ) : notifications.map((alert) => (
              <div key={alert.id} className="flex gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-5 hover:bg-white transition shadow-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(alert.type)}`}>
                   {getIcon(alert.type)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                  <p className="mt-2 text-[10px] text-slate-400 font-semibold">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
