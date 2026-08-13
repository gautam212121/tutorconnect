"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, User, Phone, MapPin, BookOpen, AlertCircle,
  CheckCircle2, Loader2, X, GraduationCap
} from 'lucide-react';

const FIELD_CONFIG = [
  {
    key: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'e.g. Aarav Sharma',
    icon: User,
    validate: (v) => {
      if (!v.trim()) return 'Full name is required';
      if (v.trim().length < 2) return 'Name must be at least 2 characters';
      return null;
    },
  },
  {
    key: 'mobile',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+91 9876543210',
    icon: Phone,
    validate: (v) => {
      if (!v.trim()) return 'Phone number is required';
      if (!/^\d{10}$/.test(v.replace(/[\s\-+]/g, ''))) return 'Enter a valid 10-digit number';
      return null;
    },
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    icon: Mail,
    validate: (v) => {
      if (!v.trim()) return 'Email address is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
      return null;
    },
  },
  {
    key: 'subject',
    label: 'Subject',
    type: 'text',
    placeholder: 'e.g. Maths, Science, English',
    icon: BookOpen,
    validate: (v) => {
      if (!v.trim()) return 'Subject is required';
      return null;
    },
  },
  {
    key: 'address',
    label: 'Address',
    type: 'textarea',
    placeholder: 'Enter your full address',
    icon: MapPin,
    validate: (v) => {
      if (!v.trim()) return 'Address is required';
      if (v.trim().length < 5) return 'Please enter a complete address';
      return null;
    },
  },
];

const GRADE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Class 1', label: 'Class 1' },
  { value: 'Class 2', label: 'Class 2' },
  { value: 'Class 3', label: 'Class 3' },
  { value: 'Class 4', label: 'Class 4' },
  { value: 'Class 5', label: 'Class 5' },
  { value: 'Class 6', label: 'Class 6' },
  { value: 'Class 7', label: 'Class 7' },
  { value: 'Class 8', label: 'Class 8' },
  { value: 'Class 9', label: 'Class 9' },
  { value: 'Class 10', label: 'Class 10' },
  { value: 'Class 11', label: 'Class 11 (Science)' },
  { value: 'Class 12', label: 'Class 12 (Science)' },
  { value: 'Class 11 Commerce', label: 'Class 11 (Commerce)' },
  { value: 'Class 12 Commerce', label: 'Class 12 (Commerce)' },
  { value: 'JEE', label: 'JEE (Engineering)' },
  { value: 'NEET', label: 'NEET (Medical)' },
  { value: 'UPSC', label: 'UPSC / Govt Exams' },
  { value: 'English Speaking', label: 'English Speaking' },
  { value: 'Other', label: 'Other' },
];

const emptyForm = () => ({
  name: '', mobile: '', email: '', grade: '', subject: '', address: '',
});

export default function RegisterModal({ isOpen, onClose, initialRole = 'student' }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [touched, setTouched] = useState({});
  const [submitErrors, setSubmitErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      setForm(emptyForm());
      setTouched({});
      setSubmitErrors({});
      setSuccess('');
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateField = (key, value) => {
    const config = FIELD_CONFIG.find(f => f.key === key);
    if (config) return config.validate(value);
    if (key === 'grade') return !value ? 'Please select a class / course' : null;
    return null;
  };

  const getAllErrors = () => {
    const errs = {};
    FIELD_CONFIG.forEach(f => {
      const err = f.validate(form[f.key] || '');
      if (err) errs[f.key] = err;
    });
    const gradeErr = validateField('grade', form.grade);
    if (gradeErr) errs.grade = gradeErr;
    return errs;
  };

  const fieldError = (key) => {
    if (submitErrors[key]) return submitErrors[key];
    if (touched[key]) return validateField(key, form[key] || '');
    return null;
  };

  const isFormValid = Object.keys(getAllErrors()).length === 0;

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSubmitErrors(prev => ({ ...prev, [key]: null }));
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  const handleBlur = (key) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  const handleSubmit = async () => {
    const allTouched = {};
    [...FIELD_CONFIG.map(f => f.key), 'grade'].forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);

    const errs = getAllErrors();
    if (Object.keys(errs).length > 0) {
      setSubmitErrors(errs);
      return;
    }

    setLoading(true);
    setSuccess('');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/student-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.mobile.trim(),
          email: form.email.trim().toLowerCase(),
          grade: form.grade,
          subject: form.subject.trim(),
          address: form.address.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      setSuccess('Registered successfully! Login credentials sent to your email.');
      setTimeout(() => {
        onClose();
        router.push('/dashboard/admin/students');
      }, 2000);
    } catch (err) {
      setSubmitErrors({ _global: err.message || 'Unable to connect to the server.' });
      setLoading(false);
    }
  };

  // Input styling — matches 2nd image: clean white, subtle bottom border, no rounded pill
  const inputCls = (hasErr) =>
    `w-full bg-white border-0 border-b ${hasErr ? 'border-red-400' : 'border-gray-200'} 
     py-2.5 px-0 text-sm text-gray-800 placeholder-gray-400 outline-none 
     focus:border-[#056852] transition-colors duration-200`;

  const inputWithIconCls = (hasErr) =>
    `w-full bg-white border-0 border-b ${hasErr ? 'border-red-400' : 'border-gray-200'}
     py-2.5 pl-6 pr-0 text-sm text-gray-800 placeholder-gray-400 outline-none 
     focus:border-[#056852] transition-colors duration-200`;

  const selectCls = (hasErr) =>
    `w-full bg-white border border-gray-200 ${hasErr ? 'border-red-400' : ''} 
     rounded py-2.5 px-3 text-sm text-gray-700 outline-none 
     focus:border-[#056852] transition-colors duration-200 appearance-none cursor-pointer`;

  const labelCls = `block text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal — pure white, clean, matches 2nd image */}
      <div
        className="relative w-full max-w-sm flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="px-7 pt-8 pb-4 text-center shrink-0">
          <h2 style={{ color: '#1a2e2a', fontSize: '20px', fontWeight: '800', margin: '0 0 4px' }}>
            Student Registration
          </h2>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
            Join VerifiedTutor to find your perfect tutor
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-7 pb-4 space-y-4">

          {/* Global error */}
          {submitErrors._global && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertCircle size={14} className="shrink-0" />
              <span>{submitErrors._global}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name */}
          {(() => {
            const err = fieldError('name');
            return (
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    className={inputWithIconCls(!!err)}
                    placeholder="Aarav Sharma"
                  />
                </div>
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}

          {/* Mobile */}
          {(() => {
            const err = fieldError('mobile');
            return (
              <div>
                <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={e => handleChange('mobile', e.target.value)}
                    onBlur={() => handleBlur('mobile')}
                    className={inputWithIconCls(!!err)}
                    placeholder="+91 9876543210"
                    maxLength={15}
                  />
                </div>
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}

          {/* Email */}
          {(() => {
            const err = fieldError('email');
            return (
              <div>
                <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className={inputWithIconCls(!!err)}
                    placeholder="you@example.com"
                  />
                </div>
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}

          {/* Course / Class */}
          {(() => {
            const err = fieldError('grade');
            return (
              <div>
                <label className={labelCls}>Course / Class <span className="text-red-500">*</span></label>
                <select
                  value={form.grade}
                  onChange={e => handleChange('grade', e.target.value)}
                  onBlur={() => handleBlur('grade')}
                  className={selectCls(!!err)}
                >
                  {GRADE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}

          {/* Subject */}
          {(() => {
            const err = fieldError('subject');
            return (
              <div>
                <label className={labelCls}>Subject <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BookOpen size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                    onBlur={() => handleBlur('subject')}
                    className={inputWithIconCls(!!err)}
                    placeholder="e.g. Maths, Science"
                  />
                </div>
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}

          {/* Address */}
          {(() => {
            const err = fieldError('address');
            return (
              <div>
                <label className={labelCls}>Address <span className="text-red-500">*</span></label>
                <textarea
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  rows={2}
                  className={`w-full bg-white border-0 border-b ${err ? 'border-red-400' : 'border-gray-200'} py-2.5 px-0 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#056852] transition-colors duration-200 resize-none`}
                  placeholder="Enter your full address"
                />
                {err && <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10} />{err}</p>}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 shrink-0 space-y-3" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!success}
            style={{
              width: '100%',
              background: isFormValid && !loading && !success ? '#056852' : '#94a3b8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: isFormValid && !loading && !success ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { if (isFormValid && !loading && !success) e.target.style.background = '#045241'; }}
            onMouseLeave={e => { if (isFormValid && !loading && !success) e.target.style.background = '#056852'; }}
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Registering...</>
              : success ? <><CheckCircle2 size={16} /> Registered!</>
              : 'Submit Registration'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: 0 }}>
            Are you a tutor looking to teach?{' '}
            <button
              type="button"
              onClick={() => { onClose(); router.push('/careers'); }}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: '#056852', fontWeight: '700', cursor: 'pointer',
                fontSize: '12px', textDecoration: 'none'
              }}
              onMouseEnter={e => e.target.style.textDecoration = 'underline'}
              onMouseLeave={e => e.target.style.textDecoration = 'none'}
            >
              Apply for Job Careers
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
