"use client";

import { useState } from 'react';
import { Star, Flag, Reply, Trash2, ThumbsUp } from 'lucide-react';

const REVIEWS = [];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
      ))}
    </div>
  );
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState(REVIEWS);
  const [selectedTab, setSelectedTab] = useState('all');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleDelete = (id) => setReviews(prev => prev.filter(r => r.id !== id));
  const handleReport = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'reported' } : r));
  const handleApprove = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'published' } : r));

  const tabs = [
    { id: 'all', label: 'All Reviews', count: reviews.length },
    { id: 'published', label: 'Published', count: reviews.filter(r => r.status === 'published').length },
    { id: 'reported', label: 'Reported', count: reviews.filter(r => r.status === 'reported').length },
  ];

  const filtered = selectedTab === 'all' ? reviews : reviews.filter(r => r.status === selectedTab);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reviews & Ratings</h1>
        <p className="text-xs text-slate-500">Manage platform reviews and handle reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Reviews', value: reviews.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Avg Rating', value: avgRating, color: 'text-amber-600 bg-amber-50' },
          { label: 'Published', value: reviews.filter(r => r.status === 'published').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Reported', value: reviews.filter(r => r.status === 'reported').length, color: 'text-rose-600 bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-3 ${s.color.split(' ')[1]} border border-slate-100`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rating Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900 mb-3">Rating Distribution</p>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = reviews.filter(r => r.rating === rating).length;
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-xs font-semibold text-slate-700">{rating}</span>
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-slate-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
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

      {/* Reviews */}
      <div className="space-y-3">
        {filtered.map(review => (
          <div key={review.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${review.status === 'reported' ? 'border-rose-200' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700">
                  {review.student.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900">{review.student}</p>
                    <span className="text-slate-400 text-[11px]">→</span>
                    <p className="text-xs font-semibold text-[#056852]">{review.tutor}</p>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{review.subject}</span>
                    {review.status === 'reported' && (
                      <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">⚠ Reported</span>
                    )}
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{review.text}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{review.date}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={11} /> {review.likes}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {review.status === 'reported' && (
                  <button onClick={() => handleApprove(review.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition" title="Approve">
                    ✓
                  </button>
                )}
                <button
                  onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition" title="Reply"
                >
                  <Reply size={13} />
                </button>
                {review.status !== 'reported' && (
                  <button onClick={() => handleReport(review.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition" title="Report">
                    <Flag size={13} />
                  </button>
                )}
                <button onClick={() => handleDelete(review.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {replyingTo === review.id && (
              <div className="mt-3 ml-12">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write your reply as admin..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs focus:border-[#056852] focus:outline-none resize-none"
                />
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="rounded-xl bg-[#056852] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#045241] transition">Send Reply</button>
                  <button onClick={() => setReplyingTo(null)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
