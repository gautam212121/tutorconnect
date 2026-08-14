"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, MessageSquare, MoreHorizontal, User, 
  MapPin, Phone, Mail, Calendar, BookOpen, Clock, 
  CreditCard, CheckCircle, XCircle 
} from 'lucide-react';
import { adminApi } from '../../../../../lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id;
  
  const [student, setStudent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assignedTutors, setAssignedTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
      fetchSchedules();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/users/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setStudent(data.user);
        setBookings(data.bookings || []);
        setAssignedTutors(data.assignedTutors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const studentSchedules = data.filter(s => 
          (s.student?._id === studentId || s.student?.id === studentId || s.student === studentId)
        );
        setSchedules(studentSchedules);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-slate-50">
        <div className="h-16 w-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-4">
          <XCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Student not found</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          The student profile you are looking for does not exist or has been removed.
        </p>
        <button onClick={() => router.push('/dashboard/admin/students')} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">
          Return to Students
        </button>
      </div>
    );
  }

  // --- Derived Statistics ---
  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'Active' || b.status === 'Confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'Completed').length;
  
  // Calculate payments and subjects based on bookings
  let totalPayments = 0;
  let dueAmount = 0;
  let totalSubjects = 0;
  let totalHours = 0;
  
  // Aggregate unique subjects
  const subjectsSet = new Set();
  const selectedSubjectsList = [];

  bookings.forEach(b => {
    if (b.subject) {
      subjectsSet.add(b.subject);
      selectedSubjectsList.push({
        name: b.subject,
        frequency: '1 hr / day',
        rate: b.amount ? `₹${b.amount} / hr` : '₹500 / hr'
      });
      totalSubjects++;
    }
    // Assuming b.amount is total payment for simplicity, normally there's a payment schema
    totalPayments += b.amount || 0;
  });

  // Schedule aggregation
  const fixedSchedule = schedules.filter(s => s.status === 'Approved');
  
  // Real assigned tutor
  const assignedTutor = assignedTutors.length > 0 ? assignedTutors[0] : null;
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2">
        <Link href="/dashboard/admin" className="hover:text-emerald-600 transition">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/admin/students" className="hover:text-emerald-600 transition">Students</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{student.name}</span>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 shadow-sm">
        {/* Profile Image & Basic Info */}
        <div className="flex gap-6 md:w-1/3">
          <div className="h-28 w-28 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-4xl font-bold text-emerald-700 shadow-inner overflow-hidden border-4 border-white shadow-md">
            {student.profilePic ? (
              <img src={student.profilePic} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              student.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${student.status === 'verified' || student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {student.status === 'verified' ? 'Active Student' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 mt-1">Class {student.grade || student.classLevel || 'N/A'} • Student ID: {String(student._id || student.id).slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Contact & Parent Info */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Phone</p>
            <p className="font-semibold text-emerald-700">{student.mobile || '+91 N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Address</p>
            <p className="font-semibold text-slate-800">{student.address?.full || student.address?.city || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Email</p>
            <p className="font-semibold text-slate-800">{student.email}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Parent / Guardian</p>
            <p className="font-semibold text-slate-800">{student.parentName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Date of Birth</p>
            <p className="font-semibold text-slate-800">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Parent Phone</p>
            <p className="font-semibold text-slate-800">{student.parentPhone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Gender</p>
            <p className="font-semibold text-slate-800">{student.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Joined On</p>
            <p className="font-semibold text-slate-800">{new Date(student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 shrink-0 md:w-36">
          <button onClick={() => { setEditForm(student); setIsEditing(true); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-emerald-600 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 transition shadow-sm">
            <Edit size={14} /> Edit Student
          </button>
          <button onClick={async () => {
            const newStatus = (student.status === 'active' || student.status === 'verified') ? 'inactive' : 'active';
            try {
              const updated = await adminApi.updateUser(student._id || student.id, { status: newStatus });
              if (updated) setStudent({ ...student, ...updated });
            } catch (err) {
              alert('Failed to update status');
            }
          }} className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg text-xs font-bold transition shadow-sm ${
            (student.status === 'active' || student.status === 'verified') 
            ? 'border-amber-500 text-amber-600 hover:bg-amber-50' 
            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'
          }`}>
            {(student.status === 'active' || student.status === 'verified') ? <XCircle size={14} /> : <CheckCircle size={14} />} 
            {(student.status === 'active' || student.status === 'verified') ? 'Deactivate' : 'Activate'}
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-sm">
            <MessageSquare size={14} /> Message
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition shadow-sm">
            <MoreHorizontal size={14} /> More
          </button>
        </div>
      </div>

      {/* ── METRICS & SUMMARY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Student Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-6">
            <User size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Student Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Total Bookings</p>
              <p className="text-xl font-bold text-emerald-700">{bookings.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Active Bookings</p>
              <p className="text-xl font-bold text-emerald-700">{activeBookings}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Total Subjects</p>
              <p className="text-xl font-bold text-emerald-700">{subjectsSet.size || totalSubjects}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Total Payments</p>
              <p className="text-xl font-bold text-emerald-700">₹{totalPayments.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Completed</p>
              <p className="text-xl font-bold text-slate-800">{completedBookings}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">Due Amount</p>
              <p className="text-xl font-bold text-emerald-700">₹{dueAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Selected Subjects Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-0 shadow-sm lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Selected Subjects</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Frequency</th>
                  <th className="px-5 py-3 font-semibold text-right">Hourly Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSubjectsList.length > 0 ? selectedSubjectsList.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-semibold text-slate-800">{sub.name}</td>
                    <td className="px-5 py-3 text-slate-600">{sub.frequency}</td>
                    <td className="px-5 py-3 text-slate-800 font-semibold text-right">{sub.rate}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-5 py-6 text-center text-slate-400">No subjects selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Total Hours / Week</span>
            <span className="text-sm font-bold text-slate-900">{totalSubjects > 0 ? totalSubjects * 3 : 0} Hours</span>
          </div>
        </div>

        {/* Schedule & Timing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Schedule & Timing</h3>
          </div>

          <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg mb-6 inline-block w-max">
            Fixed Schedule by Student
          </div>

          <div className="space-y-4 mb-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600 font-semibold">Days</span>
              <span className="text-sm text-slate-900 font-bold">{fixedSchedule.length > 0 ? fixedSchedule[0].days?.join(', ') || 'Mon, Wed, Fri' : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600 font-semibold">Start Time</span>
              <span className="text-sm text-slate-900 font-bold">{fixedSchedule.length > 0 ? fixedSchedule[0].startTime : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600 font-semibold">End Time</span>
              <span className="text-sm text-slate-900 font-bold">{fixedSchedule.length > 0 ? fixedSchedule[0].endTime : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm text-slate-600 font-semibold">Total Hours / Week</span>
              <span className="text-sm text-slate-900 font-bold">{fixedSchedule.length > 0 ? '6 Hours' : '0 Hours'}</span>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard/admin/schedules')} className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 border border-emerald-600 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-50 transition shadow-sm">
            <Calendar size={16} /> View / Edit Schedule
          </button>
        </div>
      </div>

      {/* ── ROW 3: Payments, Tutors, Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Payment Details</h3>
          </div>

          <div className="space-y-4 mb-auto text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Hourly Rate (Per Subject)</span>
              <span className="font-bold text-slate-800">₹{totalSubjects > 0 ? '500' : '0'} / hr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Monthly Rate (All Subjects)</span>
              <span className="font-bold text-slate-800">₹{totalSubjects > 0 ? '4,000' : '0'} / month</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-slate-600">Total Subjects</span>
              <span className="font-bold text-slate-800">{totalSubjects}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-600">Total Hourly (All Subjects)</span>
              <span className="font-bold text-slate-800">₹{totalSubjects ? totalSubjects * 500 : 0} / hr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Monthly (All Subjects)</span>
              <span className="font-bold text-slate-800">₹{totalSubjects ? totalSubjects * 4000 : 0} / month</span>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-emerald-700 font-bold">Total Paid</span>
              <span className="font-bold text-emerald-700">₹{totalPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-bold">Due Amount</span>
              <span className="font-bold text-slate-800">₹{dueAmount}</span>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard/admin/payments')} className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition shadow-sm">
            <CreditCard size={16} /> View Payment History
          </button>
        </div>

        {/* Assigned Tutor & Additional Info */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Assigned Tutor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={16} className="text-[#059669]" /> Assigned Tutor</h3>
            {assignedTutor ? (
              <>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden mb-3 border-2 border-emerald-100">
                    {assignedTutor.avatar ? (
                      <img src={assignedTutor.avatar} alt={assignedTutor.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">{assignedTutor.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1 justify-center">
                    <h4 className="font-bold text-slate-800 text-lg">{assignedTutor.name}</h4>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{assignedTutor.status === 'verified' ? 'Active' : assignedTutor.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2 truncate px-2">{assignedTutor.headline || (assignedTutor.subjects ? `Expert in ${assignedTutor.subjects.join(', ')}` : 'Tutor')}</p>
                  
                  <div className="mt-2 w-full space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 justify-center">
                      <Phone size={12} /> {assignedTutor.mobile || '+91 N/A'}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 justify-center">
                      <Mail size={12} /> {assignedTutor.email}
                    </div>
                  </div>
                </div>
                <button onClick={() => router.push(`/dashboard/admin/tutors/${assignedTutor._id || assignedTutor.id}`)} className="w-full mt-4 py-2 flex items-center justify-center border border-emerald-600 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-50 transition shadow-sm">
                  View Tutor Profile
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="h-16 w-16 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-3">
                  <User size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-1">No Tutor Assigned</p>
                <p className="text-xs mb-3">This student hasn't booked any tutors yet.</p>
                <button onClick={() => router.push('/dashboard/admin/bookings')} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                  Go to Bookings
                </button>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800">Additional Information</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs font-semibold">Learning Mode</span>
                <span className="text-slate-800 font-medium mt-1">{student.mode ? (Array.isArray(student.mode) ? student.mode.join(', ') : student.mode) : 'Not Specified'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs font-semibold">Preferred Subjects</span>
                <span className="text-slate-800 font-medium mt-1">{student.subjects && student.subjects.length > 0 ? student.subjects.join(', ') : 'Not Specified'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs font-semibold">Area / Location</span>
                <span className="text-slate-800 font-medium mt-1">{student.address?.city || student.address?.full || student.location || 'Not Specified'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-xs font-semibold">Notes</span>
                <span className="text-slate-600 font-medium mt-1 leading-relaxed text-xs">{student.bio || student.notes || 'No specific notes available for this student.'}</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* ── ROW 4: Recent Activity / Messages ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Recent Activity / Messages</h3>
          </div>
          <button className="text-sm font-bold text-emerald-600 hover:underline">View All</button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MessageSquare size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No recent messages</p>
            <p className="text-xs mt-1">This student hasn't sent or received any messages yet.</p>
          </div>
        </div>

        <button disabled className="w-full py-2.5 flex items-center justify-center border border-slate-200 text-slate-400 rounded-lg text-sm font-bold bg-slate-50 cursor-not-allowed">
          View All Messages
        </button>
      </div>

      {/* Edit Student Modal */}
      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900">Edit Student</h3>
              <button onClick={() => setIsEditing(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Determine ID to update
                const updateId = editForm._id || editForm.id;
                // Prepare updates (mapping flat fields for the API if needed)
                const updates = { ...editForm };
                
                // Address handling
                if (!updates.address) updates.address = {};
                if (updates.city) updates.address.city = updates.city;
                if (updates.addressFull) updates.address.full = updates.addressFull;

                const updated = await adminApi.updateUser(updateId, updates);
                if (updated) {
                  setStudent({ ...student, ...updated });
                  setIsEditing(false);
                } else {
                  alert('Update failed, received empty response');
                }
              } catch (err) {
                console.error(err);
                alert('Failed to update student');
              }
            }} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input required type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</label>
                  <input type="text" value={editForm.mobile || ''} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none bg-white">
                    <option value="active">Active</option>
                    <option value="verified">Verified</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Class / Grade</label>
                  <input type="text" value={editForm.grade || editForm.classLevel || ''} onChange={e => setEditForm({...editForm, grade: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Parent Name</label>
                  <input type="text" value={editForm.parentName || ''} onChange={e => setEditForm({...editForm, parentName: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Address</label>
                <input type="text" value={editForm.address?.full || editForm.addressFull || ''} onChange={e => setEditForm({...editForm, addressFull: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 outline-none" placeholder="123 Street Name, City, State" />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
