import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users, MapPin, CheckCircle, XCircle, ArrowRight, X } from 'lucide-react';
import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function ScheduleView({ user, assignedTutors = [] }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tutorId: '',
    date: '',
    startTime: '',
    endTime: '',
    subject: '',
  });

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchSchedules();

    // Setup Socket.IO connection
    const token = localStorage.getItem('verifiedtutor-token');
    const newSocket = io(API, { auth: { token } });
    setSocket(newSocket);

    newSocket.on('scheduleApproved', (updated) => updateScheduleInList(updated));
    newSocket.on('scheduleRejected', (updated) => updateScheduleInList(updated));
    newSocket.on('scheduleCancelled', (updated) => updateScheduleInList(updated));
    newSocket.on('scheduleUpdated', (updated) => updateScheduleInList(updated));

    return () => newSocket.disconnect();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/schedules/my-schedules`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      // Find selected tutor info for extra data if needed
      const tutor = assignedTutors.find(t => t.tutorId === formData.tutorId);
      
      const res = await fetch(`${API}/api/v1/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tutorId: formData.tutorId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          subject: formData.subject || (tutor ? tutor.subject : 'General'),
          bookingId: tutor?.bookingId,
        })
      });

      if (res.ok) {
        const newSchedule = await res.json();
        setSchedules([newSchedule, ...schedules]);
        setShowModal(false);
        setFormData({ tutorId: '', date: '', startTime: '', endTime: '', subject: '' });
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create schedule');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading schedules...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Schedules</h2>
          <p className="text-sm text-slate-500">Manage your class timings and requests</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition"
        >
          + Request Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No schedules yet</h3>
          <p className="text-sm text-slate-500 mb-4">Request a preferred time with your assigned tutors.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition"
          >
            Create your first schedule
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule, i) => {
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
                    <span className="font-semibold text-slate-700">{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-slate-400" />
                    <span className="text-slate-600">{schedule.tutor?.name || 'Tutor'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen size={16} className="text-slate-400" />
                    <span className="text-slate-600">{schedule.subject}</span>
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

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Request Schedule</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tutor</label>
                <select 
                  required
                  value={formData.tutorId}
                  onChange={e => setFormData({...formData, tutorId: e.target.value, subject: assignedTutors.find(t => t.tutorId === e.target.value)?.subject || ''})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Tutor --</option>
                  {assignedTutors.map(t => (
                    <option key={t.tutorId} value={t.tutorId}>{t.tutorName} - {t.subject}</option>
                  ))}
                </select>
                {assignedTutors.length === 0 && <p className="text-[10px] text-amber-600 mt-1">You don't have any assigned tutors yet.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input 
                    type="time" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input 
                    type="time" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!formData.tutorId}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
