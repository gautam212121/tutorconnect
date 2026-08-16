"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, XCircle, AlertTriangle, Eye, Trash2, Ban, Star, Shield, UserCheck, MoreVertical, ChevronDown, User, Upload, Edit, Save } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '../../../../lib/api';
import { useSocket } from '../../../../hooks/useSocket';
import { getImageUrl } from '../../../../lib/image';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

const MOCK_TUTORS = [];

const statusStyles = {
  active: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  verified: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  pending: { cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  deactivated: { cls: 'bg-slate-100 text-slate-500 border border-slate-200', dot: 'bg-slate-500' },
  suspended: { cls: 'bg-rose-100 text-rose-600 border border-rose-200', dot: 'bg-rose-500' },
  rejected: { cls: 'bg-red-100 text-red-600 border border-red-200', dot: 'bg-red-500' },
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const normalizeTutorSubjects = (subjects) => {
  if (Array.isArray(subjects)) return subjects.filter(Boolean);
  if (typeof subjects === 'string') {
    return subjects.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['General'];
};

export default function TutorsAdminPage() {
  const [tutors, setTutors] = useState(MOCK_TUTORS);
  const [apiTutors, setApiTutors] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTutor, setEditTutor] = useState(null);
  const [changingStatus, setChangingStatus] = useState(null); // tutor id whose dropdown is open
  const [newTutor, setNewTutor] = useState({
    name: '', email: '', password: '', mobile: '', location: '',
    headline: 'Tutor', experience: '1 year', subjects: '', price: 500,
    mode: ['Online'], rating: 5, reviews: 0, avatar: '', avatarFile: null
  });

  const socket = useSocket();

  const fetchTutors = async () => {
    try {
      const data = await adminApi.getUsers('tutor');
      if (Array.isArray(data)) {
        setApiTutors(data.map(u => ({
          id: u._id || u.id, name: u.name, email: u.email,
          subjects: normalizeTutorSubjects(u.subjects), rating: u.rating ?? 5, location: u.location || 'India',
          status: u.status || 'pending', experience: u.experience || 'N/A', students: u.students || 0, revenue: '₹0',
          mobile: u.mobile || 'N/A', qualification: u.qualification || 'N/A', classesTaught: u.classesTaught || [],
          mode: u.mode || ['Online'], languages: u.languages || [], feeType: u.feeType || 'Hourly',
          price: u.price || 0, availableDays: u.availableDays || [], availableTimeSlots: u.availableTimeSlots || 'N/A',
          address: u.address || { city: '', area: '', pincode: '' }, avatar: u.avatar || null
        })));
      }
    } catch (err) {
      setApiTutors([]);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!changingStatus) return;
    const close = () => setChangingStatus(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [changingStatus]);

  useEffect(() => {
    if (!socket) return;
    
    const handleCreated = (newUser) => {
      if (newUser.role === 'tutor') {
        const formatted = {
          id: newUser._id || newUser.id, name: newUser.name, email: newUser.email,
          subjects: normalizeTutorSubjects(newUser.subjects), rating: newUser.rating ?? 5, location: newUser.location || 'India',
          status: newUser.status || 'pending', experience: newUser.experience || 'N/A', students: newUser.students || 0, revenue: '₹0',
          mobile: newUser.mobile || 'N/A', qualification: newUser.qualification || 'N/A', classesTaught: newUser.classesTaught || [],
          mode: newUser.mode || ['Online'], languages: newUser.languages || [], feeType: newUser.feeType || 'Hourly',
          price: newUser.price || 0, availableDays: newUser.availableDays || [], availableTimeSlots: newUser.availableTimeSlots || 'N/A',
          address: newUser.address || { city: '', area: '', pincode: '' }, avatar: newUser.avatar || null
        };
        setApiTutors(prev => {
          if (prev.find(u => u.id === formatted.id || u.email === formatted.email)) return prev;
          return [formatted, ...prev];
        });
      }
    };

    const handleUpdated = (updatedUser) => {
      if (updatedUser.role === 'tutor') {
        setApiTutors(prev => prev.map(u => (u.id === updatedUser._id || u.id === updatedUser.id) ? {
          ...u,
          name: updatedUser.name,
          email: updatedUser.email,
          subjects: updatedUser.subjects || u.subjects,
          rating: updatedUser.rating ?? u.rating,
          reviews: updatedUser.reviews ?? u.reviews,
          location: updatedUser.location || u.location,
          status: updatedUser.status || u.status,
          experience: updatedUser.experience || u.experience,
          mobile: updatedUser.mobile || u.mobile,
          qualification: updatedUser.qualification || u.qualification,
          classesTaught: updatedUser.classesTaught || u.classesTaught,
          mode: updatedUser.mode || u.mode,
          price: updatedUser.price ?? u.price,
          avatar: updatedUser.avatar || u.avatar
        } : u));
      }
    };

    const handleDeleted = (id) => {
      setApiTutors(prev => prev.filter(u => u.id !== id));
    };

    socket.on('userCreated', handleCreated);
    socket.on('userUpdated', handleUpdated);
    socket.on('userDeleted', handleDeleted);

    return () => {
      socket.off('userCreated', handleCreated);
      socket.off('userUpdated', handleUpdated);
      socket.off('userDeleted', handleDeleted);
    };
  }, [socket]);

  const handleAction = async (id, action) => {
    try {
      const updated = await adminApi.updateUser(id, { status: action, verified: action === 'verified' || action === 'active' });
      if (updated) {
        setApiTutors(prev => prev.map(t => t.id === id ? { ...t, status: action } : t));
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
    setChangingStatus(null);
    setActionMenu(null);
  };

  const handleAddTutor = async (e) => {
    e.preventDefault();
    try {
      let addedUser;
      if (newTutor.avatarFile) {
        const formData = new FormData();
        formData.append('name', newTutor.name || '');
        formData.append('email', newTutor.email || '');
        formData.append('password', newTutor.password || '');
        formData.append('mobile', newTutor.mobile || '');
        formData.append('location', newTutor.location || '');
        formData.append('headline', newTutor.headline || 'Tutor');
        formData.append('experience', newTutor.experience || '1 year');
        formData.append('role', 'tutor');
        formData.append('status', 'verified');
        formData.append('verified', 'true');
        formData.append('subjects', JSON.stringify(newTutor.subjects ? newTutor.subjects.split(',').map(s => s.trim()).filter(Boolean) : ['General']));
        formData.append('price', String(newTutor.price || 500));
        formData.append('mode', JSON.stringify(newTutor.mode || ['Online']));
        formData.append('rating', String(newTutor.rating || 5));
        formData.append('reviews', String(newTutor.reviews || 0));
        formData.append('avatar', newTutor.avatarFile);
        addedUser = await adminApi.createUserMultipart(formData);
      } else {
        const data = {
          name: newTutor.name || '',
          email: newTutor.email || '',
          password: newTutor.password || '',
          mobile: newTutor.mobile || '',
          location: newTutor.location || '',
          headline: newTutor.headline || 'Tutor',
          experience: newTutor.experience || '1 year',
          role: 'tutor',
          status: 'verified',
          verified: true,
          subjects: newTutor.subjects ? newTutor.subjects.split(',').map(s => s.trim()).filter(Boolean) : ['General'],
          price: newTutor.price || 500,
          mode: newTutor.mode || ['Online'],
          rating: newTutor.rating || 5,
          reviews: newTutor.reviews || 0
        };
        addedUser = await adminApi.createUser(data);
      }

      if (addedUser) {
        const formattedUser = {
          id: addedUser._id || addedUser.id, name: addedUser.name, email: addedUser.email,
          subjects: normalizeTutorSubjects(addedUser.subjects), rating: addedUser.rating ?? 5, location: addedUser.location || 'India',
          status: addedUser.status || 'pending', experience: addedUser.experience || 'N/A', students: addedUser.students || 0, revenue: '₹0',
          mobile: addedUser.mobile || 'N/A', qualification: addedUser.qualification || 'N/A', classesTaught: addedUser.classesTaught || [],
          mode: addedUser.mode || ['Online'], languages: addedUser.languages || [], feeType: addedUser.feeType || 'Hourly',
          price: addedUser.price || 0, availableDays: addedUser.availableDays || [], availableTimeSlots: addedUser.availableTimeSlots || 'N/A',
          address: addedUser.address || { city: '', area: '', pincode: '' }, avatar: addedUser.avatar || null
        };
        setApiTutors(prev => [formattedUser, ...prev]);
        setIsAddModalOpen(false);
        setNewTutor({
          name: '', email: '', password: '', mobile: '', location: '',
          headline: 'Tutor', experience: '1 year', subjects: '', price: 500,
          mode: ['Online'], rating: 5, reviews: 0, avatar: '', avatarFile: null
        });
      } else {
        alert('Failed to add tutor: No response from server');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding tutor: ' + (err.response?.data?.message || err.message));
    }
  };

  const allTutors = apiTutors.length > 0 ? apiTutors : tutors;
  const tabs = [
    { id: 'all', label: 'All Tutors', count: allTutors.length },
    { id: 'pending', label: 'Pending', count: allTutors.filter((t) => t.status === 'pending').length },
    { id: 'active', label: 'Active', count: allTutors.filter((t) => t.status === 'active' || t.status === 'verified').length },
    { id: 'deactivated', label: 'Deactivated', count: allTutors.filter((t) => t.status === 'deactivated').length },
    { id: 'rejected', label: 'Rejected', count: allTutors.filter((t) => t.status === 'rejected').length },
    { id: 'suspended', label: 'Suspended', count: allTutors.filter((t) => t.status === 'suspended').length },
  ];

  const filtered = allTutors.filter(t => {
    const matchTab = selectedTab === 'all' 
      || t.status === selectedTab 
      || (selectedTab === 'active' && t.status === 'verified');
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

      {/* Stats Row — clickable to filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Tutors', value: allTutors.length, tab: 'all', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Pending', value: allTutors.filter(t => t.status === 'pending').length, tab: 'pending', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Active', value: allTutors.filter(t => t.status === 'verified' || t.status === 'active').length, tab: 'active', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Suspended', value: allTutors.filter(t => t.status === 'suspended').length, tab: 'suspended', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setSelectedTab(s.tab)}
            className={`rounded-2xl p-3 ${s.bg} border ${s.border} text-left hover:opacity-80 transition cursor-pointer ${
              selectedTab === s.tab ? 'ring-2 ring-offset-1 ring-current opacity-100' : ''
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${s.color}`}>{s.value}</p>
          </button>
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
                      <div className="flex h-8 w-8 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-[#056852]/10 text-[11px] font-bold text-[#056852]">
                        {t.avatar ? (
                          <img src={getImageUrl(t.avatar)} alt={t.name} className="h-full w-full object-cover" />
                        ) : (
                          t.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.email}</p>
                        {t.mobile && t.mobile !== 'N/A' ? (
                          <a 
                            href={`https://wa.me/${t.mobile.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                            {t.mobile}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-400">N/A</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(t.subjects) ? t.subjects : (typeof t.subjects === 'string' ? t.subjects.replace(/[\[\]"\\]/g, '').split(',').filter(Boolean) : [])).map((s, i) => (
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
                  {/* Status — interactive dropdown */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setChangingStatus(changingStatus === t.id ? null : t.id); }}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase border transition hover:opacity-80 ${
                          (statusStyles[t.status] || statusStyles.pending).cls
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${(statusStyles[t.status] || statusStyles.pending).dot}`} />
                        {t.status}
                        <svg className="ml-0.5 h-3 w-3 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                      </button>
                      {changingStatus === t.id && (
                        <div className="absolute left-0 top-full mt-1 z-50 min-w-[130px] rounded-xl border border-slate-200 bg-white shadow-xl py-1">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleAction(t.id, opt.value)}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 transition ${
                                t.status === opt.value ? 'text-[#056852] bg-emerald-50' : 'text-slate-700'
                              }`}
                            >
                              <span className={`h-2 w-2 rounded-full ${(statusStyles[opt.value] || statusStyles.pending).dot}`} />
                              {opt.label}
                              {t.status === opt.value && <span className="ml-auto text-[10px]">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/admin/tutors/${t.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition" title="View Profile">
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          setEditTutor({
                            ...t,
                            subjects: t.subjects.join(', '),
                            mode: t.mode || [],
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition"
                        title="Edit Profile"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleAction(t.id, 'rejected')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-400">
                    {typeof window !== 'undefined' && !localStorage.getItem('verifiedtutor-token')
                      ? 'Sign in as an admin to load tutor records.'
                      : 'No tutors found matching your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tutor Modal */}
      {isEditModalOpen && editTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900">Edit Tutor Profile</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditTutor(null); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                let updated;
                if (editTutor.avatarFile) {
                  const formData = new FormData();
                  formData.append('name', editTutor.name || '');
                  formData.append('email', editTutor.email || '');
                  formData.append('mobile', editTutor.mobile || '');
                  formData.append('location', editTutor.location || '');
                  formData.append('experience', editTutor.experience || '');
                  formData.append('price', String(editTutor.price || 0));
                  let subjectsArray = typeof editTutor.subjects === 'string' 
                      ? editTutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
                      : editTutor.subjects;
                  formData.append('subjects', JSON.stringify(subjectsArray));
                  formData.append('avatar', editTutor.avatarFile);
                  
                  updated = await adminApi.updateUserMultipart(editTutor.id, formData);
                } else {
                  const updates = { ...editTutor };
                  if (typeof updates.subjects === 'string') {
                    updates.subjects = updates.subjects.split(',').map(s => s.trim()).filter(Boolean);
                  }
                  updated = await adminApi.updateUser(editTutor.id, updates);
                }

                if (updated) {
                  const finalAvatar = editTutor.avatarFile ? editTutor.avatar : editTutor.avatar;
                  setApiTutors(prev => prev.map(t => t.id === editTutor.id ? { ...t, ...editTutor, avatar: finalAvatar, subjects: typeof editTutor.subjects === 'string' ? editTutor.subjects.split(',').map(s=>s.trim()).filter(Boolean) : editTutor.subjects } : t));
                  setIsEditModalOpen(false);
                  setEditTutor(null);
                }
              } catch (err) {
                console.error(err);
                alert('Failed to update tutor');
              }
            }} className="p-6 space-y-5 overflow-y-auto min-h-0">
              {/* Profile Photo */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                {editTutor.avatar ? (
                  <img src={editTutor.avatar} alt="Preview" className="h-14 w-14 rounded-2xl object-cover border border-slate-200" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <User size={20} />
                  </div>
                )}
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avatar Photo</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const validMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!validMime.includes(file.type.toLowerCase())) {
                        alert('Only JPG, PNG, or WEBP images are allowed');
                        e.target.value = '';
                        return;
                      }

                      setEditTutor({ ...editTutor, avatar: URL.createObjectURL(file), avatarFile: file });
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#056852]/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#056852] hover:file:bg-[#056852]/20 cursor-pointer outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input required type="text" value={editTutor.name} onChange={e => setEditTutor({...editTutor, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                  <input required type="email" value={editTutor.email} onChange={e => setEditTutor({...editTutor, email: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mobile</label>
                  <input type="text" value={editTutor.mobile} onChange={e => setEditTutor({...editTutor, mobile: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location</label>
                  <input required type="text" value={editTutor.location} onChange={e => setEditTutor({...editTutor, location: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Experience</label>
                  <input required type="text" value={editTutor.experience} onChange={e => setEditTutor({...editTutor, experience: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Price per Hour (₹)</label>
                  <input required type="number" value={editTutor.price} onChange={e => setEditTutor({...editTutor, price: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjects (Comma separated)</label>
                <input required type="text" value={editTutor.subjects} onChange={e => setEditTutor({...editTutor, subjects: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditTutor(null); }} className="rounded-xl px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#056852] px-5 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tutor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
              <h3 className="text-base font-extrabold text-slate-900">Add New Tutor</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTutor} className="p-6 space-y-5 overflow-y-auto min-h-0">
              {/* Profile Photo */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                {newTutor.avatar ? (
                  <img src={newTutor.avatar} alt="Preview" className="h-14 w-14 rounded-2xl object-cover border border-slate-200" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                    <User size={20} />
                  </div>
                )}
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Avatar Photo</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      const validMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!validMime.includes(file.type.toLowerCase())) {
                        alert('Only JPG, PNG, or WEBP images are allowed');
                        e.target.value = '';
                        return;
                      }

                      setNewTutor({ ...newTutor, avatar: URL.createObjectURL(file), avatarFile: file });
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#056852]/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#056852] hover:file:bg-[#056852]/20 cursor-pointer outline-none"
                  />
                </div>
              </div>

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                  <input required type="text" value={newTutor.name} onChange={e => setNewTutor({...newTutor, name: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. Test Tutor" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email *</label>
                  <input required type="email" value={newTutor.email} onChange={e => setNewTutor({...newTutor, email: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="tutor@example.com" />
                </div>
              </div>

              {/* Grid 2: Credentials */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password *</label>
                  <input required type="password" value={newTutor.password} onChange={e => setNewTutor({...newTutor, password: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="••••••" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mobile *</label>
                  <input type="text" value={newTutor.mobile} onChange={e => setNewTutor({...newTutor, mobile: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="+91..." />
                </div>
              </div>

              {/* Grid 3: Location & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location *</label>
                  <input required type="text" value={newTutor.location} onChange={e => setNewTutor({...newTutor, location: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. Delhi" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Headline</label>
                  <input type="text" value={newTutor.headline} onChange={e => setNewTutor({...newTutor, headline: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. Senior Math Expert" />
                </div>
              </div>

              {/* Grid 4: Experience & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Experience *</label>
                  <input required type="text" value={newTutor.experience} onChange={e => setNewTutor({...newTutor, experience: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. 5 years" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Price per Hour (₹) *</label>
                  <input required type="number" value={newTutor.price} onChange={e => setNewTutor({...newTutor, price: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. 500" />
                </div>
              </div>

              {/* Grid 5: Rating & Reviews */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rating (1-5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={newTutor.rating} onChange={e => setNewTutor({...newTutor, rating: parseFloat(e.target.value) || 5})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reviews Count</label>
                  <input type="number" value={newTutor.reviews} onChange={e => setNewTutor({...newTutor, reviews: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" />
                </div>
              </div>

              {/* Subjects input */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subjects (Comma separated) *</label>
                <input required type="text" value={newTutor.subjects} onChange={e => setNewTutor({...newTutor, subjects: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-[#056852] outline-none" placeholder="e.g. Mathematics, Science" />
              </div>

              {/* Teaching Mode checkboxes */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Teaching Mode</label>
                <div className="flex gap-4">
                  {['Online', 'Home Tuition', 'Student Home'].map(m => {
                    const checked = newTutor.mode.includes(m);
                    return (
                      <label key={m} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setNewTutor(prev => {
                              const newMode = checked ? prev.mode.filter(item => item !== m) : [...prev.mode, m];
                              return { ...prev, mode: newMode };
                            });
                          }}
                          className="h-4 w-4 accent-[#056852]"
                        />
                        {m}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-xl px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#056852] px-5 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md">Add Tutor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
