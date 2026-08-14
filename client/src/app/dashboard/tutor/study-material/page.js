"use client";

import { useState } from 'react';
import { usePoll, fetchApi } from '../../../lib/api';
import { FileText, Video, HelpCircle, Plus, BookOpen, Trash2 } from 'lucide-react';

export default function TutorStudyMaterialPage() {
  const { data: materials = [], loading, reload } = usePoll('/api/v1/tutor/study-materials', 15000, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', fileUrl: '', courseId: '', type: 'PDF' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/api/v1/tutor/study-materials', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ title: '', fileUrl: '', courseId: '', type: 'PDF' });
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      await fetchApi(`/api/v1/tutor/study-materials/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && materials.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading materials...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Study Material</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Learning resources</h1>
            <p className="mt-2 text-sm text-slate-500">Upload and manage PDFs, videos, and class notes.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#056852] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#045242] transition"
          >
            <Plus size={16} /> Upload Material
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { title: 'PDF & Notes', count: materials.filter(m => m.type === 'PDF' || m.type === 'Notes').length, icon: <FileText size={18} /> },
            { title: 'Recorded Videos', count: materials.filter(m => m.type === 'Video').length, icon: <Video size={18} /> },
            { title: 'Other Resources', count: materials.filter(m => !['PDF','Notes','Video'].includes(m.type)).length, icon: <HelpCircle size={18} /> },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{item.count} items</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
           <p className="text-sm font-bold text-slate-900 mb-6">Uploaded Materials</p>
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {materials.length === 0 ? (
               <div className="col-span-full py-8 text-center text-xs text-slate-400">No study materials uploaded.</div>
             ) : materials.map((m) => (
               <div key={m.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                         {m.type === 'Video' ? <Video size={16} /> : <FileText size={16} />}
                       </div>
                       <div>
                         <p className="font-bold text-slate-900 text-sm leading-tight">{m.title}</p>
                         <p className="text-[10px] text-slate-500">{m.type}</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-3">
                    <a href={m.fileUrl || '#'} target="_blank" className="text-xs font-bold text-[#056852] hover:underline">View File</a>
                    <button onClick={() => handleDelete(m.id)} className="text-rose-500 hover:text-rose-700 transition">
                       <Trash2 size={14} />
                    </button>
                  </div>
               </div>
             ))}
           </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
             <h3 className="text-lg font-bold text-slate-900 mb-4">Upload New Material</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="e.g. Chapter 1 Notes" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Resource Type</label>
                 <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm">
                    <option value="PDF">PDF Document</option>
                    <option value="Notes">Notes (Text)</option>
                    <option value="Video">Video Link</option>
                    <option value="Other">Other</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">File URL</label>
                 <input type="url" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="https://drive.google.com/..." />
                 <p className="text-[10px] text-slate-400 mt-1">Provide a link to the uploaded file.</p>
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#056852] text-white hover:bg-[#045242] disabled:opacity-50">
                   {isSubmitting ? 'Uploading...' : 'Upload'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </main>
  );
}
