"use client";

import { useState } from 'react';
import { TrendingUp, ArrowUpRight, CreditCard, IndianRupee, Download, Filter } from 'lucide-react';

function LineAreaChart({ data, color = '#056852', gradId, height = 80 }) {
  if (!data || data.length < 2) return null;
  const W = 400, H = height, P = 6;
  const max = Math.max(...data);
  const pts = data.map((v, i) => [P + (i / (data.length - 1)) * (W - P * 2), P + ((max - v) / (max || 1)) * (H - P * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const TRANSACTIONS = [];

const TYPE_COLORS = {
  booking: 'bg-emerald-100 text-emerald-700',
  payout: 'bg-blue-100 text-blue-700',
  refund: 'bg-rose-100 text-rose-700',
  commission: 'bg-amber-100 text-amber-700',
};
const STATUS_COLORS = {
  paid: 'text-emerald-600',
  pending: 'text-amber-600',
  processed: 'text-blue-600',
  refunded: 'text-rose-600',
};

export default function PaymentsAdminPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState('This Month');

  const revenueData = [150000, 230000, 180000, 340000, 245000, 290000, 320000];
  const totalRevenue = revenueData.reduce((a, b) => a + b, 0);

  const stats = [
    { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, change: '+28.6%', color: 'text-emerald-600 bg-emerald-50', icon: TrendingUp },
    { label: 'Tutor Payouts', value: '₹8.24L', change: '+18.3%', color: 'text-blue-600 bg-blue-50', icon: CreditCard },
    { label: 'Commission', value: '₹2.48L', change: '+32.1%', color: 'text-amber-600 bg-amber-50', icon: IndianRupee },
    { label: 'Refunds', value: '₹12,400', change: '-5.2%', color: 'text-rose-600 bg-rose-50', icon: ArrowUpRight },
  ];

  const tabs = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'commission', label: 'Commission' },
    { id: 'coupons', label: 'Coupons' },
  ];

  const coupons = [
    { code: 'TUTOR50', discount: '50%', type: 'Percentage', used: 142, maxUses: 500, status: 'active', expires: '31 Dec 2026' },
    { code: 'FIRST200', discount: '₹200', type: 'Flat', used: 890, maxUses: 1000, status: 'active', expires: '30 Jun 2026' },
    { code: 'SUMMER30', discount: '30%', type: 'Percentage', used: 500, maxUses: 500, status: 'expired', expires: '31 Jul 2026' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payment & Revenue</h1>
          <p className="text-xs text-slate-500">Complete financial overview of the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">{s.value}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color.split(' ')[1]}`}>
                  <Icon size={18} className={s.color.split(' ')[0]} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <ArrowUpRight size={13} className="text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-600">{s.change}</span>
                <span className="text-[11px] text-slate-400">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-900">Revenue Overview — {dateRange}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col justify-between text-[10px] text-slate-400 py-1 w-8 text-right">
            <span>₹4L</span><span>₹3L</span><span>₹2L</span><span>₹1L</span><span>₹0</span>
          </div>
          <div className="flex-1">
            <LineAreaChart data={revenueData} color="#056852" gradId="paymentsRevGrad" height={120} />
            <div className="flex justify-between mt-1">
              {['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18'].map((l, i) => (
                <span key={i} className="text-[9px] text-slate-400">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${activeTab === tab.id ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'coupons' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">Coupons & Promo Codes</p>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#056852] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#045241] transition">
              + Create Coupon
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Used</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">{c.code}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{c.discount}</td>
                    <td className="px-4 py-3 text-slate-600">{c.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-[#056852]" style={{ width: `${(c.used / c.maxUses) * 100}%` }} />
                        </div>
                        <span className="text-slate-500">{c.used}/{c.maxUses}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.expires}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">Transaction History</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TRANSACTIONS.filter(t => activeTab === 'revenue' ? true : t.type === activeTab.replace('s', '')).map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{t.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {t.student ? `${t.student} → ${t.tutor}` : `Payout to ${t.tutor}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${TYPE_COLORS[t.type]}`}>{t.type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{t.date}</td>
                    <td className="px-4 py-3 font-bold capitalize">
                      <span className={STATUS_COLORS[t.status]}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
