import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, RefreshCw, MailOpen, Calendar } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentNotificationsSection() {
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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Loading notifications...
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <p className="text-sm text-slate-500">Stay updated on your class bookings and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold text-emerald-700 rounded-xl transition border border-emerald-100/60"
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 rounded-xl transition"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 font-semibold">
            <BellOff size={36} className="mx-auto text-slate-300 mb-2" />
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkSingleRead(n.id)}
              className={`p-4 flex gap-4 items-start transition cursor-pointer hover:bg-slate-50/50 ${
                !n.read ? 'bg-emerald-50/20 border-l-4 border-[#056852]' : ''
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${!n.read ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                  <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
