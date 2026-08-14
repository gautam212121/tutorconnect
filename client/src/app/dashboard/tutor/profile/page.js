"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api';
import { Edit2 } from 'lucide-react';

export default function TutorProfilePage() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ experience: '', education: '', subjects: '', availability: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('verifiedtutor-user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setFormData({
         experience: u.experience || '8 years',
         education: u.education || 'M.Sc. Physics',
         subjects: u.subjects ? (typeof u.subjects === 'string' ? u.subjects : u.subjects.join(', ')) : 'Physics, Maths',
         availability: u.availability || 'Weekdays 9am–7pm'
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updatedUser = await fetchApi('/api/v1/tutor/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
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

  if (!user) return <div className="p-8 text-slate-500">Loading profile...</div>;

  const items = [
    { label: 'Experience', value: formData.experience },
    { label: 'Education', value: formData.education },
    { label: 'Subjects', value: formData.subjects },
    { label: 'Availability', value: formData.availability },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{user.name}'s Details</h1>
            <p className="mt-2 text-sm text-slate-500">Manage your experience, education, subjects and availability.</p>
          </div>
          {!isEditing && (
             <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#056852] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#045242] transition">
               <Edit2 size={16} /> Edit Profile
             </button>
          )}
        </section>

        {isEditing ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
             <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                  <input type="text" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Education</label>
                  <input type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subjects Taught (comma separated)</label>
                  <input type="text" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Availability</label>
                  <input type="text" value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#056852] text-white hover:bg-[#045242]">Save Changes</button>
                </div>
             </form>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                <p className="mt-4 text-base font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
