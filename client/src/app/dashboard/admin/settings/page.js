"use client";

import { useState, useEffect } from 'react';
import { Save, Settings, Globe, Lock, Mail, Bell, CreditCard, Palette, Database, Shield, Smartphone, Image, Plus, Trash2, QrCode } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

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
  const [heroImageFile, setHeroImageFile] = useState(null);

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
    paymentMethods: [],
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smsProvider: '',
    smsApiKey: '',
    smsSenderId: '',
  });

  // SMTP test states
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState('');

  // SMS test states
  const [testMobile, setTestMobile] = useState('');
  const [testingSMS, setTestingSMS] = useState(false);
  const [smsTestStatus, setSmsTestStatus] = useState('');

  // Backups states
  const [backupsList, setBackupsList] = useState([]);
  const [backingUp, setBackingUp] = useState(false);

  // Security password change states
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passStatus, setPassStatus] = useState('');
  const [passError, setPassError] = useState('');

  const update = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/backup/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBackupsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      if (heroImageFile) {
        const formData = new FormData();
        Object.keys(settings).forEach(key => {
          if (key !== 'heroImage') {
            if (typeof settings[key] === 'object') {
              formData.append(key, JSON.stringify(settings[key]));
            } else {
              formData.append(key, settings[key]);
            }
          }
        });
        formData.append('heroImageFile', heroImageFile);
        
        const res = await fetch(`${API}/api/v1/admin/settings`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          fetchSettings();
        }
      } else {
        const res = await fetch(`${API}/api/v1/admin/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          fetchSettings();
        }
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestingEmail(true);
    setEmailTestStatus('');
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/settings/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: settings.smtpHost,
          port: settings.smtpPort,
          user: settings.smtpUser,
          pass: settings.smtpPass,
          to: testEmail
        })
      });
      const data = await res.json();
      setEmailTestStatus(data.message || 'Error occurred');
    } catch (e) {
      setEmailTestStatus(e.message || 'Failed test email connection');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testMobile) return;
    setTestingSMS(true);
    setSmsTestStatus('');
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/settings/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: settings.smsProvider,
          apiKey: settings.smsApiKey,
          senderId: settings.smsSenderId,
          testMobile
        })
      });
      const data = await res.json();
      setSmsTestStatus(data.message || 'Error occurred');
    } catch (e) {
      setSmsTestStatus(e.message || 'Failed SMS test');
    } finally {
      setTestingSMS(false);
    }
  };

  const handleRunBackup = async () => {
    setBackingUp(true);
    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/backup/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBackups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBackingUp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassStatus('');
    setPassError('');
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword
        })
      });
      if (res.ok) {
        setPassStatus('Password updated successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        setPassError(err.message || 'Failed to change password');
      }
    } catch (e) {
      setPassError(e.message || 'Error occurred');
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
                    <img src={settings.heroImage.startsWith('data:') ? settings.heroImage : `${API}${settings.heroImage}`} alt="Hero Preview" className="h-20 w-32 rounded-xl object-cover border border-slate-200 shadow-sm" />
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
                        setHeroImageFile(file);
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
                    value={settings[f.key] || ''}
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
                      value={settings[f.key] || 0}
                      min={f.min}
                      max={f.max}
                      onChange={e => update(f.key, Number(e.target.value))}
                      className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs focus:border-[#056852] focus:outline-none"
                    />
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      value={settings[f.key] || 0}
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

              {/* UPI & QR Management */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">UPI & QR Management</h4>
                    <p className="text-[11px] text-slate-400">Add payment methods for students to scan and pay.</p>
                  </div>
                  <button
                    onClick={() => {
                      const newMethods = [...(settings.paymentMethods || []), { id: Date.now(), label: '', upiId: '', qrImage: '' }];
                      update('paymentMethods', newMethods);
                    }}
                    className="flex items-center gap-1 bg-[#056852] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#045241] transition"
                  >
                    <Plus size={14} /> Add UPI
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(!settings.paymentMethods || settings.paymentMethods.length === 0) && (
                    <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <QrCode className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-xs text-slate-500">No payment methods added. Students won't be able to pay via QR.</p>
                    </div>
                  )}
                  
                  {settings.paymentMethods?.map((method, idx) => (
                    <div key={method.id || idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative flex flex-col md:flex-row gap-4">
                      <button 
                        onClick={() => {
                          const newMethods = settings.paymentMethods.filter((_, i) => i !== idx);
                          update('paymentMethods', newMethods);
                        }}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition p-1"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Provider Name (e.g., GPay, PhonePe)</label>
                          <input
                            type="text"
                            value={method.label}
                            onChange={e => {
                              const newMethods = [...settings.paymentMethods];
                              newMethods[idx].label = e.target.value;
                              update('paymentMethods', newMethods);
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#056852] focus:outline-none"
                            placeholder="Provider Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">UPI ID</label>
                          <input
                            type="text"
                            value={method.upiId}
                            onChange={e => {
                              const newMethods = [...settings.paymentMethods];
                              newMethods[idx].upiId = e.target.value;
                              update('paymentMethods', newMethods);
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#056852] focus:outline-none"
                            placeholder="example@upi"
                          />
                        </div>
                      </div>
                      
                      <div className="w-32 shrink-0 flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 block">QR Code</label>
                        {method.qrImage ? (
                           <div className="relative group rounded-lg border border-slate-200 overflow-hidden bg-white w-24 h-24 flex items-center justify-center">
                             <img src={method.qrImage} alt="QR" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                               <label className="cursor-pointer text-white text-[10px] font-bold bg-[#056852] px-2 py-1 rounded">
                                 Change
                                 <input type="file" accept="image/*" className="hidden" onChange={e => {
                                   const file = e.target.files[0];
                                   if (file) {
                                     const reader = new FileReader();
                                     reader.onloadend = () => {
                                       const newMethods = [...settings.paymentMethods];
                                       newMethods[idx].qrImage = reader.result;
                                       update('paymentMethods', newMethods);
                                     };
                                     reader.readAsDataURL(file);
                                   }
                                 }} />
                               </label>
                             </div>
                           </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 rounded-lg border border-dashed border-slate-300 bg-white text-slate-400 hover:bg-slate-100 transition">
                            <QrCode size={20} className="mb-1" />
                            <span className="text-[9px] font-bold">Upload QR</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const newMethods = [...settings.paymentMethods];
                                  newMethods[idx].qrImage = reader.result;
                                  update('paymentMethods', newMethods);
                                };
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        )}
                      </div>
                    </div>
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-900 font-extrabold">Security Verification</p>
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
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3 max-w-md">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Admin Password</p>
                {passStatus && <p className="text-xs font-bold text-emerald-700">{passStatus}</p>}
                {passError && <p className="text-xs font-bold text-rose-700">{passError}</p>}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Current Password</label>
                  <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">New Password</label>
                  <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Confirm Password</label>
                  <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:bg-white" />
                </div>
                <button onClick={handleChangePassword} className="bg-[#056852] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#045241] transition shadow-sm">
                  Update Password
                </button>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-700">⚠ Session Settings</p>
                <p className="text-[11px] text-amber-600 mt-1">Admin sessions expire after 24 hours of inactivity.</p>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">Email SMTP Settings</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Define outgoing Gmail SMTP or mail server configurations.</p>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMTP Host</label>
                <input type="text" value={settings.smtpHost || ''} onChange={e => update('smtpHost', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMTP Port</label>
                <input type="number" value={settings.smtpPort || ''} onChange={e => update('smtpPort', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMTP User / Username</label>
                <input type="text" value={settings.smtpUser || ''} onChange={e => update('smtpUser', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMTP Password</label>
                <input type="password" value={settings.smtpPass || ''} onChange={e => update('smtpPass', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <input type="email" placeholder="Test email recipient..." value={testEmail} onChange={e => setTestEmail(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none w-48 text-slate-900" />
                <button onClick={handleTestEmail} disabled={testingEmail} className="rounded-xl bg-[#056852]/10 hover:bg-[#056852]/20 text-[#056852] px-4 py-2 text-xs font-bold transition">
                  {testingEmail ? 'Testing...' : 'Test SMTP Credentials'}
                </button>
              </div>
              {emailTestStatus && <p className="text-xs font-semibold text-[#056852]">{emailTestStatus}</p>}
            </div>
          )}

          {activeSection === 'sms' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <p className="text-sm font-bold text-slate-900">SMS Provider Settings</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Integrate SMS API keys to trigger text notifications.</p>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMS Provider</label>
                <select value={settings.smsProvider || ''} onChange={e => update('smsProvider', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition">
                  <option value="">Select Provider</option>
                  <option value="twilio">Twilio SMS</option>
                  <option value="fast2sms">Fast2SMS</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">SMS API Key / Token</label>
                <input type="password" value={settings.smsApiKey || ''} onChange={e => update('smsApiKey', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400 mb-1 block">Sender ID</label>
                <input type="text" value={settings.smsSenderId || ''} onChange={e => update('smsSenderId', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-[#056852] focus:bg-white focus:outline-none transition" />
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <input type="text" placeholder="Test mobile..." value={testMobile} onChange={e => setTestMobile(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none w-48 text-slate-900" />
                <button onClick={handleTestSMS} disabled={testingSMS} className="rounded-xl bg-[#056852]/10 hover:bg-[#056852]/20 text-[#056852] px-4 py-2 text-xs font-bold transition">
                  {testingSMS ? 'Testing...' : 'Test SMS Route'}
                </button>
              </div>
              {smsTestStatus && <p className="text-xs font-semibold text-[#056852]">{smsTestStatus}</p>}
            </div>
          )}

          {activeSection === 'backup' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Database Backup & Recovery</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generate, view and download system data backups.</p>
                </div>
                <button onClick={handleRunBackup} disabled={backingUp} className="bg-[#056852] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#045241] disabled:opacity-50 transition shadow-md">
                  {backingUp ? 'Generating...' : 'Run Backup Now'}
                </button>
              </div>

              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Backup History Logs</p>
                {backupsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">No backups created yet.</div>
                ) : backupsList.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Database size={16} className="text-slate-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 truncate max-w-[280px]">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.date} · {b.size} · {b.format}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">Success</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
