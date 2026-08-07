"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, XCircle, AlertTriangle, Eye, Trash2, Ban, Star, Shield, UserCheck, MoreVertical, ChevronDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const MOCK_TUTORS = [];

const statusStyles = {
  verified: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-rose-100 text-rose-700',
  rejected: 'bg-slate-100 text-slate-500',
  featured: 'bg-blue-100 text-blue-700',
};

export default function TutorsAdminPage() {
  const [tutors, setTutors] = useState(MOCK_TUTORS);
  const [apiTutors, setApiTutors] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTutor, setNewTutor] = useState({ name: '', email: '', password: '', mobile: '', location: '' });

  useEffect(() => {
    fetch(`${API}/api/v1/admin/users?role=tutor`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setApiTutors(data.map(u => ({
            id: u.id, name: u.name, email: u.email,
            subjects: u.subjects || ['General'], rating: u.rating || 0, location: u.location || 'India',
            status: u.status || 'pending', experience: u.experience || 'N/A', students: u.students || 0, revenue: '₹0',
            mobile: u.mobile || 'N/A', qualification: u.qualification || 'N/A', classesTaught: u.classesTaught || [],
            mode: u.mode || ['Online'], languages: u.languages || [], feeType: u.feeType || 'Hourly',
            price: u.price || 0, availableDays: u.availableDays || [], availableTimeSlots: u.availableTimeSlots || 'N/A',
            address: u.address || { city: '', area: '', pincode: '' }
          })));
        }
      })
      .catch(() => {});
  }, []);

  const allTutors = [...tutors, ...apiTutors.filter(a => !tutors.find(t => t.email === a.email))];

  const tabs = [
    { id: 'all', label: 'All Tutors', count: allTutors.length },
    { id: 'pending', label: 'Pending', count: allTutors.filter(t => t.status === 'pending').length },
    { id: 'verified', label: 'Verified', count: allTutors.filter(t => t.status === 'verified').length },
    { id: 'suspended', label: 'Suspended', count: allTutors.filter(t => t.status === 'suspended').length },
    { id: 'rejected', label: 'Rejected', count: allTutors.filter(t => t.status === 'rejected').length },
  ];

  const handleAction = (id, action) => {
    setTutors(prev => prev.map(t => t.id === id ? { ...t, status: action } : t));
    setActionMenu(null);
  };

  const handleAddTutor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/v1/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTutor, role: 'tutor', status: 'verified', verified: true, rating: 5, reviews: 0 })
      });
      if (res.ok) {
        const addedUser = await res.json();
        setApiTutors(prev => [addedUser, ...prev]);
        setIsAddModalOpen(false);
        setNewTutor({ name: '', email: '', password: '', mobile: '', location: '' });
      } else {
        alert('Failed to add tutor');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding tutor');
    }
  };

  const filtered = allTutors.filter(t => {
    const matchTab = selectedTab === 'all' || t.status === selectedTab;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tutor Management</h1>
          <p className="text-xs text-slate-500">{allTutors.length} total tutors on platform</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md"
        >
          + Add Tutor
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Tutors', value: allTutors.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Approval', value: allTutors.filter(t => t.status === 'pending').length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Verified', value: allTutors.filter(t => t.status === 'verified').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Suspended', value: allTutors.filter(t => t.status === 'suspended').length, color: 'text-rose-600 bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-3 ${s.color.split(' ')[1]} border border-slate-100`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${s.color.split(' ')[0]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              selectedTab === tab.id
                ? 'border-[#056852] text-[#056852]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              selectedTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tutors by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs focus:border-[#056852] focus:outline-none focus:ring-2 focus:ring-[#056852]/10"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left">Tutor</th>
                <th className="px-4 py-3 text-left">Subjects</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Rating</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Students</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Revenue</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#056852]/10 text-[11px] font-bold text-[#056852]">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map((s, i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500">{t.location}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {t.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{t.rating}</span>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-semibold text-slate-700">{t.students}</td>
                  <td className="px-4 py-3 hidden xl:table-cell font-semibold text-emerald-700">{t.revenue}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyles[t.status] || statusStyles.pending}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {t.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(t.id, 'verified')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition" title="Approve">
                            <CheckCircle2 size={14} />
                          </button>
                          <button onClick={() => handleAction(t.id, 'rejected')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-500 hover:bg-rose-200 transition" title="Reject">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {t.status === 'verified' && (
                        <button onClick={() => handleAction(t.id, 'suspended')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition" title="Suspend">
                          <Ban size={14} />
                        </button>
                      )}
                      {t.status === 'suspended' && (
                        <button onClick={() => handleAction(t.id, 'verified')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition" title="Unblock">
                          <Shield size={14} />
                        </button>
                      )}
                      <button onClick={() => setSelectedTutor(t)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition" title="View Profile">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleAction(t.id, 'rejected')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">No tutors found matching your filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tutor Details Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#056852]/10 text-sm font-bold text-[#056852]">
                  {selectedTutor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedTutor.name}</h3>
                  <p className="text-xs font-medium text-slate-500">{selectedTutor.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTutor(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mobile</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTutor.mobile || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTutor.location || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qualification</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTutor.qualification || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTutor.experience || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Subjects & Classes</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedTutor.subjects || []).map((s, i) => <span key={i} className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{s}</span>)}
                  {(selectedTutor.classesTaught || []).map((c, i) => <span key={`c${i}`} className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{c}</span>)}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Teaching Mode</p>
                  <p className="text-sm font-semibold text-slate-900">{(selectedTutor.mode || []).join(', ') || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Languages</p>
                  <p className="text-sm font-semibold text-slate-900">{(selectedTutor.languages || []).join(', ') || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Fees</p>
                  <p className="text-sm font-semibold text-emerald-600">₹{selectedTutor.price || 0} / {selectedTutor.feeType || 'Hr'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Availability</p>
                  <p className="text-sm font-semibold text-slate-900">{(selectedTutor.availableDays || []).join(', ')} ({selectedTutor.availableTimeSlots || 'N/A'})</p>
                </div>
              </div>

              {selectedTutor.address && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Address</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {[selectedTutor.address.area, selectedTutor.address.city, selectedTutor.address.pincode].filter(Boolean).join(', ') || 'Not Provided'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end gap-2">
              <button onClick={() => setSelectedTutor(null)} className="rounded-xl px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition">Close</button>
              {selectedTutor.status === 'pending' && (
                <>
                  <button onClick={() => { handleAction(selectedTutor.id, 'rejected'); setSelectedTutor(null); }} className="rounded-xl bg-rose-100 px-5 py-2 text-sm font-bold text-rose-600 hover:bg-rose-200 transition">Reject</button>
                  <button onClick={() => { handleAction(selectedTutor.id, 'verified'); setSelectedTutor(null); }} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20">Approve Tutor</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Tutor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Add New Tutor</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTutor} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input required type="text" value={newTutor.name} onChange={e => setNewTutor({...newTutor, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#056852] focus:outline-none" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input required type="email" value={newTutor.email} onChange={e => setNewTutor({...newTutor, email: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#056852] focus:outline-none" placeholder="john@example.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <input required type="password" value={newTutor.password} onChange={e => setNewTutor({...newTutor, password: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#056852] focus:outline-none" placeholder="Secret password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile</label>
                  <input type="text" value={newTutor.mobile} onChange={e => setNewTutor({...newTutor, mobile: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#056852] focus:outline-none" placeholder="+91..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                  <input type="text" value={newTutor.location} onChange={e => setNewTutor({...newTutor, location: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#056852] focus:outline-none" placeholder="e.g. Delhi" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#056852] px-5 py-2 text-sm font-bold text-white hover:bg-[#045241] transition shadow-md">Add Tutor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
