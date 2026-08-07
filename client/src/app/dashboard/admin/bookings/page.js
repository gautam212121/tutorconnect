"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Search, Calendar, Clock, User } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Completed: 'bg-blue-100 text-blue-700',
  Declined: 'bg-rose-100 text-rose-700',
  Cancelled: 'bg-slate-100 text-slate-500',
};

export default function BookingsAdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/bookings`);
      const data = await res.json();
      setBookings(data || []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    await fetch(`${API}/api/v1/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const tabs = [
    { id: 'all', label: 'All', count: bookings.length },
    { id: 'Pending', label: 'Pending', count: bookings.filter(b => b.status === 'Pending').length },
    { id: 'Confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'Confirmed').length },
    { id: 'Completed', label: 'Completed', count: bookings.filter(b => b.status === 'Completed').length },
    { id: 'Declined', label: 'Declined', count: bookings.filter(b => b.status === 'Declined').length },
  ];

  const filtered = bookings.filter(b => {
    const matchTab = selectedTab === 'all' || b.status === selectedTab;
    const matchSearch = !search
      || b.student?.toLowerCase().includes(search.toLowerCase())
      || b.tutor?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Booking Management</h1>
          <p className="text-xs text-slate-500">{bookings.length} total bookings on platform</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Bookings', value: bookings.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending', value: bookings.filter(b => b.status === 'Pending' || !b.status).length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'Confirmed').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'Completed').length, color: 'text-violet-600 bg-violet-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-3 ${s.color.split(' ')[1]} border border-slate-100`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              selectedTab === tab.id ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selectedTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by student or tutor name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:outline-none"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#056852]/10 font-bold text-[#056852]">
                    {booking.student?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {booking.student} → {booking.tutor}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[booking.status] || STATUS_COLORS.Pending}`}>
                        {booking.status || 'Pending'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {booking.time}</span>
                      {booking.message && <span className="text-slate-500">{booking.message}</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">ID: {booking.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStatus(booking.id, 'Confirmed')}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-200 transition"
                  >
                    <CheckCircle2 size={13} /> Confirm
                  </button>
                  <button
                    onClick={() => handleStatus(booking.id, 'Completed')}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-100 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-200 transition"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatus(booking.id, 'Declined')}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-200 transition"
                  >
                    <XCircle size={13} /> Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
