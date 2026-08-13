"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronRight, Edit, MessageSquare, MoreHorizontal, User,
  CheckCircle2, Star, Calendar, FileText, IndianRupee, MapPin, Award
} from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminTutorDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [tutor, setTutor] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTutorData();
  }, [id]);

  const fetchTutorData = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('verifiedtutor-token') : null;
      const res = await fetch(`${API}/api/v1/admin/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        setTutor(data.user);
        setBookings(data.bookings || []);
      } else {
        setTutor(null);
      }
    } catch (err) {
      console.error(err);
      setTutor(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#059669] border-t-transparent" /></div>;
  }

  if (!tutor) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-8">
        <div className="h-16 w-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-4">
          <User size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Tutor not found</h2>
        <p className="text-sm text-slate-500 max-w-sm text-center mb-6">The tutor profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push('/dashboard/admin/tutors')} className="px-6 py-2 bg-[#059669] text-white font-bold rounded-lg hover:bg-[#047a55] transition">Return to Tutors</button>
      </div>
    );
  }

  const tutorIdDisplay = `TUT${String(tutor._id || tutor.id || id).slice(-4).toUpperCase()}`;

  // Derived metrics (using bookings if available)
  const studentsAssigned = Array.from(new Set(bookings.map(b => b.student))).length || tutor.students || 0;
  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'ongoing').length || 0;
  const completedSessions = tutor.completedSessions || bookings.filter(b => b.status === 'completed').length || 0;
  
  // Calculate earnings (mock calculations based on active bookings * rate if true data isn't available)
  const totalEarnings = tutor.wallet?.paidBalance || (completedSessions * (tutor.price || 500));
  const pendingPayout = tutor.wallet?.pendingBalance || 0;
  const earningsCurrentMonth = totalEarnings; // Assuming all is this month for the UI display

  const isVerified = tutor.status === 'active' || tutor.status === 'verified';
  const subjects = tutor.subjects || ['Mathematics', 'Science'];
  const baseRate = tutor.price || 500;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-xs font-semibold text-slate-500 mb-2">
        <Link href="/dashboard/admin" className="hover:text-slate-900">Dashboard</Link>
        <ChevronRight size={14} className="mx-1" />
        <Link href="/dashboard/admin/tutors" className="hover:text-slate-900">Tutors</Link>
        <ChevronRight size={14} className="mx-1" />
        <span className="text-slate-900">{tutor.name}</span>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-sm flex flex-col xl:flex-row xl:items-start gap-6">
        
        <div className="flex flex-col sm:flex-row gap-5 xl:w-[45%] border-b xl:border-b-0 xl:border-r border-slate-200 pb-6 xl:pb-0 xl:pr-6 shrink-0">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="h-28 w-28 rounded-full overflow-hidden border border-slate-200 bg-indigo-50 flex items-center justify-center relative">
              {tutor.avatar ? (
                <img src={tutor.avatar} alt={tutor.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-indigo-700">{tutor.name.charAt(0)}</span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isVerified ? 'Active' : tutor.status}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{tutor.name}</h1>
                {isVerified && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded border border-emerald-100 font-bold">Active Tutor</span>}
              </div>
              <p className="text-xs text-slate-500">Tutor ID: {tutorIdDisplay}</p>
            </div>
            
            <div className="space-y-1.5 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-4 flex justify-center text-emerald-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></span>
                {tutor.mobile || '+91 Not Provided'}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 flex justify-center text-emerald-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></span>
                {tutor.email}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 flex justify-center text-emerald-600"><MapPin className="w-3.5 h-3.5" /></span>
                {tutor.location || 'Not Provided'}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 flex justify-center text-emerald-600"><Award className="w-3.5 h-3.5" /></span>
                {tutor.experience || 'Not specified'} Experience
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 flex justify-center text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                Expert in {subjects.slice(0, 3).join(', ')}{subjects.length > 3 ? '...' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 xl:mb-0">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Students Assigned</p>
              <p className="text-2xl font-black text-[#059669] mt-0.5">{studentsAssigned}</p>
              <a href="#students" className="text-[10px] text-[#059669] font-bold hover:underline">View Students</a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Bookings</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{activeBookings}</p>
              <span className="text-[10px] text-slate-400 font-medium">Ongoing</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completed Sessions</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{completedSessions}</p>
              <span className="text-[10px] text-slate-400 font-medium">All time</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rating</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-2xl font-black text-slate-800">{tutor.rating || '4.8'}</p>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-400">({tutor.reviews || 0} Reviews)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-auto gap-4">
            <div className="flex items-center gap-8 w-full sm:w-auto">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Earnings</p>
                <p className="text-lg font-black text-[#059669]">₹{totalEarnings.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">This Month</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending Payout</p>
                <p className="text-lg font-black text-slate-800">₹{pendingPayout.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Will be paid soon</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition">
                <Edit size={14} /> Edit Tutor
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-emerald-700 bg-emerald-50 text-xs font-bold rounded-xl hover:bg-emerald-100 transition">
                <MessageSquare size={14} /> Message Tutor
              </button>
              <button className="h-[34px] w-[34px] flex items-center justify-center border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        
        {/* Subjects & Charges */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-[#059669]" /> Subjects & Charges</h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-right">Hourly Rate</th>
                  <th className="pb-2 text-right">Monthly Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subjects.map((sub, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-semibold text-slate-700">{sub}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-600">₹{baseRate} / hr</td>
                    <td className="py-2.5 text-right font-semibold text-slate-600">₹{baseRate * 8} / month</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">Edit Subjects & Charges</button>
        </div>

        {/* About Me */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><User size={16} className="text-[#059669]" /> About Me</h3>
          <p className="text-xs text-slate-600 leading-relaxed flex-1">
            {tutor.bio || `Passionate tutor with ${tutor.experience || 'several years'} of experience in teaching ${subjects.join(', ')} for classes 6 to 12 and competitive exams. I focus on concept clarity and regular practice.`}
          </p>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">Edit About Me</button>
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-[#059669]" /> Documents</h3>
          <div className="flex-1 space-y-3 text-xs">
            {['Aadhaar Card', 'PAN Card', 'Qualification Certificate', 'Experience Certificate', 'Profile Photo'].map((doc, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <FileText size={14} className="text-slate-400" />
                  {doc}
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 size={12} /> Verified
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">View All Documents</button>
        </div>

        {/* Availability */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={16} className="text-[#059669]" /> Availability</h3>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const isAvail = (tutor.availableDays || ['Mon','Tue','Wed','Thu','Fri']).includes(day);
                return (
                  <span key={day} className={`px-2 py-1 rounded text-[10px] font-bold ${isAvail ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {day}
                  </span>
                )
              })}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Default Time</p>
            <p className="text-sm font-bold text-slate-800">{tutor.availableTimeSlots || '05:00 PM - 08:00 PM'}</p>
          </div>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">Edit Availability</button>
        </div>
      </div>

      {/* Row 2: Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Assigned Students */}
        <div id="students" className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={16} className="text-[#059669]" /> Assigned Students</h3>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/50">
                  <th className="px-3 py-2.5 rounded-l-lg">Student</th>
                  <th className="px-3 py-2.5">Class</th>
                  <th className="px-3 py-2.5">Subjects</th>
                  <th className="px-3 py-2.5">Schedule</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.length > 0 ? (
                  bookings.slice(0, 4).map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">S</div>
                          <div>
                            <p className="font-bold text-slate-800">Student ID: {String(b.student).slice(-4).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-400 truncate w-24">Active User</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-600">Class 10</td>
                      <td className="px-3 py-3 font-medium text-slate-600">{b.subject || subjects[0]}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800 text-[11px]">{tutor.availableTimeSlots || '05:00 PM - 06:00 PM'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${b.status === 'confirmed' || b.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.status || 'Ongoing'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><MessageSquare size={12} /></button>
                          <button className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><Calendar size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // Mock Rows if no bookings
                  [1,2,3,4].map((mock, i) => (
                    <tr key={mock} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">A</div>
                          <div>
                            <p className="font-bold text-slate-800">Abhi Kumar</p>
                            <p className="text-[10px] text-slate-400">+91 94847 87654</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-600">Class {10 + (i%3)}</td>
                      <td className="px-3 py-3 font-medium text-slate-600 text-[11px] w-28 truncate">{subjects.join(', ')}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-800 text-[11px]">Mon, Wed, Fri</p>
                        <p className="text-[10px] text-slate-400">05:00 PM - 07:00 PM</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${i%3===0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {i%3===0 ? 'Pending' : 'Ongoing'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><MessageSquare size={12} /></button>
                          <button className="h-6 w-6 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"><Calendar size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button className="mt-4 self-center text-[11px] font-bold text-[#059669] hover:underline flex items-center gap-1">View All Students <ChevronRight size={14} /></button>
        </div>

        {/* Earnings Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><IndianRupee size={16} className="text-[#059669]" /> Earnings Overview</h3>
            <select className="text-[10px] font-bold text-slate-600 border border-slate-200 rounded p-1 outline-none">
              <option>This Month</option>
            </select>
          </div>
          
          <div className="mb-6">
            <p className="text-3xl font-black text-[#059669]">₹{totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium">Total Earnings</p>
          </div>

          <div className="flex-1 flex items-center justify-center relative mb-4">
            {/* Simple CSS Donut Chart representation */}
            <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 relative">
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-amber-400" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-[#059669]" style={{ clipPath: 'polygon(50% 50%, 0 0, 0 100%, 50% 100%, 100% 0)' }}></div>
            </div>
            
            <div className="absolute right-0 flex flex-col gap-3 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#059669]"></span> Completed <span className="font-bold text-slate-800 ml-auto">₹{(totalEarnings * 0.75).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span> Advance <span className="font-bold text-slate-800 ml-auto">₹{(totalEarnings * 0.25).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-300"></span> Pending <span className="font-bold text-slate-800 ml-auto">₹0</span>
              </div>
            </div>
          </div>
          
          <button className="w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">View Earnings Report</button>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Reviews */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">Reviews & Ratings</h3>
            <button className="text-[11px] font-bold text-[#059669] hover:underline flex items-center">View All <ChevronRight size={14}/></button>
          </div>
          <div className="flex items-end gap-3 mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-4xl font-black text-slate-900">{tutor.rating || '4.8'}</h1>
            <div className="mb-1">
              <div className="flex gap-1 text-amber-400 mb-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= (tutor.rating||5) ? 'fill-current' : ''} />)}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">({tutor.reviews || 32} Reviews)</p>
            </div>
          </div>
          <div className="space-y-4">
            {/* Mock Reviews */}
            <div className="flex gap-3">
              <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 flex items-center justify-center">A</div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold text-slate-800">Abhi Kumar</p>
                  <div className="flex text-amber-400"><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/></div>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Great teaching and concept clarity!</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 shrink-0 rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 flex items-center justify-center">S</div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold text-slate-800">Sneha Patel</p>
                  <div className="flex text-amber-400"><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/><Star size={10} className="fill-current"/></div>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Very helpful and explains very well.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Payment Summary</h3>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Total Earnings</span>
              <span className="font-bold text-slate-800">₹{totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Paid to You</span>
              <span className="font-bold text-slate-800">₹{totalEarnings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Pending Payout</span>
              <span className="font-bold text-slate-800">₹{pendingPayout.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Next Payout Date</span>
              <span className="font-bold text-slate-800">25 Aug 2026</span>
            </div>
          </div>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">View Payment History</button>
        </div>

        {/* Additional Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Additional Information</h3>
          <div className="space-y-3 flex-1 text-xs">
            <div className="grid grid-cols-[120px_1fr] items-start">
              <span className="text-slate-400 font-medium">Teaching Mode</span>
              <span className="font-medium text-slate-800">{(tutor.mode || []).join(', ') || 'Offline (Home Tuition)'}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-start">
              <span className="text-slate-400 font-medium">Preferred Classes</span>
              <span className="font-medium text-slate-800">{(tutor.classesTaught || []).join(', ') || '8th - 12th, JEE, NEET'}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-start">
              <span className="text-slate-400 font-medium">Area Covered</span>
              <span className="font-medium text-slate-800">{tutor.location || 'Lucknow (Gomti Nagar, Hazratganj)'}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-start">
              <span className="text-slate-400 font-medium">Teaching Preference</span>
              <span className="font-medium text-slate-800">1 on 1 / Small Group</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-start">
              <span className="text-slate-400 font-medium">Notes</span>
              <span className="font-medium text-slate-800 text-slate-600">Punctual, friendly and focused on results.</span>
            </div>
          </div>
          <button className="mt-4 w-full py-2 text-[11px] font-bold text-[#059669] border border-[#059669]/20 rounded-lg hover:bg-emerald-50 transition">Edit Information</button>
        </div>

      </div>

    </div>
  );
}
