"use client";

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BookingModal({ tutor, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ time: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    await fetch(`${API_URL}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student: 'You',
        tutor: tutor.name,
        time: form.time || 'Flexible',
        status: 'Pending',
        message: form.message,
      }),
    });

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Book a demo</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{tutor.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{tutor.headline || tutor.subject || 'Certified tutor'} · ₹{tutor.price || tutor.rate || '0'}/hr</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Close</button>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            Demo request submitted. The tutor will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Demo session</span>
                <span className="font-semibold text-slate-900">₹{tutor.price || tutor.rate || '0'}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Preferred time</label>
              <input
                value={form.time}
                onChange={(event) => setForm({ ...form, time: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="Tomorrow 6:00 PM"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                placeholder="Share your goal and preferred learning style."
              />
            </div>
            <button disabled={loading} className="w-full rounded-full bg-teal-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Submitting...' : 'Confirm demo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
