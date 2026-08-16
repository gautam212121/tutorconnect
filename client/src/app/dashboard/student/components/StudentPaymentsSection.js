import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldAlert, CheckCircle2, RefreshCw, IndianRupee } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentPaymentsSection() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Loading payment transaction history...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Billing & Payments</h2>
          <p className="text-sm text-slate-500">View your transaction logs and payment history</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Tutor</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-semibold">
                    <IndianRupee size={32} className="mx-auto mb-2 text-slate-300" />
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isCompleted = p.status === 'Completed' || p.status === 'Paid';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono text-[10px] text-slate-500">
                        {p.razorpayPaymentId || `TXN-${p.id}`}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{p.tutorName}</td>
                      <td className="p-4">{p.subject}</td>
                      <td className="p-4 text-slate-500">{p.method || 'Razorpay'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={11} /> : <ShieldAlert size={11} />}
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-900">
                        ₹{Number(p.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right text-slate-500">
                        {p.date}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
