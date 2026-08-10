"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

export default function AuthForm({ mode = 'login' }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1: Account Info
    name: '', mobile: '', email: '', password: '', confirmPassword: '', role: 'student',
    // Step 2: Student Info
    dob: '', gender: '', grade: '', board: '', school: '', medium: '',
    // Step 3: Location
    address: { country: 'India', state: '', city: '', area: '', pincode: '' },
    // Step 4: Schedule
    schedule: { days: [], slots: [], startDate: '', classesPerWeek: 3, duration: '1 Hour' }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Poor', color: 'bg-slate-200' };
    if (pass.length > 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) {
      return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
    }
    if (pass.length > 6 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { score: 3, text: 'Good', color: 'bg-teal-500' };
    }
    if (pass.length >= 6) {
      return { score: 2, text: 'Fair', color: 'bg-amber-500' };
    }
    return { score: 1, text: 'Weak', color: 'bg-rose-500' };
  };

  const passStrength = getPasswordStrength(form.password);

  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 1) {
      if (!form.name) return setError('Full Name is required');
      if (!form.mobile) return setError('Mobile number is required');
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Valid email is required');
      if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters');
      if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    }
    if (currentStep === 2) {
      if (!form.grade) return setError('Please select a Class/Grade');
      if (!form.board) return setError('Please select a Board');
    }
    if (currentStep === 3) {
      if (!form.address.city || !form.address.pincode) return setError('City and Pincode are required');
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const submitAuth = async () => {
    if (mode === 'register' && !validateStep(4)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const payload = mode === 'register' ? form : { email: form.email, password: form.password };
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      localStorage.setItem('tutorconnect-token', data.token);
      localStorage.setItem('tutorconnect-user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess(mode === 'register' ? 'Account created successfully! Redirecting...' : 'Signed in successfully! Redirecting...');

      setTimeout(() => {
        const role = data.user.role;
        const destination = role === 'admin' ? '/dashboard/admin' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';
        router.push(destination);
      }, 600);
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error('Failed to retrieve Google ID token.');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google Authentication failed');

      localStorage.setItem('tutorconnect-token', data.token);
      localStorage.setItem('tutorconnect-user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess('Signed in successfully with Google! Redirecting...');

      setTimeout(() => {
        const role = data.user.role;
        const destination = role === 'admin' ? '/dashboard/admin' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';
        router.push(destination);
      }, 600);
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError(err.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  const handleArrayToggle = (field, subfield, value) => {
    setForm(prev => {
      const arr = prev[field][subfield];
      const newArr = arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value];
      return { ...prev, [field]: { ...prev[field], [subfield]: newArr } };
    });
  };

  if (mode === 'login') {
    return (
      <div className="w-full">
        {error && <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium text-rose-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span></div>}
        {success && <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={18} className="shrink-0" /><span>{success}</span></div>}
        
        <form onSubmit={(e) => { e.preventDefault(); submitAuth(); }} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#056852] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#045241] shadow-lg shadow-[#056852]/20 disabled:opacity-70">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span></div>
        </div>

        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-70">
          <svg className="h-5 w-5 animate-none" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38C16.88,16.3,14.7,17.7,12,17.7c-3.15,0-5.7-2.55-5.7-5.7s2.55-5.7,5.7-5.7c1.37,0,2.63,0.48,3.63,1.3l2.03-2.03C16.12,4.1,14.18,3.3,12,3.3c-4.8,0-8.7,3.9-8.7,8.7s3.9,8.7,8.7,8.7c4.6,0,8.3-3.3,8.3-8.7C20.3,11.7,20.32,11.1,21.35,11.1Z" fill="#34A853" />
              <path d="M12,3.3c2.18,0,4.12,0.8,5.66,2.27l2.03-2.03C17.66,1.72,14.98,0.6,12,0.6,7.2,0.6,3.3,4.5,3.3,9.3l3.63-2.82C7.82,4.78,9.75,3.3,12,3.3Z" fill="#EA4335" />
              <path d="M3.3,9.3c-0.38,1.15-0.6,2.37-0.6,3.65s0.22,2.5,0.6,3.65l3.63-2.82c-0.18-0.54-0.28-1.12-0.28-1.73s0.1-1.19,0.28-1.73Z" fill="#FBBC05" />
              <path d="M12,17.7c-2.25,0-4.18-1.48-5.07-3.52L3.3,17c1.88,3.7,5.75,6.3,10.2,6.3,4.6,0,8.3-3.3,8.3-8.7h-5.38C16.88,16.3,14.7,17.7,12,17.7Z" fill="#4285F4" />
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    );
  }

  // REGISTER MODE (MULTI-STEP)
  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="mb-6 flex items-center justify-between">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${step >= s ? 'bg-[#056852] text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
              {s}
            </div>
            {s !== 4 && <div className={`h-1 flex-1 mx-2 rounded-full transition ${step > s ? 'bg-[#056852]' : 'bg-slate-100'}`} />}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">
          {step === 1 && 'Account Information'}
          {step === 2 && 'Student Information'}
          {step === 3 && 'Location Details'}
          {step === 4 && 'Schedule Preferences'}
        </h3>
      </div>

      {error && <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium text-rose-700"><AlertCircle size={18} className="shrink-0" /><span>{error}</span></div>}

      <div className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Full Name *</label>
              <div className="relative"><User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none" placeholder="Aarav Sharma" /></div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Mobile Number *</label>
              <input type="text" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Email Address *</label>
              <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none" placeholder="you@example.com" /></div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Password *</label>
              <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <div className="mt-2 flex gap-1 h-1.5 w-full">
                {[1,2,3,4].map(n => <div key={n} className={`h-full flex-1 rounded-full ${n <= passStrength.score ? passStrength.color : 'bg-slate-100'}`} />)}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-400 text-right">{passStrength.text}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Confirm Password *</label>
              <div className="relative"><Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none" placeholder="••••••••" /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Class/Grade *</label>
                <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none">
                  <option value="">Select...</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                  <option value="College">College</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Board *</label>
                <select value={form.board} onChange={e => setForm({...form, board: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none">
                  <option value="">Select...</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">IB</option>
                  <option value="IGCSE">IGCSE</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">School/College Name</label>
              <div className="relative"><BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={form.school} onChange={e => setForm({...form, school: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 outline-none" placeholder="Apex Academy" /></div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Medium</label>
              <div className="flex gap-2">
                {['English', 'Hindi', 'Both'].map(m => (
                  <button key={m} type="button" onClick={() => setForm({...form, medium: m})} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${form.medium === m ? 'border-[#056852] bg-[#e6f7f2] text-[#056852]' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'}`}>{m}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">State</label>
                <input type="text" value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" placeholder="e.g. Maharashtra" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">City *</label>
                <input type="text" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" placeholder="Mumbai" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Area/Locality</label>
                <input type="text" value={form.address.area} onChange={e => setForm({...form, address: {...form.address, area: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" placeholder="Andheri West" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Pincode *</label>
                <input type="text" value={form.address.pincode} onChange={e => setForm({...form, address: {...form.address, pincode: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" placeholder="400053" />
              </div>
            </div>
            <div>
              <button type="button" className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                <MapPin size={16} className="text-blue-500" /> Use Current Location
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Preferred Days</label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <button key={day} type="button" onClick={() => handleArrayToggle('schedule', 'days', day)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${form.schedule.days.includes(day) ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Preferred Time Slots</label>
              <div className="flex flex-wrap gap-2">
                {['Morning', 'Afternoon', 'Evening'].map(slot => (
                  <button key={slot} type="button" onClick={() => handleArrayToggle('schedule', 'slots', slot)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${form.schedule.slots.includes(slot) ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Start Date</label>
                <div className="relative"><Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" value={form.schedule.startDate} onChange={e => setForm({...form, schedule: {...form.schedule, startDate: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm focus:border-teal-500 outline-none" /></div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Classes per week</label>
                <input type="number" min="1" max="7" value={form.schedule.classesPerWeek} onChange={e => setForm({...form, schedule: {...form.schedule, classesPerWeek: e.target.value}})} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm focus:border-teal-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Session Duration</label>
              <div className="flex gap-2">
                {['1 Hour', '1.5 Hours', '2 Hours'].map(d => (
                  <button key={d} type="button" onClick={() => setForm({...form, schedule: {...form.schedule, duration: d}})} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${form.schedule.duration === d ? 'border-[#056852] bg-[#e6f7f2] text-[#056852]' : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'}`}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition">
              <ChevronLeft size={20} />
            </button>
          )}
          {step < 4 ? (
            <button type="button" onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#056852] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#056852]/20 transition hover:bg-[#045241]">
              Next Step <ChevronRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={submitAuth} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
