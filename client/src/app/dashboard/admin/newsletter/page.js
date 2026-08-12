"use client";

import { useState, useEffect } from 'react';
import { Search, Mail, Calendar, Trash2, ArrowUpDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verifiedtutor-token') : null;

    fetch(`${API}/api/v1/admin/newsletter`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.message || 'Failed to load subscribers');
        if (Array.isArray(data)) {
          setSubscribers(data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredSubs = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Newsletter Subscribers</h1>
          <p className="text-xs text-slate-500 mt-1">Manage users who subscribed to get tips, updates and learning strategies.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pb-6">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search subscribers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Total Subscribed: {filteredSubs.length}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#056852] border-t-transparent" />
          </div>
        ) : filteredSubs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Subscribed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredSubs.map((sub) => (
                  <tr key={sub._id || sub.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Mail size={14} />
                        </div>
                        <span className="text-slate-900">{sub.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-normal text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(sub.subscribedAt || sub.joined).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            No subscribers found.
          </div>
        )}
      </div>
    </div>
  );
}
