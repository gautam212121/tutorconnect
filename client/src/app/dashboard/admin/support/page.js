"use client";

import { useState } from 'react';
import { TicketCheck, Clock, CheckCircle2, MessageSquare, Search, AlertTriangle, User, ArrowRight } from 'lucide-react';

const TICKETS = [];

const PRIORITY_STYLES = {
  urgent: 'bg-rose-100 text-rose-700 border border-rose-200',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-500',
};

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

const CATEGORY_COLORS = {
  Payment: 'bg-green-50 text-green-700',
  Technical: 'bg-blue-50 text-blue-700',
  General: 'bg-slate-50 text-slate-600',
  Account: 'bg-violet-50 text-violet-700',
  Complaint: 'bg-rose-50 text-rose-700',
};

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState(TICKETS);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');

  const tabs = [
    { id: 'all', label: 'All', count: tickets.length },
    { id: 'open', label: 'Open', count: tickets.filter(t => t.status === 'open').length },
    { id: 'in-progress', label: 'In Progress', count: tickets.filter(t => t.status === 'in-progress').length },
    { id: 'resolved', label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length },
  ];

  const handleResolve = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
    setSelected(null);
  };

  const handleProgress = (id) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'in-progress' } : t));
  };

  const filtered = tickets.filter(t => {
    const matchTab = selectedTab === 'all' || t.status === selectedTab;
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const selectedTicket = tickets.find(t => t.id === selected);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Support Center</h1>
          <p className="text-xs text-slate-500">Manage user tickets and complaints</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md">
          + New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: 'text-blue-600 bg-blue-50', icon: '🔓' },
          { label: 'Urgent', value: tickets.filter(t => t.priority === 'urgent').length, color: 'text-rose-600 bg-rose-50', icon: '🚨' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: 'text-amber-600 bg-amber-50', icon: '⏳' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600 bg-emerald-50', icon: '✅' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-3 ${s.color.split(' ')[1]} border border-slate-100`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className={`text-xl font-extrabold ${s.color.split(' ')[0]}`}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`grid gap-4 ${selectedTicket ? 'lg:grid-cols-5' : ''}`}>
        {/* Ticket List */}
        <div className={selectedTicket ? 'lg:col-span-3' : ''}>
          {/* Tabs + Search */}
          <div className="flex gap-1 border-b border-slate-200 mb-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${selectedTab === tab.id ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500'}`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${selectedTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:outline-none" />
          </div>

          <div className="space-y-2.5">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setSelected(selected === t.id ? null : t.id)}
                className={`cursor-pointer rounded-2xl border bg-white p-3.5 shadow-sm hover:shadow-md transition ${selected === t.id ? 'border-[#056852] ring-2 ring-[#056852]/10' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10px] text-slate-400">#{t.id}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold capitalize ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[t.category]}`}>{t.category}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <User size={10} /> {t.user} ({t.type})
                      <span>·</span>
                      <Clock size={10} /> {t.date}
                      {t.messages > 0 && <><span>·</span><MessageSquare size={10} /> {t.messages}</>}
                    </div>
                  </div>
                  <ArrowRight size={16} className={`shrink-0 text-slate-400 transition ${selected === t.id ? 'rotate-90 text-[#056852]' : ''}`} />
                </div>
                {selected === t.id && t.status !== 'resolved' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={(e) => { e.stopPropagation(); handleProgress(t.id); }}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-200 transition">
                      <Clock size={12} /> Take Over
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleResolve(t.id); }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-200 transition">
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reply Panel */}
        {selectedTicket && (
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sticky top-4">
              <p className="text-sm font-bold text-slate-900 mb-1">{selectedTicket.subject}</p>
              <p className="text-[11px] text-slate-500 mb-3">Opened by {selectedTicket.user} on {selectedTicket.date}</p>

              <div className="space-y-2 mb-3">
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">{selectedTicket.user}:</span><br />
                  {selectedTicket.subject}
                </div>
                {selectedTicket.messages > 0 && (
                  <div className="rounded-xl bg-[#056852]/5 border border-[#056852]/20 p-3 text-xs text-slate-700 text-right">
                    <span className="font-semibold text-[#056852]">Admin:</span><br />
                    We're looking into this issue and will respond shortly.
                  </div>
                )}
              </div>

              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs focus:border-[#056852] focus:outline-none resize-none mb-2"
              />
              <button
                onClick={() => { setReply(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#056852] py-2.5 text-xs font-bold text-white hover:bg-[#045241] transition"
              >
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
