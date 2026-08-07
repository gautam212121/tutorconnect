"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft, Upload, FileText } from 'lucide-react';

export default function CareersPage() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const initialForm = {
    // 1. Personal
    name: '', email: '', phone: '', gender: '', dob: '',
    address: { city: '', state: '', pincode: '', full: '' },
    // 2. Education
    education: { highestQualification: '', degree: '', college: '', passingYear: '', percentage: '' },
    // 3. Teaching
    teaching: { subjects: [], classes: [], boards: [], medium: [], mode: [], individualOrGroup: '' },
    // 4. Experience
    experienceDetails: { type: 'Fresher', totalExperience: '', previousSchool: '', onlineExperience: '', homeTuitionExperience: '' },
    // 5. Availability
    availability: { availableDays: [], timeSlots: [], canTravel: false, maxDistance: '' },
    // 6. Fees
    fees: { hourly: '', monthly: '', negotiable: false },
    // 7. Skills & Languages
    skills: { languages: [], certifications: '', computerSkills: '', communicationSkills: 'Good' },
    // 8. Documents
    documents: { resumeUrl: '', photoUrl: '', idUrl: '' },
    // Declaration
    declaration: { agreed: false, backgroundCheck: false }
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const saved = localStorage.getItem('tutor-application-draft');
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem('tutor-application-draft', JSON.stringify(form));
    alert('Draft saved successfully!');
  };

  const handleArrayToggle = (section, field, value) => {
    setForm(prev => {
      const arr = prev[section][field];
      const newArr = arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value];
      return { ...prev, [section]: { ...prev[section], [field]: newArr } };
    });
  };

  const handleFileChange = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Convert to base64 for MVP simplicity (avoids need for cloud storage setup immediately)
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        documents: { ...prev.documents, [docType]: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep) => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!form.name || !form.email || !form.phone || !form.gender || !form.dob) return setErrorMsg('Please fill all required Personal Info fields.');
    }
    if (currentStep === 2) {
      if (!form.education.highestQualification || !form.education.college) return setErrorMsg('Qualification and College are required.');
    }
    if (currentStep === 3) {
      if (form.teaching.subjects.length === 0 || form.teaching.classes.length === 0) return setErrorMsg('Select at least one Subject and Class.');
    }
    if (currentStep === 8) {
      if (!form.declaration.agreed || !form.declaration.backgroundCheck) return setErrorMsg('You must agree to the declarations.');
      // if (!form.documents.resumeUrl) return setErrorMsg('Resume is required');
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/careers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      
      setStatus('success');
      localStorage.removeItem('tutor-application-draft');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-emerald-100">
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-slate-600 mb-6">
            Thank you for applying to TutorConnect. Our team will review your profile and get back to you shortly.
          </p>
          <Link href="/" className="inline-flex rounded-xl bg-[#056852] px-6 py-3 text-sm font-bold text-white hover:bg-[#045241] transition shadow-md">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 relative py-8 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-4xl flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <Briefcase size={22} className="text-[#056852]" />
          <span>Become a <span className="text-[#056852]">Tutor</span></span>
        </Link>
        <div className="flex gap-2">
          <button onClick={saveDraft} className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-full border border-slate-200 bg-white">Save Draft</button>
          <Link href="/" className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-slate-900 p-6 sm:px-10 flex flex-wrap items-center gap-2">
          {[1,2,3,4,5,6,7,8].map(s => (
            <div key={s} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : step > s ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 8 && <div className={`h-1 w-4 sm:w-8 mx-1 sm:mx-2 rounded-full ${step > s ? 'bg-emerald-900' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-10">
          {errorMsg && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              <AlertCircle size={20} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">1. Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Full Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Email Address *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Mobile Number *</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Date of Birth *</label><input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Gender *</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none">
                    <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mt-4">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-3"><input type="text" placeholder="Full Address" value={form.address.full} onChange={e => setForm({...form, address: {...form.address, full: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><input type="text" placeholder="City" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><input type="text" placeholder="State" value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><input type="text" placeholder="Pincode" value={form.address.pincode} onChange={e => setForm({...form, address: {...form.address, pincode: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
              </div>
            </div>
          )}

          {/* STEP 2: Education */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">2. Education Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Highest Qualification *</label><input type="text" placeholder="e.g. Master's Degree" value={form.education.highestQualification} onChange={e => setForm({...form, education: {...form.education, highestQualification: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Degree / Course</label><input type="text" placeholder="e.g. M.Sc Mathematics" value={form.education.degree} onChange={e => setForm({...form, education: {...form.education, degree: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold text-slate-600 block mb-1.5">College / University *</label><input type="text" value={form.education.college} onChange={e => setForm({...form, education: {...form.education, college: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Passing Year</label><input type="text" value={form.education.passingYear} onChange={e => setForm({...form, education: {...form.education, passingYear: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Percentage / CGPA</label><input type="text" value={form.education.percentage} onChange={e => setForm({...form, education: {...form.education, percentage: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
              </div>
            </div>
          )}

          {/* STEP 3: Teaching Details */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">3. Teaching Preferences</h3>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Subjects You Can Teach *</label>
                <div className="flex flex-wrap gap-2">
                  {['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Coding'].map(sub => (
                    <button key={sub} onClick={() => handleArrayToggle('teaching', 'subjects', sub)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${form.teaching.subjects.includes(sub) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{sub}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Classes You Can Teach *</label>
                <div className="flex flex-wrap gap-2">
                  {['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College/Degree', 'Competitive Exams'].map(cls => (
                    <button key={cls} onClick={() => handleArrayToggle('teaching', 'classes', cls)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${form.teaching.classes.includes(cls) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{cls}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-2">Boards</label>
                  <div className="flex flex-wrap gap-2">
                    {['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'].map(b => (
                      <button key={b} onClick={() => handleArrayToggle('teaching', 'boards', b)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${form.teaching.boards.includes(b) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{b}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-2">Teaching Mode</label>
                  <div className="flex flex-wrap gap-2">
                    {['Online', 'Home Tuition', 'Student Home'].map(m => (
                      <button key={m} onClick={() => handleArrayToggle('teaching', 'mode', m)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${form.teaching.mode.includes(m) ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Experience */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">4. Experience Details</h3>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Experience Type</label>
                <div className="flex gap-4">
                  {['Fresher', 'Experienced'].map(t => (
                    <button key={t} onClick={() => setForm({...form, experienceDetails: {...form.experienceDetails, type: t}})} className={`flex-1 py-3 rounded-xl border font-bold text-sm ${form.experienceDetails.type === t ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{t}</button>
                  ))}
                </div>
              </div>
              {form.experienceDetails.type === 'Experienced' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                  <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Total Experience (Years)</label><input type="text" value={form.experienceDetails.totalExperience} onChange={e => setForm({...form, experienceDetails: {...form.experienceDetails, totalExperience: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Previous School/Institute</label><input type="text" value={form.experienceDetails.previousSchool} onChange={e => setForm({...form, experienceDetails: {...form.experienceDetails, previousSchool: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Online Teaching Experience</label><input type="text" value={form.experienceDetails.onlineExperience} onChange={e => setForm({...form, experienceDetails: {...form.experienceDetails, onlineExperience: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Home Tuition Experience</label><input type="text" value={form.experienceDetails.homeTuitionExperience} onChange={e => setForm({...form, experienceDetails: {...form.experienceDetails, homeTuitionExperience: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 & 6: Availability & Fees */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">5. Availability</h3>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <button key={d} onClick={() => handleArrayToggle('availability', 'availableDays', d)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${form.availability.availableDays.includes(d) ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Time Slots</label>
                <div className="flex flex-wrap gap-2">
                  {['Morning (6AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-9PM)', 'Night (9PM+)'].map(s => (
                    <button key={s} onClick={() => handleArrayToggle('availability', 'timeSlots', s)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${form.availability.timeSlots.includes(s) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{s}</button>
                  ))}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2 pt-6">6. Fee Expectations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Hourly Fees (₹)</label>
                  <input type="number" placeholder="e.g. 500" value={form.fees.hourly} onChange={e => setForm({...form, fees: {...form.fees, hourly: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Monthly Fees (₹)</label>
                  <input type="number" placeholder="e.g. 5000" value={form.fees.monthly} onChange={e => setForm({...form, fees: {...form.fees, monthly: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="checkbox" id="negotiable" checked={form.fees.negotiable} onChange={e => setForm({...form, fees: {...form.fees, negotiable: e.target.checked}})} className="w-5 h-5 accent-emerald-500" />
                  <label htmlFor="negotiable" className="text-sm font-semibold text-slate-700">Open to negotiation</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Skills */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">7. Skills & Languages</h3>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Languages Known</label>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'French', 'German'].map(l => (
                    <button key={l} onClick={() => handleArrayToggle('skills', 'languages', l)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${form.skills.languages.includes(l) ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Teaching Certifications</label><input type="text" placeholder="e.g. B.Ed, TEFL, CTET" value={form.skills.certifications} onChange={e => setForm({...form, skills: {...form.skills, certifications: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Computer Skills</label><input type="text" placeholder="e.g. MS Office, Zoom, Whiteboard tools" value={form.skills.computerSkills} onChange={e => setForm({...form, skills: {...form.skills, computerSkills: e.target.value}})} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 outline-none" /></div>
              </div>
            </div>
          )}

          {/* STEP 8: Documents & Declaration */}
          {step === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-xl font-bold text-slate-900 border-b pb-2">8. Documents & Declaration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'resumeUrl', label: 'Resume (PDF/Doc)', icon: FileText },
                  { id: 'photoUrl', label: 'Profile Photo (JPG)', icon: Briefcase },
                  { id: 'idUrl', label: 'Govt ID (Aadhaar/PAN)', icon: CheckCircle2 }
                ].map(doc => (
                  <div key={doc.id} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input type="file" onChange={e => handleFileChange(e, doc.id)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept={doc.id === 'resumeUrl' ? '.pdf,.doc,.docx' : 'image/*'} />
                    <doc.icon size={24} className={`mx-auto mb-2 ${form.documents[doc.id] ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <p className="text-xs font-bold text-slate-700">{doc.label}</p>
                    {form.documents[doc.id] && <p className="text-[10px] text-emerald-600 mt-1 font-semibold">✓ Uploaded</p>}
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="agreed" checked={form.declaration.agreed} onChange={e => setForm({...form, declaration: {...form.declaration, agreed: e.target.checked}})} className="w-5 h-5 mt-0.5 accent-emerald-500 shrink-0" />
                  <label htmlFor="agreed" className="text-sm text-slate-700">I hereby declare that all information provided is true and correct to the best of my knowledge.</label>
                </div>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="bgcheck" checked={form.declaration.backgroundCheck} onChange={e => setForm({...form, declaration: {...form.declaration, backgroundCheck: e.target.checked}})} className="w-5 h-5 mt-0.5 accent-emerald-500 shrink-0" />
                  <label htmlFor="bgcheck" className="text-sm text-slate-700">I consent to TutorConnect conducting a background verification using the provided documents.</label>
                </div>
              </div>
            </div>
          )}

          {/* Form Controls */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button onClick={handleBack} className="flex h-14 px-6 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                <ChevronLeft size={18} /> Back
              </button>
            )}
            
            {step < 7 ? (
              <button onClick={handleNext} className="flex-1 flex h-14 items-center justify-center gap-2 rounded-xl bg-[#056852] font-bold text-white shadow-lg shadow-[#056852]/20 hover:bg-[#045241] transition">
                Continue to Step {step + 1} <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={status === 'loading'} className="flex-1 flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition disabled:opacity-70">
                {status === 'loading' ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : 'Submit Application'}
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
