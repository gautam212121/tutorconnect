import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users, MapPin, Search } from 'lucide-react';
import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function TutorScheduleView({ user }) {
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
      const res = await fetch(`${API}/api/v1/schedules/tutor-schedules`, {
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

  const filteredSchedules = schedules.filter(s => statusFilter === 'All' || s.status === statusFilter);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Student Schedules</h2>
          <p className="text-sm text-slate-500">View class timings requested by students</p>
        </div>
        
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
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
          <p className="text-sm text-slate-500">You don't have any schedules matching this filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchedules.map((schedule, i) => {
            const date = new Date(schedule.date);
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  schedule.status === 'Approved' ? 'bg-emerald-500' :
                  schedule.status === 'Rejected' ? 'bg-red-500' :
                  schedule.status === 'Cancelled' ? 'bg-slate-400' :
                  'bg-amber-400'
                }`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      schedule.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                      schedule.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                      schedule.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {schedule.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-500">{date.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-slate-400" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{schedule.student?.name || 'Student'}</span>
                      <span className="text-[10px] text-slate-500">Class: {schedule.grade || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen size={16} className="text-slate-400" />
                    <span className="text-slate-600">{schedule.selectedSubjects?.join(', ') || schedule.subject}</span>
                  </div>
                  
                  {schedule.adminNotes && (
                    <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
                      <strong>Admin Note:</strong> {schedule.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
