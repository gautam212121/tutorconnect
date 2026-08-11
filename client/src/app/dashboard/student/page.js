"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, BookOpen, GraduationCap, Star, Calendar, ArrowRight,
  CreditCard, MessageSquare, Shield, BadgeCheck, ChevronRight, Heart,
  Clock, Users, FileText, HelpCircle, Settings, Bell, User, Headphones,
  Gift, LogOut, Menu, X, CheckCircle,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [searchSubject, setSearchSubject] = useState('');
  const [searchClass, setSearchClass] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('tutorconnect-user');
    if (stored) setUser(JSON.parse(stored));

    const token = localStorage.getItem('tutorconnect-token');
    if (!token) return;

    fetch(`${API}/api/v1/student/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setDashboard(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`${API}/api/v1/subjects`)
      .then(r => r.json())
      .then(data => setSubjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Skeleton */}
        <div className="h-8 w-72 skeleton rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
        <div className="h-48 skeleton rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-64 skeleton rounded-2xl" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const upcomingSessions = dashboard?.upcomingSessions || [];
  const recentBookings = dashboard?.recentBookings || [];
  const mySubjects = dashboard?.subjects || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Here&apos;s what&apos;s happening on your learning journey.</p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: <Calendar size={20} />, iconBg: 'bg-blue-50 text-blue-600',
            value: stats.upcomingSessions || 0, label: 'Upcoming Sessions', sub: 'This Week',
            link: '/dashboard/student?section=schedule', linkText: 'View Schedule →',
          },
          {
            icon: <Users size={20} />, iconBg: 'bg-emerald-50 text-emerald-600',
            value: stats.activeTutors || 0, label: 'Active Tutors', sub: 'Subjects',
            link: '#', linkText: '',
          },
          {
            icon: <CreditCard size={20} />, iconBg: 'bg-green-50 text-green-600',
            value: `₹${(stats.totalSpent || 0).toLocaleString()}`, label: 'Total Spent', sub: 'This Month',
            link: '/dashboard/student?section=payments', linkText: 'View Invoices →',
          },
          {
            icon: <Star size={20} />, iconBg: 'bg-amber-50 text-amber-500',
            value: stats.totalReviews || 0, label: 'My Reviews', sub: 'Total Reviews',
            link: '/dashboard/student?section=reviews', linkText: 'View Reviews →',
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg} mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            {card.linkText && (
              <Link href={card.link} className="mt-2 inline-flex items-center text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                {card.linkText}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <BookOpen size={16} />, title: 'Join Online Session', desc: 'Start your scheduled class', href: '#', color: 'bg-purple-50 text-purple-600' },
              { icon: <CreditCard size={16} />, title: 'Make a Payment', desc: 'Pay for your upcoming sessions', href: '#', color: 'bg-green-50 text-green-600' },
            ].map((action, i) => (
              <Link key={i} href={action.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-50 transition group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color} shrink-0`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{action.title}</p>
                  <p className="text-[10px] text-slate-400">{action.desc}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-[#056852] transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Upcoming Sessions + Recent Bookings ────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Upcoming Sessions</h3>
            <Link href="/dashboard/student?section=schedule" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-10">
              <Calendar size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No upcoming sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((session, i) => {
                const date = session.scheduledAt ? new Date(session.scheduledAt) : null;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    {date && (
                      <div className="w-12 h-14 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
                        <span className="text-lg font-extrabold text-slate-800 -mt-0.5">{date.getDate()}</span>
                        <span className="text-[9px] text-slate-400">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">{session.subject} – {session.grade || 'Class'}</p>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">Confirmed</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <GraduationCap size={10} /> {session.tutor?.name || 'Tutor'} ✓
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin size={10} /> {session.address?.area || session.address?.city || session.tutor?.location || 'Location'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">
                        {date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">{session.duration || 60} min</p>
                      <button className="mt-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition">
                        Join Session
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/dashboard/student?section=schedule" className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            View Full Schedule <ArrowRight size={12} />
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Bookings</h3>
            <Link href="/dashboard/student?section=bookings" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.slice(0, 4).map((booking, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {booking.tutor?.name?.charAt(0) || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {booking.subject} – {booking.grade || 'Class'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {booking.tutor?.name || 'Tutor'} • {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700">₹{booking.amount || 0}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      booking.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                      booking.status === 'Confirmed' ? 'bg-blue-50 text-blue-600' :
                      booking.status === 'Cancelled' ? 'bg-red-50 text-red-500' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/dashboard/student?section=bookings" className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            View All Bookings <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── My Subjects + Need Help ────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* My Subjects */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">My Subjects</h3>
            <Link href="/dashboard/student?section=subjects" className="text-[11px] font-semibold text-emerald-600">View All</Link>
          </div>

          {mySubjects.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400">No subjects yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mySubjects.map((sub, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-600 text-sm font-bold">{sub.name}</span>
                  <span className="text-[10px] text-emerald-400">{sub.tutorCount} Tutor{sub.tutorCount !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Need Help */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Need Help?</h3>
          <p className="text-xs text-slate-400 mb-4">Our support team is here to help you.</p>
          <button className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
            <MessageSquare size={14} className="text-emerald-600" /> Chat with Support
          </button>
        </div>
      </div>

      {/* ── Trust Footer ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">Safe, Verified & Trusted</span>
          </div>
          <p className="text-xs text-slate-400">All tutors are background verified and phone verified for your safety.</p>
          <div className="flex gap-4 ml-auto">
            {[
              { icon: <BadgeCheck size={14} />, label: 'ID Verified' },
              { icon: <MapPin size={14} />, label: 'Address Verified' },
              { icon: <GraduationCap size={14} />, label: 'Experience Checked' },
              { icon: <CheckCircle size={14} />, label: 'Reference Verified' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="text-emerald-500">{badge.icon}</span>
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
