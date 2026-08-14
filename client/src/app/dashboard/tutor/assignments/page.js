"use client";

import { useState } from 'react';
import { usePoll, fetchApi } from '../../../lib/api';
import { ClipboardList, Plus, Trash2, Calendar } from 'lucide-react';

export default function TutorAssignmentsPage() {
  const { data: assignments = [], loading, reload } = usePoll('/api/v1/tutor/assignments', 15000, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/api/v1/tutor/assignments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', dueDate: '' });
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await fetchApi(`/api/v1/tutor/assignments/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && assignments.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading assignments...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Assignments</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Task management</h1>
            <p className="mt-2 text-sm text-slate-500">Create assignments, track submissions, and grade student work.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#056852] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#045242] transition"
          >
            <Plus size={16} /> Create Assignment
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { title: 'Active Assignments', count: assignments.filter(a => a.status === 'active').length, icon: <ClipboardList size={18} /> },
            { title: 'Upcoming Deadlines', count: assignments.filter(a => new Date(a.dueDate) > new Date()).length, icon: <Calendar size={18} /> },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{item.count}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
           <p className="text-sm font-bold text-slate-900 mb-6">Assignment List</p>
           <div className="mt-6 space-y-4">
             {assignments.length === 0 ? (
               <div className="py-8 text-center text-xs text-slate-400">No assignments created yet.</div>
             ) : assignments.map((a) => (
               <div key={a.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                 <div className="flex items-center justify-between gap-3">
                   <div>
                     <p className="font-semibold text-slate-900">{a.title}</p>
                     <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Calendar size={12}/> Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Due Date'}
                     </p>
                     {a.description && <p className="text-xs text-slate-600 mt-2">{a.description}</p>}
                   </div>
                   <div className="flex items-center gap-3">
                     <span className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${a.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                       {a.status}
                     </span>
                     <button onClick={() => handleDelete(a.id)} className="text-rose-500 hover:text-rose-700 transition">
                        <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
             <h3 className="text-lg font-bold text-slate-900 mb-4">Create Assignment</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="e.g. Physics Problem Set 1" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                 <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" rows="3" placeholder="Instructions..."></textarea>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                 <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#056852] text-white hover:bg-[#045242] disabled:opacity-50">
                   {isSubmitting ? 'Creating...' : 'Create'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </main>
  );
}
