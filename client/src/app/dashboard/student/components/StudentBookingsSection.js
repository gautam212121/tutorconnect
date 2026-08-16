"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, BookOpen, MapPin, Clock, User, Phone, Mail, Star,
  Plus, X, CheckCircle, XCircle, AlertCircle, CreditCard, QrCode, ChevronDown
} from 'lucide-react';
import { studentApi, configApi } from '../../../../lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const STATUS_COLORS = {
  'Pending Admin Review': 'bg-orange-50 text-orange-700 border-orange-200',
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Tutor Assigned': 'bg-blue-50 text-blue-700 border-blue-200',
  'Tutor Assigned / Confirmed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Admin Approved': 'bg-emerald-50 text-emerald-700 border-[#056852]/20',
  'Payment Completed': 'bg-violet-50 text-violet-700 border-violet-200',
  'Completed': 'bg-violet-50 text-violet-700 border-violet-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
  'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200',
};

const PAYMENT_COLORS = {
  'Pending': 'text-amber-600 bg-amber-50',
  'Claimed': 'text-blue-600 bg-blue-50',
  'Paid': 'text-emerald-600 bg-emerald-50',
};

export default function StudentBookingsSection({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showQr, setShowQr] = useState(null); // booking id to show QR for
  const [formData, setFormData] = useState({
    subject: '', grade: '', addressFull: '', addressArea: '',
    scheduledAt: '', message: '', amount: 500
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);

  const loadData = async () => {
    try {
      const data = await studentApi.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
      const settings = await configApi.getPublicSettings();
      if (settings?.paymentMethods) {
        setPaymentMethods(settings.paymentMethods);
        if (settings.paymentMethods.length > 0) {
          setSelectedPaymentMethodId(settings.paymentMethods[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: formData.subject,
          grade: formData.grade,
          examType: 'General',
          mode: 'Home',
          scheduledAt: formData.scheduledAt || null,
          duration: 60,
          message: formData.message,
          address: { full: formData.addressFull, area: formData.addressArea },
          amount: Number(formData.amount) || 500
        })
      });

      if (res.ok) {
        setShowBookingForm(false);
        setFormData({ subject: '', grade: '', addressFull: '', addressArea: '', scheduledAt: '', message: '', amount: 500 });
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create booking');
      }
    } catch (err) {
      alert('Error creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimPayment = async (bookingId) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/bookings/${bookingId}/payment/qr-claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowQr(null);
        loadData();
        alert('Payment claim submitted! Admin will verify.');
      }
    } catch (err) {
      alert('Error claiming payment');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-xl w-48" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Bookings</h2>
          <p className="text-sm text-slate-500">Track your class bookings and payment status</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#056852] text-white rounded-xl text-sm font-bold hover:bg-[#045241] transition shadow-md"
        >
          <Plus size={16} /> Book a Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: bookings.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Pending', value: bookings.filter(b => ['Pending', 'Pending Admin Review'].includes(b.status)).length, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Confirmed', value: bookings.filter(b => ['Confirmed', 'Tutor Assigned / Confirmed'].includes(b.status)).length, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'Completed').length, color: 'bg-violet-50 text-violet-700 border-violet-100' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 border ${s.color}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="text-2xl font-extrabold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Bookings Yet</h3>
          <p className="text-sm text-slate-500 mb-6">Book your first home tuition class to get started!</p>
          <button
            onClick={() => setShowBookingForm(true)}
            className="px-6 py-2.5 bg-[#056852] text-white rounded-xl text-sm font-bold hover:bg-[#045241] transition"
          >
            Book a Class
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const id = booking._id || booking.id;
            const tutor = booking.tutor;
            const hasTutor = tutor && typeof tutor === 'object' && tutor.name;
            const date = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date(booking.createdAt);
            const isApproved = ['Admin Approved', 'Payment Completed', 'Paid', 'Completed'].includes(booking.status);
            const displayAmount = isApproved ? (booking.amount || 0) : 0;

            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Booking Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800">{booking.subject || 'General'} Class</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[booking.status] || STATUS_COLORS.Pending}`}>
                        {booking.status || 'Pending'}
                      </span>
                      {booking.paymentStatus && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PAYMENT_COLORS[booking.paymentStatus] || 'text-slate-500 bg-slate-50'}`}>
                          ₹{displayAmount} — {booking.paymentStatus === 'Pending' ? 'Payment Pending' : booking.paymentStatus}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-slate-400" />
                        <span>Grade: {booking.grade || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span>{booking.duration || 60} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate">{booking.address?.area || booking.address?.full || 'Home'}</span>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {booking.status === 'Rejected' && booking.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-rose-700 uppercase">Rejection Reason</p>
                          <p className="text-xs text-rose-600 mt-0.5">{booking.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Assigned Tutor */}
                    {hasTutor && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 rounded-full bg-[#056852] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                          {tutor.avatar ? <img src={tutor.avatar} className="w-full h-full object-cover" /> : tutor.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{tutor.name}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                            {tutor.mobile && <span className="flex items-center gap-1"><Phone size={10} /> {tutor.mobile}</span>}
                            {tutor.email && <span className="flex items-center gap-1"><Mail size={10} /> {tutor.email}</span>}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold shrink-0">Assigned Tutor</span>
                      </div>
                    )}

                    {!hasTutor && !['Rejected', 'Cancelled'].includes(booking.status) && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                        <AlertCircle size={14} />
                        <span className="font-semibold">Waiting for admin to assign a tutor</span>
                      </div>
                    )}

                    {hasTutor && !isApproved && !['Rejected', 'Cancelled'].includes(booking.status) && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <AlertCircle size={14} />
                        <span className="font-semibold">Awaiting admin approval & price generation</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 sm:items-end shrink-0">
                    <p className="text-lg font-extrabold text-[#056852]">₹{displayAmount}</p>
                    {booking.paymentStatus === 'Pending' && isApproved && !['Rejected', 'Cancelled'].includes(booking.status) && (
                      <button
                        onClick={() => setShowQr(id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#056852] text-white rounded-xl text-[11px] font-bold hover:bg-[#045241] transition"
                      >
                        <QrCode size={14} /> Pay Now
                      </button>
                    )}
                    {booking.paymentStatus === 'Pending' && !isApproved && !['Rejected', 'Cancelled'].includes(booking.status) && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">Pay Now (Disabled)</span>
                    )}
                    {booking.paymentStatus === 'Claimed' && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Payment Under Review</span>
                    )}
                    {booking.paymentStatus === 'Paid' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle size={10} /> Paid
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Book a Class Modal ────────────────────────────────────────────────── */}
      {showBookingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Book a Home Tuition Class</h3>
                <p className="text-xs text-slate-500 mt-0.5">Offline / Home Tuition Only</p>
              </div>
              <button onClick={() => setShowBookingForm(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                  <input
                    required value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852]"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class / Grade *</label>
                  <input
                    required value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852]"
                    placeholder="e.g. Class 10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Home Address *</label>
                <input
                  required value={formData.addressFull}
                  onChange={e => setFormData({ ...formData, addressFull: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852] mb-2"
                  placeholder="House No, Street Name"
                />
                <input
                  required value={formData.addressArea}
                  onChange={e => setFormData({ ...formData, addressArea: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852]"
                  placeholder="Area, City, Pincode"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date/Time</label>
                  <input
                    type="datetime-local" value={formData.scheduledAt}
                    onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number" value={formData.amount} min={0}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852]"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message (Optional)</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#056852] min-h-[80px] resize-none"
                  placeholder="Any specific requirements or preferences..."
                />
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-700">
                <strong>Mode:</strong> Offline / Home Tuition • <strong>Status:</strong> Pending Admin Review
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowBookingForm(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[#056852] text-white text-sm font-bold rounded-xl hover:bg-[#045241] transition disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QR Payment Modal ──────────────────────────────────────────────────── */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-5 text-center">
            <h3 className="text-lg font-bold text-slate-800">Pay via UPI / QR</h3>
            <p className="text-xs text-slate-500">Scan the QR code below to pay. After payment, click "I Have Paid".</p>

            {/* Dynamic QR Codes */}
            {paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethodId(method.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${selectedPaymentMethodId === method.id ? 'bg-[#056852] text-white border-[#056852]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {method.label || 'UPI'}
                      </button>
                    ))}
                  </div>
                )}
                
                {(() => {
                  const method = paymentMethods.find(m => m.id === selectedPaymentMethodId) || paymentMethods[0];
                  return (
                    <div className="mx-auto w-56 h-56 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden p-2">
                      {method.qrImage ? (
                        <img src={method.qrImage} alt="Admin UPI QR" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <>
                          <QrCode size={80} className="text-slate-400 mb-2" />
                          <p className="text-xs text-slate-500 font-bold">{method.label || 'Admin UPI'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{method.upiId || 'No UPI ID'}</p>
                        </>
                      )}
                    </div>
                  );
                })()}
                
                <p className="text-xs font-bold text-slate-600">
                  UPI ID: <span className="text-[#056852] bg-emerald-50 px-2 py-1 rounded">{(paymentMethods.find(m => m.id === selectedPaymentMethodId) || paymentMethods[0]).upiId || 'N/A'}</span>
                </p>
              </div>
            ) : (
              <div className="mx-auto w-56 h-56 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center">
                <QrCode size={80} className="text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 font-bold">Admin UPI QR</p>
                <p className="text-[10px] text-slate-400 mt-1">Contact admin for QR code</p>
              </div>
            )}

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-sm font-bold text-amber-800">
                Amount: ₹{bookings.find(b => (b._id || b.id) === showQr)?.amount || 0}
              </p>
              <p className="text-[10px] text-amber-600 mt-1">Pay via any UPI app (GPay, PhonePe, Paytm)</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQr(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClaimPayment(showQr)}
                className="flex-1 px-4 py-2.5 bg-[#056852] text-white text-sm font-bold rounded-xl hover:bg-[#045241] transition"
              >
                I Have Paid ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
