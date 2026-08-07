"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';

export default function BookingHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchApi('/api/v1/bookings')
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, []);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Booking history</h2>
      <div className="mt-4 space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{entry.student} → {entry.tutor}</div>
              <div className="text-sm text-slate-500">{entry.time}</div>
              {entry.message ? <div className="mt-1 text-sm text-slate-600">{entry.message}</div> : null}
            </div>
            <div className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">{entry.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
