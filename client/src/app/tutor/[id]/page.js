"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { getImageUrl } from '../../../lib/image';
import {
  Clock, MapPin, GraduationCap, Star, Check, CheckCircle2, ChevronRight,
  Share2, ShieldAlert, Award, Calendar, BookOpen, MessageSquare, Loader2,
  AlertCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

export default function TutorProfilePage() {
  const params = useParams();
  const tutorId = params.id;

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;

    setLoading(true);
    fetch(`${API}/api/v1/tutors/${tutorId}`)
      .then(r => {
        if (!r.ok) throw new Error('Tutor not found');
        return r.json();
      })
      .then(data => {
        setTutor(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tutorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#056852] mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading tutor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-sm px-6">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Tutor Profile Not Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed">We could not find the tutor profile you were looking for. It may have been disabled or deleted.</p>
            <Link href="/" className="inline-block px-5 py-2.5 bg-[#056852] text-white text-sm font-bold rounded-xl hover:bg-[#045241] transition">Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-filled WhatsApp link
  const subjectsList = tutor.subjects ? tutor.subjects.join('/') : 'General';
  const customMessage = `Hello! I would like to book a free demo session with tutor ${tutor.name} for ${subjectsList} tuition.`;
  const whatsappUrl = `https://wa.me/918052559771?text=${encodeURIComponent(customMessage)}`;

  // Default Mock Values for unavailable fields to match user images
  const experienceYears = tutor.experience || '5+ Years';
  const pricePerHour = tutor.price || 200;
  const ratingScore = tutor.rating || 0.0;
  const reviewsCount = tutor.reviews || 0;
  const tutorHeadline = tutor.headline || `${tutor.subjects?.join(' & ') || 'General'} Tutor in Lucknow`;
  const tutorBio = tutor.bio || `Experienced home & online tutor with deep understanding in ${subjectsList}. Specialised in conceptual learning and exam preparations.`;
  const tutorQualification = tutor.qualification || 'B.Tech';
  const tutorLocation = tutor.location || 'Lucknow';
  const tuitionModeStr = Array.isArray(tutor.mode) ? tutor.mode.join(' / ') : tutor.mode || 'Both';
  const verifiedTutor = tutor.verified ?? true;
  
  // Calculate dynamic profile score
  let profileScore = 3.6;
  if (tutor.verified) profileScore += 2.0;
  if (tutor.bio) profileScore += 1.5;
  if (tutor.qualification) profileScore += 1.0;
  if (tutor.avatar) profileScore += 1.0;
  profileScore = Math.min(profileScore, 10).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* ═══════════════════════ HEADER PANEL (Image 1) ═══════════════════════ */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950/80 rounded-3xl overflow-hidden shadow-xl text-white p-6 sm:p-8 md:p-10 border border-slate-700/30 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 z-10 relative">
            
            {/* Left Block: Avatar & Core Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Frame */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-32 h-32 rounded-2xl bg-white p-1 border-2 border-emerald-500/20 shadow-md">
                  {tutor.image ? (
                    <img src={getImageUrl(tutor.image)} alt={tutor.name} className="w-full h-full rounded-xl object-cover" onError={(e) => { e.currentTarget.src = '/placeholder-image.png'; }} />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-400 to-[#056852] flex items-center justify-center text-white text-4xl font-extrabold shadow-sm">
                      {tutor.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {verifiedTutor && (
                    <div className="absolute -bottom-2.5 -right-2.5 bg-emerald-500 text-white rounded-full p-1 border-4 border-slate-900 shadow-md flex items-center justify-center">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </div>
                {/* Free Demo Badge */}
                <span className="mt-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  Free Demo Available
                </span>
              </div>

              {/* Core Information Details */}
              <div className="text-center sm:text-left space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{tutor.name}</h1>
                  {verifiedTutor && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm sm:text-base font-medium">{tutorHeadline}</p>

                {/* Rating Details */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-300">
                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className={`${s <= ratingScore ? 'fill-amber-400' : 'text-slate-500'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-white">{ratingScore.toFixed(1)}</span>
                  <span>({reviewsCount} reviews)</span>
                </div>

                {/* Experience / Location / Degree */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-400" /> {experienceYears} exp</span>
                  <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {tutorLocation}</span>
                  <span className="flex items-center gap-1.5"><GraduationCap size={12} className="text-emerald-400" /> {tutorQualification}</span>
                </div>

                {/* Subject Tags */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1.5">
                  {tutor.subjects?.map((sub, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 hover:bg-white/15 transition border border-white/5 rounded-lg text-xs font-semibold">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Block: Pricing & Demo CTA */}
            <div className="w-full md:w-64 bg-white text-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 flex flex-col justify-between shrink-0 shadow-lg shadow-black/10">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Tuition Fee</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-800">₹{pricePerHour}</span>
                    <span className="text-xs text-slate-400">per hour</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-xs font-bold text-slate-500">Modes available</span>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    {tuitionModeStr}
                  </span>
                </div>
              </div>

              {/* Book Free Demo Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-100 active:scale-95"
              >
                {/* WhatsApp Logo SVG */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Book Free Demo
              </a>
            </div>
          </div>
        </div>

        {/* ═══════════════════════ QUICK STATS BAR ═══════════════════════ */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-extrabold text-slate-800">New</p>
              <p className="text-xs text-slate-400 mt-1">Students</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-extrabold text-slate-800">{tutor.subjects?.length || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Subjects</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-extrabold text-slate-800">{ratingScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Rating</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-2xl font-extrabold text-slate-800">{experienceYears}</p>
              <p className="text-xs text-slate-400 mt-1">Yrs Exp</p>
            </div>
          </div>

          {/* Profile Score Bar */}
          <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Award size={14} className="text-[#056852]" /> Tutor Profile Score</span>
            <div className="flex items-center gap-3 flex-1 sm:max-w-xs">
              <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profileScore * 10}%` }}></div>
              </div>
              <span className="font-bold text-slate-800">{profileScore} <span className="text-slate-400 font-normal">/ 10</span></span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════ BOTTOM DETAILS AREA (Image 2) ═══════════════════════ */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: About & Professional Info (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* At a Glance Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">AT A GLANCE</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { text: 'Free demo class', check: true },
                  { text: 'Verified tutor', check: verifiedTutor },
                  { text: `${experienceYears} experience`, check: true },
                  { text: `₹${pricePerHour} per hour`, check: true },
                  { text: 'Online available', check: tutor.mode?.includes('Online') },
                  { text: 'Home visits available', check: tutor.mode?.includes('Home') }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.check ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Check size={12} className="stroke-[2.5]" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* About Tutor Bio Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">About {tutor.name?.split(' ')[0]}</h3>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{tutorBio}</p>
            </div>

            {/* Why Choose Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">Why Choose {tutor.name?.split(' ')[0]}?</h3>
              <div className="space-y-3">
                {[
                  `Teaches ${tutor.subjects?.join(', ') || 'General'}`,
                  `Home visits: ${tutor.address?.area || tutorLocation}`,
                  `₹${pricePerHour}/hr · ${experienceYears} teaching experience`,
                  'Free demo class — no commitment required',
                  'Online & home visit tuition available'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <CheckCircle2 size={16} className="text-[#056852] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">Education</h3>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#056852] flex items-center justify-center shrink-0">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{tutorQualification}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Academic Degree / Professional Specialization</p>
                </div>
              </div>
            </div>

            {/* Classes & Subjects Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">Classes & Subjects</h3>
              <div className="space-y-4">
                {[
                  { title: 'Class 6-8', match: true },
                  { title: 'Intermediate Level', match: true },
                  { title: 'Class 9-10', match: false },
                  { title: 'Class 11-12', match: false },
                  { title: 'UPSC Preparation', match: true },
                  { title: 'SSC Preparation', match: true }
                ].map((level, i) => (
                  <div key={i} className="space-y-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">{level.title}</span>
                    <div className="flex flex-wrap gap-2">
                      {level.match ? (
                        tutor.subjects?.map((sub, j) => (
                          <span key={j} className="px-3 py-1 bg-emerald-50 text-[#056852] border border-emerald-100 rounded-lg text-xs font-semibold">
                            {sub}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No subjects configured for this class level.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode & Area Section */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Teaching Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.mode?.map((m, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-semibold">
                      {m}
                    </span>
                  )) || <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-semibold">Both</span>}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Teaching Areas</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MapPin size={12} /> {tutor.address?.area || tutorLocation}
                  </span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <MapPin size={12} /> Lucknow City
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Availability & Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Availability Box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                <Calendar size={16} className="text-[#056852]" /> Availability
              </h3>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => {
                  const activeDay = tutor.availableDays?.includes(day) ?? true;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className={`font-semibold ${activeDay ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                      <span className={`px-2.5 py-1 rounded-md font-bold ${activeDay ? 'bg-slate-50 border border-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                        {activeDay ? tutor.availableTimeSlots || '09:00 - 18:00' : 'Unavailable'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Details Box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-2">Profile Details</h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Location', value: tutorLocation },
                  { label: 'Experience', value: experienceYears },
                  { label: 'Qualification', value: tutorQualification },
                  { label: 'Subjects', value: tutor.subjects?.length || 1 },
                  { label: 'Mode', value: tuitionModeStr },
                  { label: 'Since', value: 'Mar 2026' },
                  { label: 'Profile Score', value: `${profileScore} / 10`, isScore: true }
                ].map((detail, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-400">{detail.label}</span>
                    {detail.isScore ? (
                      <span className="font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{detail.value}</span>
                    ) : (
                      <span className="font-bold text-slate-700">{detail.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Book Free Demo Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 text-center space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto text-[#056852]">
                <MessageSquare size={20} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold">Book Free Demo</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Connect with {tutor.name?.split(' ')[0]} and start your learning journey today.
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 inline-block px-3 py-1 rounded-full">
                  Join 0+ satisfied students
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition duration-300 text-xs font-bold active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
