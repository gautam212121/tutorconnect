"use client";

import { useState, useEffect } from 'react';
import { fetchApi } from '../../../lib/api';
import { Bell, Lock, Palette, CreditCard, UserCircle, LifeBuoy, Check, AlertCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function TutorSettingsPage() {
  const [activeTab, setActiveTab] = useState('Notifications');
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsUpdates: false
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Payment Form State (Bank details)
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: ''
  });

  // Profile Visibility state
  const [visibility, setVisibility] = useState('Public');

  // Support tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [ticketStatus, setTicketStatus] = useState('');

  const tabs = [
    { label: 'Notifications', description: 'Booking alerts, messages, and announcements', icon: <Bell size={18}/> },
    { label: 'Security', description: 'Password and login methods', icon: <Lock size={18}/> },
    { label: 'Appearance', description: 'Theme and display preferences', icon: <Palette size={18}/> },
    { label: 'Payment', description: 'Payout and withdrawal settings', icon: <CreditCard size={18}/> },
    { label: 'Profile', description: 'Visibility and contact details', icon: <UserCircle size={18}/> },
    { label: 'Support', description: 'Report issues and request help', icon: <LifeBuoy size={18}/> },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('verifiedtutor-user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setVisibility(u.status || 'Public');
      if (u.bankDetails) {
        setBankForm({
          accountName: u.bankDetails.accountName || '',
          accountNumber: u.bankDetails.accountNumber || '',
          bankName: u.bankDetails.bankName || '',
          ifscCode: u.bankDetails.ifscCode || ''
        });
      }
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/tutor/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await fetchApi('/api/v1/tutor/profile', {
        method: 'PUT',
        body: JSON.stringify({ bankDetails: bankForm })
      });
      setUser(updatedUser);
      localStorage.setItem('verifiedtutor-user', JSON.stringify(updatedUser));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveVisibility = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await fetchApi('/api/v1/tutor/profile', {
        method: 'PUT',
        body: JSON.stringify({ status: visibility })
      });
      setUser(updatedUser);
      localStorage.setItem('verifiedtutor-user', JSON.stringify(updatedUser));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError('New passwords do not match');
      return;
    }

    try {
      await fetchApi('/api/v1/profile/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword
        })
      });
      setSecuritySuccess('Password successfully updated!');
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSecurityError(err.message || 'Failed to change password');
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setTicketStatus('');
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/tutor/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ticketForm)
      });
      if (res.ok) {
        setTicketStatus('Ticket raised successfully!');
        setTicketForm({ subject: '', message: '' });
        fetchTickets();
      } else {
        const err = await res.json();
        setTicketStatus(err.message || 'Error raising ticket');
      }
    } catch (err) {
      setTicketStatus(err.message || 'Error raising ticket');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Account preferences</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Update notifications, payout accounts, and profile security.</p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          <section className="w-full md:w-1/3 flex flex-col gap-2.5">
            {tabs.map((item) => (
              <button 
                key={item.label} 
                onClick={() => setActiveTab(item.label)}
                className={`p-4 rounded-3xl border text-left transition flex items-center gap-4 ${activeTab === item.label ? 'bg-[#056852] border-[#056852] text-white shadow-md' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-xs'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === item.label ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'}`}>
                   {item.icon}
                </div>
                <div>
                  <p className={`font-bold text-xs ${activeTab === item.label ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`text-[9px] mt-1 leading-snug ${activeTab === item.label ? 'text-teal-100' : 'text-slate-500 font-medium'}`}>{item.description}</p>
                </div>
              </button>
            ))}
          </section>

          <section className="w-full md:w-2/3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-fit min-h-[460px] flex flex-col justify-between">
             <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 mb-6">{activeTab} Settings</h2>
                
                {/* NOTIFICATIONS TAB */}
                {activeTab === 'Notifications' && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">Preferences for alert mechanisms. Check details you wish to receive immediately.</p>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={notifPrefs.emailAlerts} onChange={(e) => setNotifPrefs({ ...notifPrefs, emailAlerts: e.target.checked })} className="accent-[#056852] w-4 h-4 rounded-md border-slate-300" />
                        <div>
                          <span className="text-xs font-bold text-slate-800">Email Alerts</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Receive booking progress updates and billing reports via inbox.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={notifPrefs.pushNotifications} onChange={(e) => setNotifPrefs({ ...notifPrefs, pushNotifications: e.target.checked })} className="accent-[#056852] w-4 h-4 rounded-md border-slate-300" />
                        <div>
                          <span className="text-xs font-bold text-slate-800">Push Notifications</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Get immediate notifications about student chats and assignment tasks.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={notifPrefs.smsUpdates} onChange={(e) => setNotifPrefs({ ...notifPrefs, smsUpdates: e.target.checked })} className="accent-[#056852] w-4 h-4 rounded-md border-slate-300" />
                        <div>
                          <span className="text-xs font-bold text-slate-800">SMS Updates</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Opt-in for phone alerts regarding critical class reminders.</p>
                        </div>
                      </label>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                      <button onClick={handleSavePreferences} className="flex items-center gap-2 bg-[#056852] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                        {saved ? <><Check size={14}/> Preferences Saved</> : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'Security' && (
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <p className="text-xs text-slate-600 font-medium">Change account login credentials below. Keep passwords strong and unique.</p>
                    
                    {securityError && <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex gap-2"><AlertCircle size={14}/> {securityError}</div>}
                    {securitySuccess && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl flex gap-2"><Check size={14}/> {securitySuccess}</div>}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                      <input type="password" value={securityForm.currentPassword} onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })} required className="w-full border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                      <input type="password" value={securityForm.newPassword} onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })} required className="w-full border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                      <input type="password" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })} required className="w-full border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="bg-[#056852] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                        Change Password
                      </button>
                    </div>
                  </form>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === 'Appearance' && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-medium">Customize workspace visualization and alignment densities.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 border-2 border-[#056852] bg-slate-50/50 rounded-2xl cursor-pointer">
                        <span className="text-xs font-bold text-slate-800 block">Modern Emerald Theme</span>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Standard UI configuration optimized for high readability.</p>
                      </div>
                      <div className="p-4 border border-slate-200 bg-white hover:border-slate-300 rounded-2xl cursor-pointer opacity-60">
                        <span className="text-xs font-bold text-slate-800 block">Dark Slate Theme (Beta)</span>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">Dark background presentation mode designed for low light environments.</p>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                      <button onClick={handleSavePreferences} className="flex items-center gap-2 bg-[#056852] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                        {saved ? <><Check size={14}/> Theme Saved</> : 'Apply Theme'}
                      </button>
                    </div>
                  </div>
                )}

                {/* PAYMENT TAB */}
                {activeTab === 'Payment' && (
                  <form onSubmit={handleSaveBankDetails} className="space-y-4 max-w-lg">
                    <p className="text-xs text-slate-600 font-medium">Configure bank and payout accounts to secure regular commission earnings distribution.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                        <input type="text" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} required placeholder="e.g. Praveen Pal" className="w-full border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                        <input type="text" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} required placeholder="e.g. State Bank of India" className="w-full border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                        <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} required placeholder="302910..." className="w-full border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                        <input type="text" value={bankForm.ifscCode} onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })} required placeholder="SBIN00..." className="w-full border-slate-200 rounded-xl text-sm" />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                      <button type="submit" className="flex items-center gap-2 bg-[#056852] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                        {saved ? <><Check size={14}/> Payout Saved</> : 'Save Bank Details'}
                      </button>
                    </div>
                  </form>
                )}

                {/* PROFILE VISIBILITY TAB */}
                {activeTab === 'Profile' && (
                  <form onSubmit={handleSaveVisibility} className="space-y-6">
                    <p className="text-xs text-slate-600 font-medium">Control whether your profile appears publicly on platforms and index pages.</p>
                    <div className="space-y-3 font-semibold text-xs">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="visibility" checked={visibility === 'Public'} onChange={() => setVisibility('Public')} className="accent-[#056852] w-4 h-4" />
                        <div>
                          <span className="text-slate-800">Public visibility (Recommended)</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your profile is visible on searches and students can request bookings directly.</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="radio" name="visibility" checked={visibility === 'Private'} onChange={() => setVisibility('Private')} className="accent-[#056852] w-4 h-4" />
                        <div>
                          <span className="text-slate-800">Private Mode</span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your profile is hidden. Only currently assigned students can see details.</p>
                        </div>
                      </label>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                      <button type="submit" className="flex items-center gap-2 bg-[#056852] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                        {saved ? <><Check size={14}/> Status Applied</> : 'Apply Visibility Status'}
                      </button>
                    </div>
                  </form>
                )}

                {/* SUPPORT TICKETS TAB */}
                {activeTab === 'Support' && (
                  <div className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Ticket Form */}
                      <form onSubmit={handleRaiseTicket} className="space-y-4">
                        <span className="text-xs font-bold text-slate-800 block">Report Issue or Raise Query</span>
                        
                        {ticketStatus && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl">{ticketStatus}</div>}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                          <input type="text" value={ticketForm.subject} onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })} required placeholder="e.g. Earning distribution issue" className="w-full border-slate-200 rounded-xl text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Explain detail description</label>
                          <textarea value={ticketForm.message} onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })} required rows={4} placeholder="Type details..." className="w-full border-slate-200 rounded-xl text-sm" />
                        </div>
                        <button type="submit" className="w-full bg-[#056852] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#045242] transition">
                          Raise Ticket
                        </button>
                      </form>

                      {/* Ticket History */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-800 block">Support Ticket History</span>
                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                          {tickets.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400 font-semibold">No issues raised yet.</div>
                          ) : (
                            tickets.map((t) => (
                              <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex justify-between items-baseline">
                                  <strong className="text-xs text-slate-800 truncate max-w-[140px]">{t.subject}</strong>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    t.status === 'Open' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>{t.status}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{t.message}</p>
                                {t.reply && (
                                  <div className="mt-2 p-2 bg-emerald-50/40 border border-emerald-100/60 rounded-xl text-[10px] text-emerald-800 font-medium">
                                    <strong>Admin reply:</strong> {t.reply}
                                  </div>
                                )}
                                <span className="text-[8px] text-slate-400 block font-semibold">{new Date(t.createdAt).toLocaleString()}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}
