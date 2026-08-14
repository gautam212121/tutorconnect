"use client";

import { usePoll } from '../../../lib/api';
import { Star, AlertCircle, MessageCircle, User } from 'lucide-react';

export default function TutorReviewsPage() {
  const { data: reviews = [], loading } = usePoll('/api/v1/tutor/reviews', 15000, []);

  // Calculate average rating
  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';

  const ratings = [
    { label: 'Average Rating', value: avgRating, icon: <Star size={16} /> },
    { label: 'Reported Reviews', value: reviews.filter(r => r.status === 'Reported').length, icon: <AlertCircle size={16} /> },
    { label: 'Total Reviews', value: reviews.length, icon: <MessageCircle size={16} /> },
  ];

  if (loading && reviews.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading reviews...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Reviews</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Feedback & ratings</h1>
          <p className="mt-2 text-sm text-slate-500">Review student feedback and manage any reported ratings.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ratings.map((item) => (
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
           <p className="text-sm font-bold text-slate-900 mb-6">Recent Reviews</p>
           <div className="mt-6 space-y-4">
             {reviews.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400">No reviews yet.</div>
             ) : reviews.map((r) => (
               <div key={r.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#056852] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {r.studentName ? r.studentName.charAt(0) : <User size={16} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{r.studentName || 'Anonymous Student'}</p>
                        <div className="flex items-center text-amber-500 text-xs">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} size={12} className={i < r.rating ? "fill-amber-500" : "text-slate-300"} />
                          ))}
                        </div>
                      </div>
                   </div>
                   <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                 </div>
                 <p className="text-sm text-slate-600 pl-14">{r.comment || 'No comment provided.'}</p>
               </div>
             ))}
           </div>
        </section>
      </div>
    </main>
  );
}
