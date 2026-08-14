"use client";

import { usePoll } from '../../../lib/api';
import { IndianRupee, Wallet, PiggyBank, ArrowDownRight, Clock } from 'lucide-react';

export default function TutorEarningsPage() {
  const { data: dashboard, loading } = usePoll('/api/v1/tutor/dashboard', 15000, null);

  if (loading && !dashboard) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading earnings...</div>;
  }

  const earnings = dashboard?.stats?.earnings || 0;
  // Fallback estimates
  const pendingPayment = Math.floor(earnings * 0.15); 
  const walletBalance = earnings - pendingPayment;

  const balances = [
    { label: 'Total Earnings', value: `₹${earnings.toLocaleString()}`, icon: <IndianRupee size={16} /> },
    { label: 'Wallet Balance', value: `₹${walletBalance.toLocaleString()}`, icon: <Wallet size={16} /> },
    { label: 'Pending Payment', value: `₹${pendingPayment.toLocaleString()}`, icon: <Clock size={16} /> },
  ];

  const transactions = dashboard?.recentPayouts || [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Earnings</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Payment summary</h1>
          <p className="mt-2 text-sm text-slate-500">View your lifetime earnings, current wallet balance, and recent payout history.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {balances.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Recent Transactions</p>
              <p className="text-xs text-slate-500">Your most recent payouts and deductions.</p>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">Latest</span>
          </div>
          <div className="mt-6 space-y-3">
            {transactions.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400">No transactions found.</div>
            ) : transactions.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <ArrowDownRight size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.status === 'Completed' ? 'Class payout' : 'Pending payout'}</p>
                    <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-lg">₹{item.amount}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500'}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
