"use client";

import { useState } from 'react';
import { Send, Bell, Mail, Smartphone, Megaphone, Users, ChevronRight, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

const RECENT = [
  { id: 'n1', type: 'push', title: 'New Feature: Live Classes!', message: 'Book a live 1-on-1 session today.', sent: '5,200 users', date: '18 May 2026', status: 'delivered' },
  { id: 'n2', type: 'email', title: 'Monthly Newsletter', message: 'Platform updates and top tutors.', sent: '8,500 users', date: '15 May 2026', status: 'delivered' },
  { id: 'n3', type: 'sms', title: 'Booking Reminder', message: 'Your demo session is tomorrow.', sent: '1,248 users', date: '14 May 2026', status: 'delivered' },
  { id: 'n4', type: 'banner', title: 'Summer Special 30% Off', message: 'Limited time offer on all subjects.', sent: 'All users', date: '12 May 2026', status: 'active' },
];

const TYPE_ICONS = {
  push: Bell,
  email: Mail,
  sms: Smartphone,
  banner: Megaphone,
};

const TYPE_COLORS = {
  push: 'bg-blue-50 text-blue-600',
  email: 'bg-violet-50 text-violet-600',
  sms: 'bg-emerald-50 text-emerald-600',
  banner: 'bg-amber-50 text-amber-600',
};

const CHANNELS = [
  { id: 'push', label: 'Push Notification', icon: Bell, desc: 'Send to app & browser', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'email', label: 'Email Campaign', icon: Mail, desc: 'Reach all subscribers', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { id: 'sms', label: 'SMS Alert', icon: Smartphone, desc: 'Direct text messages', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'banner', label: 'Banner Announcement', icon: Megaphone, desc: 'Site-wide banner', color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

export default function NotificationsAdminPage() {
  const [selectedChannel, setSelectedChannel] = useState('push');
  const [targetAudience, setTargetAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setTitle(''); setMessage('');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notification Center</h1>
        <p className="text-xs text-slate-500">Send push, email, SMS and announcements to users</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Compose Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Channel Selection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900 mb-3">Select Channel</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                      selectedChannel === ch.id ? ch.color + ' ring-2 ring-offset-1 ring-current/30 scale-[1.02]' : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{ch.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{ch.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compose */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-900">Compose Message</p>

            {/* Audience */}
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-500 mb-1 block">Target Audience</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'students', label: 'Students' },
                  { id: 'tutors', label: 'Tutors' },
                  { id: 'premium', label: 'Premium' },
                ].map(a => (
                  <button
                    key={a.id}
                    onClick={() => setTargetAudience(a.id)}
                    className={`rounded-xl py-1.5 text-[11px] font-semibold transition ${
                      targetAudience === a.id ? 'bg-[#056852] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-500 mb-1 block">Title</label>
              <input
                type="text"
                placeholder="Notification title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#056852] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-500 mb-1 block">Message</label>
              <textarea
                rows={4}
                placeholder="Write your notification message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-[#056852] focus:bg-white focus:outline-none resize-none transition"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !title || !message}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#056852] py-2.5 text-xs font-bold text-white hover:bg-[#045241] disabled:opacity-50 transition shadow-md"
            >
              {sent ? (
                <><CheckCircle2 size={15} /> Sent Successfully!</>
              ) : sending ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending...</>
              ) : (
                <><Send size={15} /> Send Notification</>
              )}
            </button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full">
            <p className="text-sm font-bold text-slate-900 mb-3">Sent History</p>
            <div className="space-y-2.5">
              {RECENT.map(n => {
                const Icon = TYPE_ICONS[n.type];
                return (
                  <div key={n.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[n.type]}`}>
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Users size={10} /> {n.sent}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{n.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${n.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {n.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
