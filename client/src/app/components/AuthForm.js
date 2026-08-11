"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Calendar, BookOpen, Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

export default function AuthForm({ mode = 'login' }) {
  const [step, setStep] = useState(1);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

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

  const handleSendLoginOtp = async () => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError('Please enter a valid registered email address');
    }

    setSendingOtp(true);
    setError('');
    setSuccess('');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send Login OTP');

      setOtpSent(true);
      setSuccess(data.message || 'OTP sent successfully to your email address!');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length < 6) {
      return setError('Please enter the complete 6-digit OTP code');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: otpValue }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP Login failed');

      localStorage.setItem('tutorconnect-token', data.token);
      localStorage.setItem('tutorconnect-user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess('Signed in successfully with OTP! Redirecting...');

      setTimeout(() => {
        const role = data.user.role;
        const destination = role === 'admin' ? '/dashboard/admin' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/student';
        router.push(destination);
      }, 600);
    } catch (err) {
      setError(err.message || 'OTP Verification failed');
      setLoading(false);
    }
  };

  const submitAuth = async () => {
    if (mode === 'register' && !validateStep(4)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

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
      const firebaseUser = result.user;
      const idToken = credential?.idToken || (await firebaseUser.getIdToken());

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';
      const response = await fetch(`${baseUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: idToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          picture: firebaseUser.photoURL,
          googleId: firebaseUser.uid,
        }),
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
        {/* Login Method Toggle Tabs */}
        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setUseOtpLogin(false);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${!useOtpLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setUseOtpLogin(true);
              setError('');
              setSuccess('');
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${useOtpLogin ? 'bg-white text-[#056852] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🔑 Login with OTP
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-medium text-rose-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {useOtpLogin ? (
          /* OTP LOGIN FLOW */
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Registered Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  disabled={otpSent}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60"
                  placeholder="student@example.com / tutor@example.com"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendLoginOtp}
                disabled={sendingOtp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#056852] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#045241] shadow-lg shadow-[#056852]/20 disabled:opacity-70"
              >
                {sendingOtp ? <Loader2 size={18} className="animate-spin" /> : 'Send Login OTP'}
                {!sendingOtp && <ArrowRight size={16} />}
              </button>
            ) : (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Enter 6-Digit OTP</label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="w-full rounded-2xl border border-teal-500 bg-white py-3 pl-11 pr-4 text-center tracking-[8px] font-mono text-lg font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
                      placeholder="123456"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpValue('');
                    }}
                    className="text-slate-500 hover:text-slate-800 underline"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendLoginOtp}
                    disabled={sendingOtp}
                    className="text-[#056852] font-semibold hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#056852] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#045241] shadow-lg shadow-[#056852]/20 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify & Login'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD PASSWORD LOGIN */
          <form onSubmit={(e) => { e.preventDefault(); submitAuth(); }} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Password</label>
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
        )}

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
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">I am registering as *</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, role: 'student' })} className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${form.role === 'student' ? 'border-[#056852] bg-emerald-50/50 text-[#056852]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Student / Parent</button>
                <button type="button" onClick={() => setForm({ ...form, role: 'tutor' })} className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${form.role === 'tutor' ? 'border-[#056852] bg-emerald-50/50 text-[#056852]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Teacher / Tutor</button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Mobile Number *</label>
              <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="+91 9876543210" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Email Address *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Password *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${passStrength.color} transition-all duration-300`} style={{ width: `${(passStrength.score / 4) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{passStrength.text}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" placeholder="••••••••" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Date of Birth</label>
                <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Class / Grade *</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none">
                <option value="">Select Class</option>
                {['Class 1-5', 'Class 6-8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'IIT-JEE', 'NEET', 'College/Degree', 'Other'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Educational Board *</label>
              <select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none">
                <option value="">Select Board</option>
                {['CBSE', 'ICSE', 'State Board (UP)', 'IGCSE', 'IB', 'Other'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">School Name</label>
              <input type="text" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900" placeholder="e.g. CMS Lucknow" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Medium of Instruction</label>
              <select value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none">
                <option value="">Select Medium</option>
                <option value="English">English Medium</option>
                <option value="Hindi">Hindi Medium</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">City *</label>
              <input type="text" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900" placeholder="Lucknow" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Area / Locality</label>
              <input type="text" value={form.address.area} onChange={(e) => setForm({ ...form, address: { ...form.address, area: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900" placeholder="Gomti Nagar, Aliganj, etc." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Pincode *</label>
                <input type="text" value={form.address.pincode} onChange={(e) => setForm({ ...form, address: { ...form.address, pincode: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900" placeholder="226010" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">State</label>
                <input type="text" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900" placeholder="Uttar Pradesh" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Classes Per Week</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 5, 6].map(num => (
                  <button key={num} type="button" onClick={() => setForm({ ...form, schedule: { ...form.schedule, classesPerWeek: num } })} className={`rounded-xl border p-2 text-xs font-bold transition ${form.schedule.classesPerWeek === num ? 'border-[#056852] bg-emerald-50 text-[#056852]' : 'border-slate-200 text-slate-600'}`}>{num} Days</button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">Preferred Session Duration</label>
              <select value={form.schedule.duration} onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, duration: e.target.value } })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs text-slate-900 outline-none">
                <option value="1 Hour">1 Hour / Session</option>
                <option value="1.5 Hours">1.5 Hours / Session</option>
                <option value="2 Hours">2 Hours / Session</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={16} /> Back
            </button>
          )}

          {step < 4 ? (
            <button type="button" onClick={handleNext} className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#056852] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#045241]">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={submitAuth} disabled={loading} className="ml-auto flex items-center gap-2 rounded-xl bg-[#056852] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#045241] disabled:opacity-70">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
