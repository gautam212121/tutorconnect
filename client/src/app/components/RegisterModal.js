"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User, AlertCircle, CheckCircle2, ChevronRight, Loader2, X } from 'lucide-react';

export default function RegisterModal({ isOpen, onClose, initialRole = 'student' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', grade: '', address: '', role: initialRole,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      setForm({ name: '', mobile: '', email: '', grade: '', address: '', role: initialRole });
      setError('');
      setSuccess('');
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, initialRole]);

  if (!isOpen) return null;

  const validate = () => {
    setError('');
    if (!form.name) return setError('Full Name is required');
    if (!form.mobile) return setError('Phone number is required');
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Valid email is required');
    if (!form.grade) return setError('Please select a class/course');
    if (!form.address) return setError('Address is required');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ' ';

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/student-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.mobile,
          email: form.email,
          grade: form.grade,
          address: form.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      setSuccess('Student registered successfully. Login credentials will be sent to the email address.');
      setTimeout(() => {
        onClose();
        router.push('/dashboard/admin/students');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Click outside container to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-xl rounded-[32px] border border-slate-200 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 shrink-0 pr-8 pl-8">
          <h2 className="text-2xl font-extrabold text-slate-900">
            {form.role === 'tutor' ? 'Teacher Registration' : 'Student Registration'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {form.role === 'tutor' 
              ? 'Join VerifiedTutor and start earning as a teacher' 
              : 'Join VerifiedTutor to find your perfect tutor'}
          </p>
        </div>

        {/* Form Body Scrollable Container */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:bg-white outline-none transition" placeholder="Aarav Sharma" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Phone Number *</label>
                <input type="text" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 focus:bg-white outline-none transition" placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:bg-white outline-none transition" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Course / Class *</label>
                <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none transition">
                  <option value="">Select...</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                  <option value="English">English</option>
                  <option value="Maths">Maths</option>
                  <option value="Science">Science</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600">Address *</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none transition" placeholder="Enter your full address" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 shrink-0">
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={loading} 
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#056852] py-3 text-sm font-bold text-white shadow-lg shadow-[#056852]/20 transition hover:bg-[#045241] disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Registration'}
          </button>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Are you a tutor looking to teach?{' '}
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/careers');
                }} 
                className="font-bold text-[#056852] hover:underline bg-transparent border-none p-0 inline cursor-pointer outline-none"
              >
                Apply for Job Careers
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
