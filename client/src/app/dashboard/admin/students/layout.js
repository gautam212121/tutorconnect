"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentsMasterLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('verifiedtutor-token') : null;
      const r = await fetch(`${API}/api/v1/admin/users?role=student`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await r.json();
      if (r.ok && Array.isArray(data)) {
        setStudents(data.map(u => ({
          id: u._id || u.id,
          name: u.name || 'Unnamed Student',
          email: u.email || '',
          mobile: u.mobile || u.phone || 'N/A',
          grade: u.grade || u.classLevel || 'N/A',
          location: u.address?.city || u.address?.full || u.location || 'India',
          status: u.status || 'active',
          profilePic: u.profilePic,
        })));
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and tab
  const filtered = students.filter(s => {
    const matchTab = selectedTab === 'all' ? true : s.status === selectedTab;
    const matchSearch = !search
      || s.name.toLowerCase().includes(search.toLowerCase())
      || s.email.toLowerCase().includes(search.toLowerCase())
      || String(s.id).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginatedStudents = filtered.slice((page - 1) * limit, page * limit);

  // Stats for tabs
  const activeCount = students.filter(s => s.status === 'active' || s.status === 'verified').length;
  const inactiveCount = students.length - activeCount;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      
      {/* ── LEFT PANE: MASTER LIST ── */}
      <div className="w-[320px] lg:w-[380px] shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50 h-full">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-[#1e293b]">All Students</h1>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter size={16} />
            </button>
            <button onClick={() => router.push('/dashboard/admin/students/add')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#056852] text-white hover:bg-[#045241]">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-[13px] focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-6 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => { setSelectedTab('all'); setPage(1); }}
            className={`pb-3 text-[13px] font-semibold border-b-2 transition-all ${
              selectedTab === 'all' ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => { setSelectedTab('active'); setPage(1); }}
            className={`pb-3 text-[13px] font-semibold border-b-2 transition-all ${
              selectedTab === 'active' ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => { setSelectedTab('inactive'); setPage(1); }}
            className={`pb-3 text-[13px] font-semibold border-b-2 transition-all ${
              selectedTab === 'inactive' ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#056852] border-t-transparent" /></div>
          ) : paginatedStudents.length > 0 ? (
            paginatedStudents.map(s => {
              const isActiveRoute = pathname === `/dashboard/admin/students/${s.id}`;
              const isStudentActive = s.status === 'active' || s.status === 'verified';

              return (
                <Link
                  href={`/dashboard/admin/students/${s.id}`}
                  key={s.id}
                  className={`flex items-center p-3 rounded-2xl border transition-all ${
                    isActiveRoute 
                      ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 overflow-hidden">
                      {s.profilePic ? (
                        <img src={s.profilePic} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        s.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className={`text-[13px] font-bold truncate ${isActiveRoute ? 'text-emerald-800' : 'text-slate-800'}`}>
                      {s.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">Class {s.grade} - ID: {String(s.id).slice(-6).toUpperCase()}</p>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-1.5 ml-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${isStudentActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-bold ${isStudentActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isStudentActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center p-8 text-slate-500 text-sm">No students found.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-center gap-1 shrink-0">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  page === i + 1 ? 'bg-[#056852] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANE: DETAIL VIEW ── */}
      <div className="flex-1 bg-slate-50 overflow-y-auto relative h-full">
        {children}
      </div>
      
    </div>
  );
}
