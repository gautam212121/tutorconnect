"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';

export default function BookingCard() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    fetchApi('/api/v1/bookings')
      .then((data) => setBooking((Array.isArray(data) && data[0]) || null))
      .catch(() => setBooking(null));
  }, []);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Upcoming lesson</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{booking ? `${booking.tutor} demo` : 'Demo request pending'}</h3>
          <p className="mt-2 text-sm text-slate-500">{booking ? `${booking.time} · ${booking.status}` : 'Book a session to get started'}</p>
        </div>
        <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">{booking ? booking.status : 'Pending'}</div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {booking ? `Your latest request for ${booking.tutor} is now ${booking.status.toLowerCase()}.` : 'No booking yet.'}
      </div>
    </div>
  );
}
