"use client";

import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, XCircle, Clock, Trash2, Search, Eye, FileText, ChevronRight, Download, MapPin, GraduationCap, Calendar, BookOpen, Star } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function AdminCareersPage() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('verifiedtutor-token');
    fetch(`${API}/api/v1/admin/careers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/careers/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(prev => prev.map(app => app._id === id ? { ...app, status } : app));
        if (selectedApp?._id === id) setSelectedApp({ ...selectedApp, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = applications.filter(app => {
    const matchTab = selectedTab === 'all' || app.status === selectedTab;
    const matchSearch = !search || 
      app.name?.toLowerCase().includes(search.toLowerCase()) || 
      app.email?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabs = [
    { id: 'all', label: 'All Applications' },
    { id: 'pending', label: 'Pending' },
    { id: 'under review', label: 'Under Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  const getStatusColor = (status) => {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (status === 'under review') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-amber-100 text-amber-700 border-amber-200'; // pending
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={22} className="text-[#056852]" />
            Tutor Job Applications
          </h1>
          <p className="text-xs text-slate-500">Review and manage tutor onboarding requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0">
        {tabs.map(tab => {
          const count = tab.id === 'all' ? applications.length : applications.filter(a => a.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                selectedTab === tab.id
                  ? 'border-[#056852] text-[#056852]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                selectedTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500'
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search applicants by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-[#056852] focus:outline-none focus:ring-4 focus:ring-[#056852]/10"
        />
      </div>

      {/* Table / Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-slate-400 animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#056852] animate-spin mb-4" />
          Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No applications found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(app => (
            <div key={app._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition group cursor-pointer" onClick={() => setSelectedApp(app)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {app.documents?.photoUrl ? (
                    <img src={app.documents.photoUrl} alt={app.name} className="h-12 w-12 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-lg border border-slate-200">
                      {app.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">{app.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{app.experienceDetails?.type || 'Applicant'} • {app.address?.city || 'India'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Education</span>
                  <span className="font-bold text-slate-700 truncate max-w-[150px] text-right">{app.education?.highestQualification || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Subjects</span>
                  <span className="font-bold text-slate-700 truncate max-w-[150px] text-right">{(app.teaching?.subjects || []).join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Applied On</span>
                  <span className="font-bold text-slate-700 text-right">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
                <button className="flex items-center gap-1 text-[11px] font-bold text-[#056852] hover:bg-emerald-50 px-2 py-1 rounded-lg transition">
                  View Profile <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                {selectedApp.documents?.photoUrl ? (
                  <img src={selectedApp.documents.photoUrl} alt={selectedApp.name} className="h-16 w-16 rounded-2xl object-cover shadow-sm border border-slate-200" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-[#056852] text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                    {selectedApp.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedApp.name}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border align-middle ${getStatusColor(selectedApp.status)}`}>
                      {selectedApp.status}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">{selectedApp.email} • {selectedApp.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 transition">
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (Main Details) */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Teaching Profile */}
                  <section>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                      <BookOpen size={16} className="text-emerald-500" /> Teaching Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Subjects</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.teaching?.subjects || []).join(', ') || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Classes</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.teaching?.classes || []).join(', ') || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Boards</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.teaching?.boards || []).join(', ') || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Preferred Mode</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.teaching?.mode || []).join(', ') || '-'}</p></div>
                    </div>
                  </section>

                  {/* Education & Experience */}
                  <section>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                      <GraduationCap size={16} className="text-emerald-500" /> Education & Experience
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Highest Qual.</p><p className="text-sm font-semibold text-slate-800">{selectedApp.education?.highestQualification || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">College</p><p className="text-sm font-semibold text-slate-800">{selectedApp.education?.college || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Experience Level</p><p className="text-sm font-semibold text-slate-800">{selectedApp.experienceDetails?.type || '-'} ({selectedApp.experienceDetails?.totalExperience || '0'} yrs)</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Certifications</p><p className="text-sm font-semibold text-slate-800">{selectedApp.skills?.certifications || 'None'}</p></div>
                    </div>
                  </section>
                  
                  {/* Address & Availability */}
                  <section>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-500" /> Availability & Location
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div className="col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase">Address</p><p className="text-sm font-semibold text-slate-800">{selectedApp.address?.full || '-'}, {selectedApp.address?.city}, {selectedApp.address?.pincode}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Available Days</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.availability?.availableDays || []).join(', ') || '-'}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase">Time Slots</p><p className="text-sm font-semibold text-slate-800">{(selectedApp.availability?.timeSlots || []).join(', ') || '-'}</p></div>
                    </div>
                  </section>
                </div>

                {/* Right Column (Side details & Docs) */}
                <div className="space-y-6">
                  {/* Financials */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Expected Fees</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-600">Hourly Rate</span><span className="text-sm font-bold text-slate-900">₹{selectedApp.fees?.hourly || 'N/A'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-600">Monthly Rate</span><span className="text-sm font-bold text-slate-900">₹{selectedApp.fees?.monthly || 'N/A'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-600">Negotiable</span><span className="text-sm font-bold text-slate-900">{selectedApp.fees?.negotiable ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {selectedApp.documents?.resumeUrl ? (
                        <a href={selectedApp.documents.resumeUrl} download="resume.pdf" className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 group transition">
                          <div className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /><span className="text-xs font-bold text-slate-700">Resume.pdf</span></div>
                          <Download size={14} className="text-slate-400 group-hover:text-emerald-500" />
                        </a>
                      ) : <div className="text-xs text-slate-400 italic">No resume uploaded</div>}
                      
                      {selectedApp.documents?.idUrl ? (
                        <a href={selectedApp.documents.idUrl} download="id.jpg" className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 group transition">
                          <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-purple-500" /><span className="text-xs font-bold text-slate-700">Govt ID Card</span></div>
                          <Download size={14} className="text-slate-400 group-hover:text-emerald-500" />
                        </a>
                      ) : <div className="text-xs text-slate-400 italic">No Govt ID uploaded</div>}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3 justify-end items-center">
              <span className="text-xs font-medium text-slate-500 mr-auto flex items-center gap-1.5"><Calendar size={14} /> Applied on {new Date(selectedApp.createdAt).toLocaleDateString()} at {new Date(selectedApp.createdAt).toLocaleTimeString()}</span>
              
              <button onClick={() => handleStatusChange(selectedApp._id, 'rejected')} className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100 transition">
                Reject Application
              </button>
              <button onClick={() => handleStatusChange(selectedApp._id, 'under review')} className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition">
                Mark In Review
              </button>
              <button onClick={() => handleStatusChange(selectedApp._id, 'approved')} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition">
                Approve Tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
