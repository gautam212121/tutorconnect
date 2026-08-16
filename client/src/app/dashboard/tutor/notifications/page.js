"use client";

import { useState, useEffect } from 'react';
import { Bell, CreditCard, CalendarX, UserPlus, Info, CheckCheck, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function TutorNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/notifications/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  if (loading && notifications.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Notifications</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Alerts & updates</h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">Stay on top of enquiries, payments and class changes.</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 px-4 py-2 rounded-xl transition border border-emerald-100/60"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 px-4 py-2 rounded-xl transition"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell size={18} className="text-slate-900" />
            <p className="text-sm font-bold text-slate-900">Recent Activity {unreadCount > 0 && `(${unreadCount} unread)`}</p>
          </div>
          
          <div className="space-y-4">
            {notifications.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400 font-semibold">You&apos;re all caught up! No new notifications.</div>
            ) : notifications.map((alert) => (
              <div
                key={alert.id}
                onClick={() => !alert.read && handleMarkSingleRead(alert.id)}
                className={`flex gap-4 rounded-3xl border p-5 transition shadow-xs cursor-pointer ${
                  !alert.read
                    ? 'bg-emerald-50/20 border-l-4 border-[#056852] hover:bg-emerald-50/40'
                    : 'border-slate-100 bg-slate-50 hover:bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(alert.type)}`}>
                   {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className={`font-semibold text-sm ${!alert.read ? 'text-slate-900' : 'text-slate-700'}`}>{alert.title}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
