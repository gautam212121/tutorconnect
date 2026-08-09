"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';

export default function AdminStats() {
  const [metrics, setMetrics] = useState([
    { label: 'New signups', value: '0' },
    { label: 'Demo requests', value: '0' },
    { label: 'Revenue this month', value: '₹0' },
  ]);

  useEffect(() => {
    Promise.all([
      fetchApi('/api/v1/users'),
      fetchApi('/api/v1/admin/bookings'),
    ]).then(([users, bookings]) => {
      setMetrics([
        { label: 'New signups', value: `${(users || []).length}` },
        { label: 'Demo requests', value: `${(bookings || []).length}` },
        { label: 'Revenue this month', value: '₹3.2L' },
      ]);
    }).catch((err) => {
      console.error('Error fetching admin stats:', err);
      setMetrics([
        { label: 'New signups', value: '0' },
        { label: 'Demo requests', value: '0' },
        { label: 'Revenue this month', value: '₹0' },
      ]);
    });
  }, []);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Admin overview</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">{metric.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
