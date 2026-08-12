"use client";

import { useState, useEffect } from 'react';
import { Search, Eye, Ban, Trash2, Shield, Award } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

const MOCK_STUDENTS = [];

const mapUserToStudent = (u) => ({
  id: u._id || u.id,
  name: u.name || 'Unnamed Student',
  email: u.email || '',
  grade: u.grade || 'N/A',
  location: u.address?.city || u.address?.full || 'India',
  bookings: 0,
  spent: '₹0',
  status: u.status || 'active',
  joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'Recently',
  premium: false,
});

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  banned: 'bg-rose-100 text-rose-700',
};

export default function StudentsAdminPage() {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [apiStudents, setApiStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verifiedtutor-token') : null;

    fetch(`${API}/api/v1/admin/users?role=student`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.message || 'Failed to load students');
        if (Array.isArray(data)) {
          setApiStudents(data.map(mapUserToStudent));
        } else {
          setApiStudents([]);
        }
      })
      .catch(() => {
        setApiStudents([]);
      });
  }, []);

  const allStudents = [...students, ...apiStudents.filter(a => !students.find(s => s.email === a.email))];

  const tabs = [
    { id: 'all', label: 'All Students', count: allStudents.length },
    { id: 'active', label: 'Active', count: allStudents.filter(s => s.status === 'active').length },
    { id: 'premium', label: 'Premium', count: allStudents.filter(s => s.premium).length },
    { id: 'banned', label: 'Banned', count: allStudents.filter(s => s.status === 'banned').length },
  ];

  const handleAction = (id, action) => {
    if (action === 'ban') {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'banned' } : s));
    } else if (action === 'unban') {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    } else if (action === 'delete') {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const filtered = allStudents.filter(s => {
    const matchTab = selectedTab === 'all'
      ? true
      : selectedTab === 'premium'
      ? s.premium
      : s.status === selectedTab;
    const matchSearch = !search
      || s.name.toLowerCase().includes(search.toLowerCase())
      || s.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Management</h1>
          <p className="text-xs text-slate-500">{allStudents.length} total students registered</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md">
          + Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Students', value: allStudents.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active', value: allStudents.filter(s => s.status === 'active').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Premium', value: allStudents.filter(s => s.premium).length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Banned', value: allStudents.filter(s => s.status === 'banned').length, color: 'text-rose-600 bg-rose-50' },
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
          placeholder="Search students..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:outline-none focus:ring-2 focus:ring-[#056852]/10"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Grade/Level</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Bookings</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Spent</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[11px] font-bold text-teal-700">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">{s.name}</p>
                          {s.premium && <Award size={12} className="text-amber-500" />}
                        </div>
                        <p className="text-[10px] text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{s.grade}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500">{s.location}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-semibold text-slate-700">{s.bookings}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-semibold text-emerald-700">{s.spent}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-slate-400">{s.joined}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusColors[s.status] || statusColors.active}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition" title="View">
                        <Eye size={14} />
                      </button>
                      {s.status !== 'banned' ? (
                        <button onClick={() => handleAction(s.id, 'ban')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition" title="Ban">
                          <Ban size={14} />
                        </button>
                      ) : (
                        <button onClick={() => handleAction(s.id, 'unban')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition" title="Unban">
                          <Shield size={14} />
                        </button>
                      )}
                      <button onClick={() => handleAction(s.id, 'delete')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
