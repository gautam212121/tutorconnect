"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { Edit2, ShieldAlert, FileUser, User, Save, X, Phone, Mail } from 'lucide-react';

export default function TutorProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    experience: '',
    education: '',
    subjects: '',
    availability: '',
    bio: '',
    headline: '',
    price: '',
    location: '',
    avatar: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('verifiedtutor-user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setFormData({
         experience: u.experience || 'Not set',
         education: u.education || u.qualification || 'Not set',
         subjects: u.subjects ? (typeof u.subjects === 'string' ? u.subjects : u.subjects.join(', ')) : 'Not set',
         availability: u.availability || 'Not set',
         bio: u.bio || 'No bio written yet',
         headline: u.headline || 'Professional Tutor',
         price: u.price || 0,
         location: u.location || u.address?.area || 'Not set',
         avatar: u.avatar || ''
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedUser = await fetchApi('/api/v1/tutor/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          subjects: formData.subjects.split(',').map((s) => s.trim())
        })
      });
      setUser(updatedUser);
      localStorage.setItem('verifiedtutor-user', JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="p-8 text-slate-500 animate-pulse font-bold text-sm">Loading profile...</div>;

  const items = [
    { label: 'Headline', value: formData.headline },
    { label: 'Bio / About', value: formData.bio },
    { label: 'Experience', value: formData.experience },
    { label: 'Education / Qualification', value: formData.education },
    { label: 'Subjects', value: formData.subjects },
    { label: 'Availability', value: formData.availability },
    { label: 'Hourly Charge (INR)', value: `₹${formData.price}/hr` },
    { label: 'Preferred Location', value: formData.location },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Block */}
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#056852] text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
              {formData.avatar ? <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Tutor Profile</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-xs text-slate-500 font-medium">Verification Status: <span className="text-emerald-600 font-bold">Verified Professional</span></p>
            </div>
          </div>
          {!isEditing && (
             <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#056852] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#045242] transition shadow-xs">
               <Edit2 size={16} /> Edit Profile
             </button>
          )}
        </section>

        {isEditing ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
             <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
                
                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex gap-3 text-amber-800 text-xs font-semibold mb-6">
                  <ShieldAlert size={16} className="shrink-0 text-amber-600" />
                  <p>Security lock enabled: Your full legal name, phone number, and email are locked and cannot be updated directly for platform transparency. Contact Support to correct them.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Legal Name (Protected)</label>
                    <input type="text" value={user.name} disabled className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile / Phone (Protected)</label>
                    <input type="text" value={user.mobile} disabled className="w-full border-slate-200 bg-slate-50 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Image URL</label>
                    <input type="text" value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="https://..." className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Professional Title / Headline</label>
                    <input type="text" value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio / About Profile Summary</label>
                  <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={4} className="w-full border-slate-200 rounded-xl text-sm" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience (e.g. 5 Years)</label>
                    <input type="text" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Education / Qualification</label>
                    <input type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subjects Taught (comma separated)</label>
                    <input type="text" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hourly Charge (INR)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Availability Description</label>
                    <input type="text" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Teaching Location Area</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
                    <X size={14} /> Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#056852] text-white hover:bg-[#045242] transition">
                    <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
             </form>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{item.label}</span>
                <p className="mt-4 text-sm font-bold text-slate-800 leading-relaxed">{item.value}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
