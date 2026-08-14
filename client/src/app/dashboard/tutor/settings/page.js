"use client";

import { useState } from 'react';
import { Bell, Lock, Palette, CreditCard, UserCircle, LifeBuoy, Check } from 'lucide-react';

export default function TutorSettingsPage() {
  const [activeTab, setActiveTab] = useState('Notifications');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { label: 'Notifications', description: 'Booking alerts, messages, and announcements', icon: <Bell size={18}/> },
    { label: 'Security', description: 'Password and login methods', icon: <Lock size={18}/> },
    { label: 'Appearance', description: 'Theme and display preferences', icon: <Palette size={18}/> },
    { label: 'Payment', description: 'Payout and withdrawal settings', icon: <CreditCard size={18}/> },
    { label: 'Profile', description: 'Visibility and contact details', icon: <UserCircle size={18}/> },
    { label: 'Support', description: 'Report issues and request help', icon: <LifeBuoy size={18}/> },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Account preferences</h1>
          <p className="mt-2 text-sm text-slate-500">Update notification, security, and appearance settings.</p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          <section className="w-full md:w-1/3 flex flex-col gap-2">
            {tabs.map((item) => (
              <button 
                key={item.label} 
                onClick={() => setActiveTab(item.label)}
                className={`p-4 rounded-3xl border text-left transition flex items-center gap-4 ${activeTab === item.label ? 'bg-[#056852] border-[#056852] text-white shadow-md' : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === item.label ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500'}`}>
                   {item.icon}
                </div>
                <div>
                  <p className={`font-bold ${activeTab === item.label ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`text-[10px] mt-1 ${activeTab === item.label ? 'text-teal-100' : 'text-slate-500'}`}>{item.description}</p>
                </div>
              </button>
            ))}
          </section>

          <section className="w-full md:w-2/3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm h-fit min-h-[400px] flex flex-col justify-between">
             <div>
               <h2 className="text-xl font-bold text-slate-900 mb-6">{activeTab} Settings</h2>
               <div className="space-y-4">
                 <p className="text-sm text-slate-600">Preferences for {activeTab} can be adjusted here. These settings are automatically applied to your account across all devices.</p>
                 {activeTab === 'Notifications' && (
                    <div className="space-y-3 mt-4">
                      <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="accent-[#056852] w-4 h-4"/> <span className="text-sm font-semibold text-slate-800">Email Alerts</span></label>
                      <label className="flex items-center gap-3"><input type="checkbox" defaultChecked className="accent-[#056852] w-4 h-4"/> <span className="text-sm font-semibold text-slate-800">Push Notifications</span></label>
                      <label className="flex items-center gap-3"><input type="checkbox" className="accent-[#056852] w-4 h-4"/> <span className="text-sm font-semibold text-slate-800">SMS Updates</span></label>
                    </div>
                 )}
                 {activeTab === 'Security' && (
                    <div className="space-y-4 mt-4">
                      <button className="text-sm font-bold text-[#056852] hover:underline">Change Password</button>
                      <br/>
                      <button className="text-sm font-bold text-[#056852] hover:underline">Enable Two-Factor Authentication</button>
                    </div>
                 )}
               </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end">
               <button onClick={handleSave} className="flex items-center gap-2 bg-[#056852] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#045242] transition">
                 {saved ? <><Check size={16}/> Saved</> : 'Save Preferences'}
               </button>
             </div>
          </section>
        </div>
      </div>
    </main>
  );
}
