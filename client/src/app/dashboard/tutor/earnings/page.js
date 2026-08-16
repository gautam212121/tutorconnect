"use client";

import { usePoll } from '../../../lib/api';
import { IndianRupee, Wallet, PiggyBank, ArrowDownRight, Clock } from 'lucide-react';

export default function TutorEarningsPage() {
  const { data: dashboard, loading } = usePoll('/api/v1/tutor/dashboard', 15000, null);

  if (loading && !dashboard) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading earnings...</div>;
  }

  const earnings = dashboard?.stats?.totalEarnings || 0;
  const walletBalance = dashboard?.stats?.walletBalance || 0;
  const transactions = dashboard?.recentPayouts || [];
  
  const pendingPayment = transactions.filter(t => t.status !== 'Completed').reduce((sum, t) => sum + (t.tutorShare || 0), 0);

  const balances = [
    { label: 'Total Earnings', value: `₹${earnings.toLocaleString()}`, icon: <IndianRupee size={16} /> },
    { label: 'Wallet Balance', value: `₹${walletBalance.toLocaleString()}`, icon: <Wallet size={16} /> },
    { label: 'Pending Payment', value: `₹${pendingPayment.toLocaleString()}`, icon: <Clock size={16} /> },
  ];

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-bold text-slate-900">Earnings & Payouts Ledger</p>
              <p className="text-xs text-slate-500">Lifetime earnings history, platform distributions, and payout statuses.</p>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">Real-time</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-medium text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4 text-right">Gross Amount</th>
                  <th className="p-4 text-right">Tutor Share</th>
                  <th className="p-4 text-right">Admin commission</th>
                  <th className="p-4 text-center">Payment Status</th>
                  <th className="p-4 text-center">Payout Status</th>
                  <th className="p-4 text-right">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold">
                      No earning records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-bold text-slate-800">{item.studentName}</td>
                      <td className="p-4">{item.subject}</td>
                      <td className="p-4 text-right text-slate-500">₹{item.grossAmount}</td>
                      <td className="p-4 text-right font-extrabold text-slate-900">₹{item.tutorShare}</td>
                      <td className="p-4 text-right text-rose-500">₹{item.adminShare}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.paymentStatus === 'Paid' || item.paymentStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed'
                            ? 'bg-teal-50 text-teal-700 border border-teal-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.status === 'Completed' ? 'Disbursed' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-500 font-semibold">
                        {new Date(item.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
