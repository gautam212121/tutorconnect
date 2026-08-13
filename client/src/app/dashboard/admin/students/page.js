"use client";

import React from 'react';
import { Users } from 'lucide-react';

export default function StudentsEmptyState() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50">
      <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Users size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Student Details</h2>
      <p className="text-slate-500 max-w-sm">
        Select a student from the list on the left to view their complete profile, bookings, schedules, and payment history.
      </p>
    </div>
  );
}
