"use client";

import { usePoll } from '../../../lib/api';
import { Users, UserCheck, UserPlus, UserX, MapPin, BookOpen, Phone, Calendar } from 'lucide-react';

export default function TutorStudentsPage() {
  const { data: students = [], loading } = usePoll('/api/v1/tutor/students', 15000, []);

  const total = students.length;
  const active = students.filter(s => s.status === 'Active').length;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const newStudents = students.filter(s => s.lastBookingDate && new Date(s.lastBookingDate) > thirtyDaysAgo).length;
  const blocked = students.filter(s => s.status === 'Blocked').length;

  const stats = [
    { title: 'All Students', value: total, badge: 'Total', icon: <Users size={16} /> },
    { title: 'Active Students', value: active, badge: 'Active', icon: <UserCheck size={16} /> },
    { title: 'New Students', value: newStudents, badge: 'This Month', icon: <UserPlus size={16} /> },
    { title: 'Blocked Students', value: blocked, badge: 'Blocked', icon: <UserX size={16} /> },
  ];

  if (loading && students.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading students...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Students</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Student management</h1>
          <p className="mt-2 text-sm text-slate-500">View your assigned students, their class history, and current status.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                 <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.title}</p>
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">{item.icon}</div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700 border border-emerald-100">{item.badge}</span>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Assigned Students</p>
              <p className="text-xs text-slate-500">List of students who have booked classes with you.</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-3 font-semibold">Student</th>
                  <th className="py-3 font-semibold">Contact Info</th>
                  <th className="py-3 font-semibold">Class / Grade</th>
                  <th className="py-3 font-semibold">Subject</th>
                  <th className="py-3 font-semibold">Address</th>
                  <th className="py-3 font-semibold">Total Classes</th>
                  <th className="py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                   <tr>
                     <td colSpan="7" className="py-12 text-center">
                       <Users size={36} className="mx-auto text-slate-300 mb-3" />
                       <p className="text-sm font-bold text-slate-600 mb-1">No students assigned yet</p>
                       <p className="text-xs text-slate-400">Students will appear here once admin assigns you to their bookings.</p>
                     </td>
                   </tr>
                ) : students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#056852] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                           {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                         </div>
                         <p className="font-semibold text-slate-900">{student.name}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-xs text-slate-800">{student.email}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10} />{student.mobile || 'N/A'}</p>
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-700">{student.grade || 'N/A'}</td>
                    <td className="py-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><BookOpen size={12} className="text-slate-400" />{student.subjects || 'General'}</span>
                    </td>
                    <td className="py-4 text-xs text-slate-600 max-w-[150px]">
                      <span className="flex items-center gap-1 truncate"><MapPin size={12} className="text-slate-400 shrink-0" />{student.address || 'N/A'}</span>
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-700">{student.totalBookings} classes</td>
                    <td className="py-4 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                         student.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                         {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
