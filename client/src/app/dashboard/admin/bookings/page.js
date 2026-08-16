"use client";

import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, RefreshCw, Search, Clock, Users,
  Calendar, Filter, Plus, FileDown, BarChart3, UserPlus, Bell,
  Phone, MapPin, BookOpen, Eye, X, Check, AlertCircle, Sparkles, Star
} from 'lucide-react';
import { adminApi } from '../../../../lib/api';

const STATUS_COLORS = {
  'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
  'Pending Admin Review': 'bg-orange-100 text-orange-700 border-orange-200',
  'Called': 'bg-blue-100 text-blue-700 border-blue-200',
  'Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Tutor Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
  'Tutor Assigned / Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Admin Approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Payment Completed': 'bg-violet-100 text-violet-700 border-violet-200',
  'Completed': 'bg-violet-100 text-violet-700 border-violet-200',
  'Declined': 'bg-rose-100 text-rose-700 border-rose-200',
  'Rejected': 'bg-rose-100 text-rose-700 border-rose-200',
  'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
};

const REQUEST_TYPE_BADGES = {
  booking: { label: 'Tutor Booking', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  consultation: { label: 'Free Consultation', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  registration: { label: 'Student Reg.', style: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const getPersonLabel = (person) => {
  if (!person) return 'Unknown';
  if (typeof person === 'string') return person;
  return person.name || person.email || 'Unknown';
};

const getStudentName = (booking) => {
  return booking?.studentSnapshot?.name || getPersonLabel(booking?.student) || 'Unknown Student';
};

const getStudentPhone = (booking) => {
  return booking?.studentSnapshot?.phone || booking?.student?.mobile || booking?.phone || 'N/A';
};

const getLocation = (booking) => {
  return booking?.studentSnapshot?.location || booking?.location || booking?.address?.city || 'Lucknow';
};

const getTutorName = (booking) => {
  return getPersonLabel(booking?.tutor) || booking?.tutorSnapshot?.name || 'Assigned Tutor';
};

const normalizeSubject = (value) => {
  if (!value) return '';
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
};

const subjectMatchesBooking = (tutor, booking) => {
  const bookingSubject = normalizeSubject(booking?.subject || booking?.studentSnapshot?.subject || '');
  if (!bookingSubject) return true;

  const tutorSubjects = Array.isArray(tutor?.subjects)
    ? tutor.subjects
    : typeof tutor?.subjects === 'string'
      ? tutor.subjects.split(',')
      : [];

  return tutorSubjects.some(subject => normalizeSubject(subject).includes(bookingSubject) || bookingSubject.includes(normalizeSubject(subject)));
};

export default function BookingsAdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);

  // Assign Tutor State
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [tutorSearch, setTutorSearch] = useState('');

  // Reject Modal State
  const [rejectModalBooking, setRejectModalBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBookings();
      const normalized = Array.isArray(data) ? data : [];
      setBookings(normalized);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await adminApi.updateBooking(id, { status });
      if (selectedBookingForDetails && (selectedBookingForDetails._id === id || selectedBookingForDetails.id === id)) {
        setSelectedBookingForDetails(prev => prev ? { ...prev, status } : null);
      }
      load();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const isAssignableTutor = (user) => {
    const status = String(user?.status || '').toLowerCase();
    const verified = Boolean(user?.verified);
    const role = String(user?.role || '').toLowerCase();
    return role === 'tutor' && (verified || status === 'verified' || status === 'active' || status === 'approved');
  };

  const openAssignModal = async (booking) => {
    setAssignModalBooking(booking);
    setLoadingTutors(true);
    try {
      const data = await adminApi.getUsers('tutor');
      const assignableTutors = Array.isArray(data) ? data.filter(isAssignableTutor) : [];
      const filteredBySubject = assignableTutors.filter((tutor) => subjectMatchesBooking(tutor, booking));
      setTutors(filteredBySubject.length > 0 ? filteredBySubject : assignableTutors);
    } catch (err) {
      console.error('Error loading tutors:', err);
      setTutors([]);
    } finally {
      setLoadingTutors(false);
    }
  };

  const handleAssignTutor = async (tutorId) => {
    if (!assignModalBooking) return;
    try {
      const id = bookingId(assignModalBooking);
      await adminApi.assignTutor(id, tutorId);
      
      // Update local state for details view if open
      if (selectedBookingForDetails && bookingId(selectedBookingForDetails) === id) {
        const updatedTutor = tutors.find(t => t._id === tutorId);
        setSelectedBookingForDetails(prev => ({ ...prev, tutor: updatedTutor, status: 'Tutor Assigned / Confirmed' }));
      }
      
      setAssignModalBooking(null);
      load();
    } catch (err) {
      console.error('Error assigning tutor:', err);
      alert('Failed to assign tutor: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    if (!rejectModalBooking) return;
    setRejectLoading(true);
    try {
      const id = bookingId(rejectModalBooking);
      await adminApi.rejectBooking(id, rejectReason);
      setRejectModalBooking(null);
      setRejectReason('');
      if (selectedBookingForDetails && bookingId(selectedBookingForDetails) === id) {
        setSelectedBookingForDetails(prev => prev ? { ...prev, status: 'Rejected' } : null);
      }
      load();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject: ' + (err.response?.data?.message || err.message));
    } finally {
      setRejectLoading(false);
    }
  };

  const handleConfirmQrPayment = async (id) => {
    try {
      await adminApi.confirmQrPayment(id);
      load();
      alert('Payment confirmed successfully!');
    } catch (err) {
      alert('Failed to confirm payment: ' + (err.response?.data?.message || err.message));
    }
  };

  const bookingId = (booking) => booking?._id || booking?.id || booking?.bookingId || booking?.uuid;

  const all = bookings.length;
  const pendingReview = bookings.filter(b => (b.status || 'Pending') === 'Pending' || b.status === 'Pending Admin Review').length;
  const confirmed = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Called' || b.status === 'Tutor Assigned / Confirmed').length;
  const completed = bookings.filter(b => b.status === 'Completed').length;
  const cancelled = bookings.filter(b => ['Cancelled', 'Declined', 'Rejected'].includes(b.status || '')).length;
  const consultations = bookings.filter(b => (b.requestType || 'booking') === 'consultation').length;
  const tutorBookings = bookings.filter(b => (b.requestType || 'booking') === 'booking').length;

  const tabs = [
    { id: 'all', label: 'All Requests', count: all },
    { id: 'consultation', label: 'Callbacks / Consultations', count: consultations },
    { id: 'booking', label: 'Tutor Bookings', count: tutorBookings },
    { id: 'Pending', label: 'Pending Review', count: pendingReview },
    { id: 'Confirmed', label: 'Confirmed / Assigned', count: confirmed },
    { id: 'Completed', label: 'Completed', count: completed },
    { id: 'Cancelled', label: 'Rejected / Cancelled', count: cancelled },
  ];

  const filtered = bookings.filter(b => {
    const isConsultation = (b.requestType || 'booking') === 'consultation';
    const isTutorBooking = (b.requestType || 'booking') === 'booking';

    let matchTab = true;
    if (selectedTab === 'consultation') matchTab = isConsultation;
    else if (selectedTab === 'booking') matchTab = isTutorBooking;
    else if (selectedTab === 'Pending') matchTab = ['Pending', 'Pending Admin Review'].includes(b.status || 'Pending');
    else if (selectedTab === 'Confirmed') matchTab = ['Confirmed', 'Called', 'Tutor Assigned / Confirmed'].includes(b.status || '');
    else if (selectedTab === 'Completed') matchTab = b.status === 'Completed';
    else if (selectedTab === 'Cancelled') matchTab = ['Cancelled', 'Declined', 'Rejected'].includes(b.status || '');

    let matchType = typeFilter === 'all' || (b.requestType || 'booking') === typeFilter;

    const studentName = getStudentName(b);
    const tutorName = getTutorName(b);
    const studentPhone = getStudentPhone(b);
    const location = getLocation(b);
    const subject = b.subject || b.studentSnapshot?.subject || '';
    const grade = b.grade || b.classLevel || b.studentSnapshot?.classLevel || '';

    const matchSearch = !search
      || studentName.toLowerCase().includes(search.toLowerCase())
      || tutorName.toLowerCase().includes(search.toLowerCase())
      || studentPhone.toLowerCase().includes(search.toLowerCase())
      || location.toLowerCase().includes(search.toLowerCase())
      || subject.toLowerCase().includes(search.toLowerCase())
      || grade.toLowerCase().includes(search.toLowerCase());

    return matchTab && matchType && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-[#056852]" size={22} />
            Booking & Consultation Leads
          </h1>
          <p className="text-xs text-slate-500">Track and respond to home page & subject page student callback forms & tutor bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <RefreshCw size={14} className={loading ? "animate-spin text-[#056852]" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Inquiries', value: all, color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Calendar },
          { label: 'Pending Review', value: pendingReview, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock },
          { label: 'Free Consultations', value: consultations, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Sparkles },
          { label: 'Tutor Bookings', value: tutorBookings, color: 'text-violet-600 bg-violet-50 border-violet-100', icon: Users },
          { label: 'Declined / Closed', value: cancelled, color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl p-3 ${s.color} border`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <Icon size={20} className={s.color.split(' ')[0]} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-xs font-bold border-b-2 transition-all rounded-t-lg ${
              selectedTab === tab.id
                ? 'border-[#056852] bg-emerald-50/50 text-[#056852]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${selectedTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-600'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(900px,1fr)_320px]">
        <div className="space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by student name, phone, class, subject, city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:outline-none shadow-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none shadow-sm shrink-0"
            >
              <option value="all">All Request Types</option>
              <option value="consultation">Callback Consultation Only</option>
              <option value="booking">Tutor Booking Only</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Type</th>
                  <th className="px-4 py-3 text-left font-bold">Student Name & Contact</th>
                  <th className="px-4 py-3 text-left font-bold">Class / Subject</th>
                  <th className="px-4 py-3 text-left font-bold">City / Location</th>
                  <th className="px-4 py-3 text-left font-bold">Tuition Mode</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Date</th>
                  <th className="px-4 py-3 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">Loading inquiries...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">No inquiries or bookings found matching your search.</td></tr>
                ) : (
                  filtered.map((booking) => {
                    const reqType = booking.requestType || 'booking';
                    const badgeInfo = REQUEST_TYPE_BADGES[reqType] || REQUEST_TYPE_BADGES.booking;
                    const studentName = getStudentName(booking);
                    const phone = getStudentPhone(booking);
                    const location = getLocation(booking);
                    const grade = booking.grade || booking.classLevel || booking.studentSnapshot?.classLevel || 'Class 10';
                    const subject = booking.subject || booking.studentSnapshot?.subject || 'General';
                    const mode = booking.mode || booking.studentSnapshot?.mode || 'Home';
                    const dateStr = booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent';

                    return (
                      <tr key={bookingId(booking)} className="hover:bg-slate-50/70 transition align-middle">
                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeInfo.style}`}>
                            {reqType === 'consultation' && <Sparkles size={10} />}
                            {badgeInfo.label}
                          </span>
                        </td>

                        {/* Student Name & Phone */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-[#056852] border border-slate-200">
                              {studentName.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{studentName}</div>
                              <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline">
                                <Phone size={10} /> {phone}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Class & Subject */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{grade}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{subject}</div>
                        </td>

                        {/* City / Location */}
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <MapPin size={12} className="text-rose-500 shrink-0" />
                            {location}
                          </div>
                        </td>

                        {/* Tuition Mode */}
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700 text-[10px]">
                            {mode}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[booking.status || 'Pending'] || STATUS_COLORS.Pending}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                          {dateStr}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedBookingForDetails(booking)}
                              title="View Full Student Details"
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                            >
                              <Eye size={12} /> View
                            </button>

                            {['Pending', 'Pending Admin Review', 'Tutor Assigned'].includes(booking.status || 'Pending') && (
                              <>
                                <button
                                  onClick={() => handleStatus(bookingId(booking), booking.status === 'Tutor Assigned' ? 'Admin Approved' : 'Confirmed')}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModalBooking(booking); setRejectReason(''); }}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {['Confirmed', 'Tutor Assigned / Confirmed', 'Admin Approved', 'Payment Completed'].includes(booking.status || '') && (
                              <button
                                onClick={() => handleStatus(bookingId(booking), 'Completed')}
                                className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-violet-700 transition"
                              >
                                Complete
                              </button>
                            )}
                            {!booking.tutor && !['Rejected', 'Cancelled', 'Declined', 'Completed', 'Payment Completed'].includes(booking.status || '') && (
                              <button
                                onClick={() => openAssignModal(booking)}
                                className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                              >
                                <UserPlus size={10} className="inline mr-0.5" /> Assign
                              </button>
                            )}
                            {booking.paymentStatus === 'Claimed' && (
                              <button
                                onClick={() => handleConfirmQrPayment(bookingId(booking))}
                                className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-bold text-green-700 hover:bg-green-100 transition border border-green-200"
                              >
                                ✓ Confirm Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Summary & Filters */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-[#056852]" />
              Inquiry Summary
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-semibold text-emerald-800">Home/Subject Callbacks</span>
                <span className="font-extrabold text-emerald-900 text-sm">{consultations}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="font-semibold text-indigo-800">Tutor Direct Bookings</span>
                <span className="font-extrabold text-indigo-900 text-sm">{tutorBookings}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <span className="font-semibold text-amber-800">Pending Action</span>
                <span className="font-extrabold text-amber-900 text-sm">{pendingReview}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Deployment Status Checklist</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Student Form submits to MySQL database</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Admin panel fetches all callback requests live</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Full detailed fields (Name, Phone, Class, Subject, Location, Mode)</span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Admin status update syncs to server database</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Detailed View Modal */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#056852] uppercase tracking-wider">
                  {selectedBookingForDetails.requestType === 'consultation' ? 'Student Consultation Lead' : 'Tutor Booking'}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {getStudentName(selectedBookingForDetails)}
                </h3>
                <p className="text-xs text-slate-400">
                  Submitted on {selectedBookingForDetails.createdAt ? new Date(selectedBookingForDetails.createdAt).toLocaleString('en-IN') : 'Recent'}
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Mobile Number</span>
                <div className="font-bold text-slate-900">
                  <a href={`tel:${getStudentPhone(selectedBookingForDetails)}`} className="text-emerald-700 flex items-center gap-1 hover:underline">
                    <Phone size={12} /> {getStudentPhone(selectedBookingForDetails)}
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Class / Course</span>
                <div className="font-bold text-slate-900">
                  {selectedBookingForDetails.grade || selectedBookingForDetails.classLevel || selectedBookingForDetails.studentSnapshot?.classLevel || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Subject</span>
                <div className="font-bold text-slate-900">
                  {selectedBookingForDetails.subject || selectedBookingForDetails.studentSnapshot?.subject || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">City / Location</span>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <MapPin size={12} className="text-rose-500" />
                  {getLocation(selectedBookingForDetails)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tuition Mode</span>
                <div className="font-bold text-slate-900">
                  {selectedBookingForDetails.mode || selectedBookingForDetails.studentSnapshot?.mode || 'Home'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Current Status</span>
                <div>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[selectedBookingForDetails.status || 'Pending'] || STATUS_COLORS.Pending}`}>
                    {selectedBookingForDetails.status || 'Pending'}
                  </span>
                </div>
              </div>

              {(selectedBookingForDetails.studentSnapshot?.email || selectedBookingForDetails.student?.email) && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Email Address</span>
                  <div className="font-bold text-slate-900">
                    <a href={`mailto:${selectedBookingForDetails.studentSnapshot?.email || selectedBookingForDetails.student?.email}`} className="text-blue-600 hover:underline">
                      {selectedBookingForDetails.studentSnapshot?.email || selectedBookingForDetails.student?.email}
                    </a>
                  </div>
                </div>
              )}


              {['Confirmed', 'Completed'].includes(selectedBookingForDetails.status) && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Tutor</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                      {selectedBookingForDetails.tutor ? (
                        <>
                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-200">
                            {getTutorName(selectedBookingForDetails).charAt(0).toUpperCase()}
                          </div>
                          <span>{getTutorName(selectedBookingForDetails)}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">No tutor assigned yet</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBookingForDetails(null); // Optional: close details
                      openAssignModal(selectedBookingForDetails);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <UserPlus size={14} /> {selectedBookingForDetails.tutor ? 'Reassign' : 'Assign Tutor'}
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`tel:${getStudentPhone(selectedBookingForDetails)}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <Phone size={14} /> Call Student
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatus(bookingId(selectedBookingForDetails), 'Confirmed')}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  Mark Confirmed
                </button>
                <button
                  onClick={() => handleStatus(bookingId(selectedBookingForDetails), 'Completed')}
                  className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-800 hover:bg-violet-100 transition"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatus(bookingId(selectedBookingForDetails), 'Declined')}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tutor Modal */}
      {assignModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus size={20} className="text-[#056852]" /> Assign Tutor
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Assigning for <span className="font-bold text-slate-700">{getStudentName(assignModalBooking)}</span> • {assignModalBooking.subject || assignModalBooking.studentSnapshot?.subject || 'General'}
                </p>
              </div>
              <button
                onClick={() => setAssignModalBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tutors by name, subject, or location..."
                  value={tutorSearch}
                  onChange={e => setTutorSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/30">
              {loadingTutors ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                  <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  Loading available tutors...
                </div>
              ) : (
                <div className="space-y-3">
                  {tutors.filter(t => 
                    t.name?.toLowerCase().includes(tutorSearch.toLowerCase()) ||
                    (t.subjects || []).join(' ').toLowerCase().includes(tutorSearch.toLowerCase()) ||
                    t.location?.toLowerCase().includes(tutorSearch.toLowerCase())
                  ).map(tutor => (
                    <div key={tutor._id} className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 transition">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-lg font-bold border border-emerald-200">
                        {tutor.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-sm font-bold text-slate-900">{tutor.name}</h4>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-0.5"><BookOpen size={10} /> {(tutor.subjects || []).join(', ')}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5"><MapPin size={10} /> {tutor.location}</span>
                          {tutor.rating && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold"><Star size={10} fill="currentColor" /> {tutor.rating}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignTutor(tutor._id)}
                        className="w-full sm:w-auto shrink-0 rounded-xl bg-[#056852] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#056852]/20 hover:bg-[#045241] transition"
                      >
                        Assign to Booking
                      </button>
                    </div>
                  ))}
                  {tutors.length === 0 && !loadingTutors && (
                    <div className="py-12 text-center text-xs font-semibold text-slate-500">
                      No verified tutors available to assign.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Reject Reason Modal */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <XCircle size={20} className="text-rose-500" /> Reject Booking
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Rejecting booking for <span className="font-bold text-slate-700">{getStudentName(rejectModalBooking)}</span>
                </p>
              </div>
              <button
                onClick={() => setRejectModalBooking(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Reason for rejection (will be sent to student)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., No tutor available for this subject in your area, schedule conflict..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalBooking(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectLoading}
                className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition disabled:opacity-50"
              >
                {rejectLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
