import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, Clock, FolderOpen, ExternalLink, Send, ClipboardList, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentAssignmentsSection() {
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [formData, setFormData] = useState({ content: '', fileUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      
      const [resAss, resMat] = await Promise.all([
        fetch(`${API}/api/v1/student/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/v1/student/study-materials`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resAss.ok) {
        const dataAss = await resAss.json();
        setAssignments(dataAss);
      }
      if (resMat.ok) {
        const dataMat = await resMat.json();
        setMaterials(dataMat);
      }
    } catch (err) {
      console.error('Error fetching student work:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmission = async (assignment) => {
    setSelectedAssignment(assignment);
    setSubmission(null);
    setFormData({ content: '', fileUrl: '' });
    setLoadingSub(true);
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/assignments/${assignment.id}/submission`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmission(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const sub = await res.json();
        setSubmission(sub);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Loading resources...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Learning Resources</h2>
        <p className="text-sm text-slate-500">Access your assignments and shared study materials</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative ${
            activeTab === 'assignments' ? 'text-[#056852] border-b-2 border-[#056852]' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-4 text-sm font-bold transition-all relative ${
            activeTab === 'materials' ? 'text-[#056852] border-b-2 border-[#056852]' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Study Materials ({materials.length})
        </button>
      </div>

      {activeTab === 'assignments' ? (
        assignments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No assignments yet</h3>
            <p className="text-sm text-slate-500">Your assigned tutors will post assignments here.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => {
              const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status === 'active';
              return (
                <div key={a.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isOverdue
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {a.status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">{a.title}</h4>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-3">{a.description || 'No description provided.'}</p>
                  </div>

                  <div>
                    <div className="space-y-1.5 pb-4 text-[10px] text-slate-500 border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-slate-400" />
                        <span>Assigned by: <strong>{a.tutor?.name || 'Your Tutor'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Due: <strong>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Due Date'}</strong></span>
                      </div>
                      {a.startTime && a.endTime && (
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          <span>Timing: <strong>{a.startTime} - {a.endTime}</strong></span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenSubmission(a)}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 border border-slate-100 py-2 rounded-xl text-xs font-bold text-slate-700 transition"
                    >
                      <ClipboardList size={13} /> View & Submit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        materials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No study materials yet</h3>
            <p className="text-sm text-slate-500">Shared files, notes, and resources will show up here.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <div key={m.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {m.type || 'PDF'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{m.title}</h4>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4 pt-3 border-t border-slate-50">
                    <User size={13} className="text-slate-400" />
                    <span>Shared by: <strong>{m.tutor?.name || 'Your Tutor'}</strong></span>
                  </div>

                  {m.fileUrl && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 py-2 rounded-xl text-xs font-bold text-slate-600 transition"
                    >
                      <Download size={13} /> Download / View Resource <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment Details</span>
                <h3 className="text-base font-extrabold text-slate-900">{selectedAssignment.title}</h3>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 rounded-2xl p-3 border border-slate-100/70 mb-4">
              {selectedAssignment.description || 'No instruction notes provided.'}
            </p>

            {loadingSub ? (
              <div className="py-6 text-center text-xs text-slate-400 animate-pulse font-bold">Checking submission status...</div>
            ) : submission ? (
              <div className="space-y-4">
                <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                    <CheckCircle size={15} /> Submitted Successfully
                  </div>
                  {submission.content && (
                    <div className="text-xs text-slate-700 mb-2">
                      <p className="font-bold mb-1">Your Answers:</p>
                      <p className="bg-white p-2.5 rounded-xl border border-slate-100 whitespace-pre-wrap">{submission.content}</p>
                    </div>
                  )}
                  {submission.fileUrl && (
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold hover:underline"
                    >
                      <ExternalLink size={12} /> View Submitted Material / Link
                    </a>
                  )}
                </div>

                {submission.status === 'Graded' ? (
                  <div className="border border-amber-100 bg-amber-50/20 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-800">Tutor Grading & Feedback</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Score / Grade:</span>
                        <strong className="text-emerald-700 text-sm">{submission.grade || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Status:</span>
                        <strong className="text-slate-700">Graded</strong>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 mt-2">
                        <span className="text-[10px] text-slate-400 block font-bold mb-1">Feedback:</span>
                        {submission.feedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-2 font-semibold">
                    Awaiting Tutor grading and review.
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Write your Answer / Text Submission</label>
                  <textarea
                    required
                    rows="5"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border-slate-200 rounded-xl text-xs"
                    placeholder="Enter details, answers or comments here..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Attachment URL / Drive Link (Optional)</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full border-slate-200 rounded-xl text-xs"
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Provide a link if you uploaded answers on Drive/Github.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#056852] text-white hover:bg-[#045242] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={13} /> {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
