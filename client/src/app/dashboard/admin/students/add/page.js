"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi, api } from '../../../../../lib/api';

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    grade: '',
    parentName: '',
    addressFull: '',
    city: '',
    status: 'active',
    role: 'student',
    tutorId: '',
    subject: ''
  });

  const [tutors, setTutors] = useState([]);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await adminApi.getUsers('tutor');
        setTutors(res || []);
      } catch (err) {
        console.error('Failed to fetch tutors', err);
      }
    };
    fetchTutors();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: 'student',
        status: formData.status,
        classLevel: formData.grade,
        grade: formData.grade,
        parentName: formData.parentName,
        address: {
          full: formData.addressFull,
          city: formData.city
        }
      };

      const res = await adminApi.createUser(payload);
      if (res && (res._id || res.id)) {
        
        // If a tutor is selected, create a booking/assignment
        if (formData.tutorId) {
          try {
            await api.post('bookings', {
              studentId: res._id || res.id,
              tutorId: formData.tutorId,
              subject: formData.subject || 'General Studies',
              grade: formData.grade || 'N/A',
              examType: 'General',
              mode: 'Home'
            });
            setSuccess('Student added and tutor assigned successfully!');
          } catch (bookingErr) {
            console.error(bookingErr);
            setError('Student created, but failed to assign tutor automatically.');
          }
        } else {
          setSuccess('Student added successfully!');
        }

        setTimeout(() => {
          router.push('/dashboard/admin/students');
          window.location.href = '/dashboard/admin/students';
        }, 1500);
      } else {
        setError('Failed to create student. Please check input data.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while adding student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto bg-slate-50 min-h-screen">
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-6">
        <Link href="/dashboard/admin" className="hover:text-emerald-600 transition">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/admin/students" className="hover:text-emerald-600 transition">Students</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Add New Student</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Add New Student</h1>
            <p className="text-xs text-slate-500">Register a new student profile into the system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-semibold border border-rose-100">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-semibold border border-emerald-100">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="Student's name" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="Email address" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mobile Number</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="e.g. +91 9876543210" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Password *</label>
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="Set initial password" />
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Class / Grade</label>
              <input type="text" name="grade" value={formData.grade} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="e.g. Class 10" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white transition">
                <option value="active">Active</option>
                <option value="verified">Verified</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parent Name</label>
              <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="Father / Mother name" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition" placeholder="e.g. Lucknow" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Address</label>
              <textarea name="addressFull" value={formData.addressFull} onChange={handleChange} rows="2" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition resize-none" placeholder="Complete residential address" />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Tutor Assignment Section */}
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-800 mb-4">Initial Tutor Assignment (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">Assign a Tutor</label>
                <select name="tutorId" value={formData.tutorId} onChange={handleChange} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white transition text-slate-700">
                  <option value="">-- No Tutor Assigned Yet --</option>
                  {tutors.map(t => (
                    <option key={t._id || t.id} value={t._id || t.id}>{t.name} {t.subjects && t.subjects.length > 0 ? `(${t.subjects.join(', ')})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">Subject to Assign</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white transition" placeholder="e.g. Mathematics" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/dashboard/admin/students" className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition text-sm">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-2 text-sm disabled:opacity-70">
              {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
