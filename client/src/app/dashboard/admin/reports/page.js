"use client";

import { useState } from 'react';
import { FileText, BarChart2, Download, Calendar, Users, CreditCard, Star, TrendingUp } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'revenue', label: 'Revenue Report', desc: 'Total earnings, payouts, and commission breakdown', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
  { id: 'users', label: 'User Report', desc: 'New registrations, active users, churn analysis', icon: Users, color: 'bg-blue-50 text-blue-700' },
  { id: 'bookings', label: 'Bookings Report', desc: 'Booking trends, cancellation rates, popular slots', icon: Calendar, color: 'bg-violet-50 text-violet-700' },
  { id: 'reviews', label: 'Reviews Report', desc: 'Rating distribution and tutor performance', icon: Star, color: 'bg-amber-50 text-amber-700' },
  { id: 'analytics', label: 'Platform Analytics', desc: 'Traffic sources, conversions, and engagement', icon: BarChart2, color: 'bg-rose-50 text-rose-700' },
  { id: 'gst', label: 'GST Report', desc: 'Tax-compliant reports for government filing', icon: FileText, color: 'bg-slate-50 text-slate-700' },
];

const GENERATED = [
  { name: 'Revenue Report – May 2026', date: '18 May 2026', size: '2.4 MB', format: 'PDF' },
  { name: 'User Report – Q1 2026', date: '1 Apr 2026', size: '1.8 MB', format: 'Excel' },
  { name: 'GST Filing – Apr 2026', date: '30 Apr 2026', size: '0.9 MB', format: 'PDF' },
  { name: 'Bookings Summary – Mar 2026', date: '31 Mar 2026', size: '1.2 MB', format: 'CSV' },
];

export default function ReportsAdminPage() {
  const [generating, setGenerating] = useState(null);
  const [done, setDone] = useState([]);
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-18');
  const [format, setFormat] = useState('pdf');

  const generate = async (id) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(null);
    setDone(prev => [...prev, id]);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reports & Exports</h1>
        <p className="text-xs text-slate-500">Generate detailed platform reports and export data</p>
      </div>

      {/* Date Range + Format */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 mb-1 block">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#056852] focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 mb-1 block">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#056852] focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 mb-1 block">Format</label>
          <div className="flex gap-1.5">
            {['pdf', 'excel', 'csv'].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${format === f ? 'bg-[#056852] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map(r => {
          const Icon = r.icon;
          const isGen = generating === r.id;
          const isDone = done.includes(r.id);
          return (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${r.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-bold text-slate-900">{r.label}</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">{r.desc}</p>
              <button
                onClick={() => generate(r.id)}
                disabled={isGen}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
                  isDone ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                  'bg-[#056852] text-white hover:bg-[#045241]'
                } disabled:opacity-60`}
              >
                {isGen ? (
                  <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating...</>
                ) : isDone ? (
                  <><Download size={13} /> Download Report</>
                ) : (
                  <><TrendingUp size={13} /> Generate Report</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Generated Reports */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900 mb-3">Previously Generated Reports</p>
        <div className="space-y-2.5">
          {GENERATED.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200">
                  <FileText size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{r.name}</p>
                  <p className="text-[10px] text-slate-400">{r.date} · {r.size} · {r.format}</p>
                </div>
              </div>
              <button className="flex items-center gap-1.5 rounded-xl bg-[#056852]/10 px-3 py-1.5 text-[11px] font-bold text-[#056852] hover:bg-[#056852]/20 transition">
                <Download size={13} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
