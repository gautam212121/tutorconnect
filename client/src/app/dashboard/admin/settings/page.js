"use client";

import { useState, useEffect } from 'react';
import { Save, Settings, Globe, Lock, Mail, Bell, CreditCard, Palette, Database, Shield, Smartphone, Image } from 'lucide-react';
import { adminApi } from '../../../../lib/api';

const SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'hero', label: 'Hero Section', icon: Image },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Smartphone },
  { id: 'backup', label: 'Backup', icon: Database },
];

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-all ${value ? 'bg-[#056852]' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

export default function SettingsAdminPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    siteName: 'VerifiedTutor',
    siteTagline: 'Learn from the Best Tutors Near You',
    siteUrl: 'https://verifiedtutor.in',
    supportEmail: 'support@verifiedtutor.in',
    phoneSupport: '+91 90441 95981',
    commissionRate: 20,
    gstRate: 18,
    minPayout: 500,
    payoutCycle: 'weekly',
    emailVerification: true,
    phoneVerification: true,
    maintenanceMode: false,
    registrationOpen: true,
    twoFactorAdmin: true,
    autoApprove: false,
    emailNewBooking: true,
    emailPayment: true,
    emailMarketing: false,
    smsBooking: true,
    smsPayment: true,
    primaryColor: '#056852',
    accentColor: '#0ea5e9',
    darkMode: false,
    heroTitle: 'Quality Home Tuition',
    heroSubtitle: 'Verified tutors at your doorstep',
    heroImage: '/hero-banner.jpg',
  });

  const update = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  useEffect(() => {
    adminApi.getSettings()
      .then(data => {
        if (data) {
          setSettings(prev => ({
            ...prev,
            ...data
          }));
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  }, []);

  const handleSave = async () => {
    try {
      await adminApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
          <p className="text-xs text-slate-500">Configure platform-wide settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md"
        >
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Settings Nav */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-0.5">
            {SECTIONS.map(sec => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${activeSection === sec.id ? 'bg-[#056852] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <Icon size={15} />
                  {sec.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeSection === 'hero' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Hero Section Settings</p>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Hero Title</label>
                <input
                  type="text"
                  value={settings.heroTitle || ''}
                  onChange={e => update('heroTitle', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition"
                  placeholder="e.g. Quality Home Tuition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Hero Subtitle</label>
                <input
                  type="text"
                  value={settings.heroSubtitle || ''}
                  onChange={e => update('heroSubtitle', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition"
                  placeholder="e.g. Verified tutors at your doorstep"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-2 block">Hero Background Image</label>
                <div className="flex items-center gap-4">
                  {settings.heroImage ? (
                    <img src={settings.heroImage} alt="Hero Preview" className="h-20 w-32 rounded-xl object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => update('heroImage', reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#056852] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#045241] cursor-pointer focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'general' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">General Settings</p>
              {[
                { key: 'siteName', label: 'Site Name', type: 'text' },
                { key: 'siteTagline', label: 'Site Tagline', type: 'text' },
                { key: 'siteUrl', label: 'Site URL', type: 'url' },
                { key: 'supportEmail', label: 'Support Email', type: 'email' },
                { key: 'phoneSupport', label: 'Support Phone', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    value={settings[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition"
                  />
                </div>
              ))}

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700">Platform Controls</p>
                {[
                  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Show maintenance page to users' },
                  { key: 'registrationOpen', label: 'Open Registration', desc: 'Allow new user signups' },
                  { key: 'autoApprove', label: 'Auto-Approve Tutors', desc: 'Skip manual tutor verification' },
                ].map(t => (
                  <div key={t.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{t.label}</p>
                      <p className="text-[11px] text-slate-400">{t.desc}</p>
                    </div>
                    <Toggle value={settings[t.key]} onChange={v => update(t.key, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Payment Settings</p>
              {[
                { key: 'commissionRate', label: 'Commission Rate (%)', min: 0, max: 50 },
                { key: 'gstRate', label: 'GST Rate (%)', min: 0, max: 28 },
                { key: 'minPayout', label: 'Minimum Payout (₹)', min: 100, max: 5000 },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">{f.label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={settings[f.key]}
                      min={f.min}
                      max={f.max}
                      onChange={e => update(f.key, Number(e.target.value))}
                      className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-[#056852] focus:outline-none"
                    />
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      value={settings[f.key]}
                      onChange={e => update(f.key, Number(e.target.value))}
                      className="flex-1 accent-[#056852]"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Payout Cycle</label>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => update('payoutCycle', opt)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${settings.payoutCycle === opt ? 'bg-[#056852] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Notification Preferences</p>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase">Email Notifications</p>
                {[
                  { key: 'emailNewBooking', label: 'New Booking Alerts' },
                  { key: 'emailPayment', label: 'Payment Confirmations' },
                  { key: 'emailMarketing', label: 'Marketing Emails' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between">
                    <p className="text-xs text-slate-700">{n.label}</p>
                    <Toggle value={settings[n.key]} onChange={v => update(n.key, v)} />
                  </div>
                ))}
                <p className="text-xs font-semibold text-slate-600 uppercase pt-2">SMS Notifications</p>
                {[
                  { key: 'smsBooking', label: 'Booking Reminders' },
                  { key: 'smsPayment', label: 'Payment Alerts' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between">
                    <p className="text-xs text-slate-700">{n.label}</p>
                    <Toggle value={settings[n.key]} onChange={v => update(n.key, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Appearance</p>
              {[
                { key: 'primaryColor', label: 'Primary Color' },
                { key: 'accentColor', label: 'Accent Color' },
              ].map(c => (
                <div key={c.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{c.label}</p>
                    <p className="text-[11px] text-slate-400">{settings[c.key]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: settings[c.key] }} />
                    <input type="color" value={settings[c.key]} onChange={e => update(c.key, e.target.value)} className="w-8 h-8 rounded cursor-pointer opacity-0 absolute" />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Dark Mode</p>
                  <p className="text-[11px] text-slate-400">Enable dark theme for admin</p>
                </div>
                <Toggle value={settings.darkMode} onChange={v => update('darkMode', v)} />
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Security Settings</p>
              {[
                { key: 'emailVerification', label: 'Email Verification Required', desc: 'Require email verification for new users' },
                { key: 'phoneVerification', label: 'Phone Verification', desc: 'Require phone OTP for tutors' },
                { key: 'twoFactorAdmin', label: '2FA for Admins', desc: 'Enforce two-factor authentication for admin accounts' },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                    <p className="text-[11px] text-slate-400">{s.desc}</p>
                  </div>
                  <Toggle value={settings[s.key]} onChange={v => update(s.key, v)} />
                </div>
              ))}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">⚠ Session Settings</p>
                <p className="text-[11px] text-amber-600 mt-1">Admin sessions expire after 24 hours of inactivity.</p>
              </div>
            </div>
          )}

          {!['general', 'payment', 'notifications', 'appearance', 'security'].includes(activeSection) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm text-center">
              <p className="text-slate-400 text-sm">This settings section will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
