"use client";

import { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle, Activity, Globe, Flag, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

const LOGINS = [
  { user: 'admin@demo.com', ip: '192.168.1.100', location: 'Lucknow, IN', time: '18 May 2026, 10:42 AM', device: 'Chrome / Windows', status: 'success' },
  { user: 'admin@demo.com', ip: '45.33.32.156', location: 'Unknown', time: '17 May 2026, 11:30 PM', device: 'Firefox / Linux', status: 'suspicious' },
  { user: 'tutor@demo.com', ip: '103.22.44.12', location: 'Delhi, IN', time: '17 May 2026, 8:15 AM', device: 'Safari / Mac', status: 'success' },
];

const BLOCKED = [
  { ip: '45.33.32.156', reason: 'Brute force attempt', blocked: '17 May 2026', country: 'Unknown' },
  { ip: '192.0.2.1', reason: 'Suspicious activity', blocked: '15 May 2026', country: 'CN' },
];

const PERMISSIONS = [
  { role: 'Admin', canManageUsers: true, canManagePayments: true, canViewReports: true, canModerate: true },
  { role: 'Moderator', canManageUsers: true, canManagePayments: false, canViewReports: true, canModerate: true },
  { role: 'Support', canManageUsers: false, canManagePayments: false, canViewReports: true, canModerate: false },
];

export default function SecurityAdminPage() {
  const [blocked, setBlocked] = useState(BLOCKED);
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(24);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Security & Access Control</h1>
        <p className="text-xs text-slate-500">Monitor security events and manage access policies</p>
      </div>

      {/* Security Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Blocked IPs', value: blocked.length, icon: Shield, color: 'text-rose-600 bg-rose-50' },
          { label: 'Login Attempts', value: 842, icon: Activity, color: 'text-blue-600 bg-blue-50' },
          { label: 'Suspicious Events', value: 3, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Active Admins', value: 2, icon: Lock, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl border border-slate-100 p-3 ${s.color.split(' ')[1]}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={18} className={s.color.split(' ')[0]} />
                <p className="text-[10px] font-semibold uppercase text-slate-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-extrabold ${s.color.split(' ')[0]}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Security Settings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-900">Security Policies</p>
          {[
            { label: '2FA for Admins', desc: 'Require two-factor authentication', value: twoFA, onChange: setTwoFA },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                <p className="text-[11px] text-slate-400">{item.desc}</p>
              </div>
              <button
                onClick={() => item.onChange(!item.value)}
                className={`relative h-6 w-11 rounded-full transition ${item.value ? 'bg-[#056852]' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${item.value ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">Session Timeout (hours)</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={72}
                value={sessionTimeout}
                onChange={e => setSessionTimeout(Number(e.target.value))}
                className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#056852] focus:outline-none"
              />
              <input type="range" min={1} max={72} value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} className="flex-1 accent-[#056852]" />
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5"><AlertTriangle size={13} /> Security Alert</p>
            <p className="text-[11px] text-amber-600 mt-0.5">1 suspicious login detected from unknown IP in last 24 hours.</p>
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-900">Blocked IPs</p>
            <button className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-200 transition">
              + Block IP
            </button>
          </div>
          <div className="space-y-2">
            {blocked.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-rose-50/30 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold font-mono text-slate-900">{b.ip}</p>
                  <p className="text-[11px] text-slate-400">{b.reason} · {b.blocked}</p>
                </div>
                <button onClick={() => setBlocked(prev => prev.filter((_, idx) => idx !== i))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-600 hover:bg-emerald-100 transition border border-emerald-200">
                  <CheckCircle2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Logs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900 mb-3">Recent Login Activity</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-left">User</th>
                <th className="px-4 py-2.5 text-left hidden md:table-cell">IP Address</th>
                <th className="px-4 py-2.5 text-left hidden lg:table-cell">Location</th>
                <th className="px-4 py-2.5 text-left hidden md:table-cell">Device</th>
                <th className="px-4 py-2.5 text-left">Time</th>
                <th className="px-4 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {LOGINS.map((l, i) => (
                <tr key={i} className={`hover:bg-slate-50/50 ${l.status === 'suspicious' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.user}</td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-[11px] text-slate-500">{l.ip}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{l.location}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1"><Smartphone size={11} /> {l.device}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">{l.time}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${l.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.status === 'success' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-slate-900 mb-3">Role Permissions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-left">Role</th>
                <th className="px-4 py-2.5 text-center">Manage Users</th>
                <th className="px-4 py-2.5 text-center">Payments</th>
                <th className="px-4 py-2.5 text-center">Reports</th>
                <th className="px-4 py-2.5 text-center">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PERMISSIONS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-900">{p.role}</td>
                  {[p.canManageUsers, p.canManagePayments, p.canViewReports, p.canModerate].map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center">
                      {val ? <CheckCircle2 size={16} className="text-emerald-500 inline" /> : <XCircle size={16} className="text-slate-300 inline" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
