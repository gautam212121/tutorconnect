"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users, Search, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchSchedules();

    const token = localStorage.getItem('verifiedtutor-token');
    const socket = io(API, { auth: { token } });

    socket.on('scheduleCreated', (newSchedule) => {
      setSchedules((prev) => [newSchedule, ...prev]);
    });
    
    socket.on('scheduleApproved', (updated) => updateScheduleInList(updated));
    socket.on('scheduleRejected', (updated) => updateScheduleInList(updated));
    socket.on('scheduleCancelled', (updated) => updateScheduleInList(updated));
    socket.on('scheduleUpdated', (updated) => updateScheduleInList(updated));

    return () => socket.disconnect();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleInList = (updated) => {
    setSchedules((prev) => prev.map(s => s._id === updated._id || s.id === updated.id ? updated : s));
  };

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const adminNotes = window.prompt(`Enter any notes for ${action} (optional):`);
      if (adminNotes === null) return; // user cancelled prompt

      const res = await fetch(`${API}/api/v1/schedules/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || `Failed to ${action} schedule`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const filteredSchedules = schedules.filter(s => statusFilter === 'All' || s.status === statusFilter);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Schedule Management</h2>
          <p className="text-sm text-slate-500">Approve, reject, or modify class schedules</p>
        </div>
        
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                statusFilter === status 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No schedules found</h3>
          <p className="text-sm text-slate-500">No schedules match the selected filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Tutor</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((schedule, i) => {
                const date = new Date(schedule.date);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-xs text-slate-500">{schedule.startTime} - {schedule.endTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{schedule.student?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{schedule.grade || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{schedule.tutor?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">{schedule.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        schedule.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        schedule.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                        schedule.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {schedule.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleAction(schedule._id || schedule.id, 'approve')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(schedule._id || schedule.id, 'reject')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
