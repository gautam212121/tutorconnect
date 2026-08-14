"use client";

import { useState } from 'react';
import { usePoll, fetchApi } from '../../../lib/api';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';

export default function TutorCoursesPage() {
  const { data: courses = [], loading, reload } = usePoll('/api/v1/tutor/courses', 15000, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', subject: '', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = [
    { title: 'My Courses', count: courses.length, description: 'Published and active classes' },
    { title: 'Draft Courses', count: courses.filter(c => c.status === 'draft').length, description: 'Work in progress' },
    { title: 'Pending Approval', count: courses.filter(c => c.status === 'pending').length, description: 'Awaiting review' },
    { title: 'Published Courses', count: courses.filter(c => c.status === 'active').length, description: 'Live for students' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/api/v1/tutor/courses', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', subject: '', price: '' });
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && courses.length === 0) {
    return <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8 animate-pulse text-slate-500 font-bold text-sm">Loading courses...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Courses</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Course management</h1>
            <p className="mt-2 text-sm text-slate-500">Add, edit, or remove your course content and track approval status.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#056852] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#045242] transition"
          >
            <Plus size={16} /> Create Course
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((card) => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{card.count}</p>
              <p className="mt-3 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Course list</p>
              <p className="text-xs text-slate-500">Review published courses or update drafts.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {courses.length === 0 ? (
               <div className="col-span-full py-8 text-center text-xs text-slate-400">No courses found.</div>
            ) : courses.map((course) => (
              <div key={course.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                         <BookOpen size={16} />
                      </div>
                      <p className="font-bold text-slate-900">{course.title}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold border ${course.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>{course.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{course.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-3">
                  <p className="text-sm font-extrabold text-[#056852]">₹{course.price}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{course.enrollments || 0} enrolled</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
             <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Course</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
                 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="e.g. Master Advanced Calculus" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                 <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="e.g. Mathematics" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                 <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" rows="3" placeholder="Course details..."></textarea>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                 <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border-slate-200 rounded-xl text-sm" placeholder="e.g. 500" />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#056852] text-white hover:bg-[#045242] disabled:opacity-50">
                   {isSubmitting ? 'Creating...' : 'Create Course'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}
    </main>
  );
}
