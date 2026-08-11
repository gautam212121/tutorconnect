"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import RegisterModal from '../components/RegisterModal';
import { Search, MapPin, Star, BookOpen, Award, CheckCircle, Phone, ArrowRight, Filter, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://51.21.255.194:5000';

function TutorsSearchContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject') || searchParams.get('q') || '';
  const initialArea = searchParams.get('area') || searchParams.get('location') || '';

  const [subjectQuery, setSubjectQuery] = useState(initialSubject);
  const [areaQuery, setAreaQuery] = useState(initialArea);
  const [modeQuery, setModeQuery] = useState('');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const fetchTutors = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (subjectQuery) params.set('subject', subjectQuery);
    if (areaQuery) params.set('area', areaQuery);
    if (modeQuery) params.set('mode', modeQuery);

    fetch(`${API}/api/v1/tutors/search?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setTutors(Array.isArray(data.tutors) ? data.tutors : []);
        setLoading(false);
      })
      .catch(() => {
        setTutors([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTutors();
  }, [initialSubject, initialArea]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTutors();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Search Header Banner */}
        <section className="bg-gradient-to-br from-[#056852] to-emerald-900 text-white py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Find Verified Tutors
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl mx-auto mb-8">
              Search by subject, class, or location. Get direct access to top qualified home and online tutors.
            </p>

            {/* Live Search Controls */}
            <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto bg-white p-2 sm:p-3 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Subject, class, or tutor name..."
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 sm:w-48">
                <MapPin size={18} className="text-slate-400" />
                <select
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">All Locations</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 sm:w-40">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={modeQuery}
                  onChange={(e) => setModeQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">All Modes</option>
                  <option value="Home">Home Tuition</option>
                  <option value="Online">Online Class</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-[#056852] hover:bg-[#045241] text-white font-bold px-6 py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Search size={16} />
                <span>Search Tutors</span>
              </button>
            </form>
          </div>
        </section>

        {/* Results Container */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {loading ? 'Searching...' : `Found ${tutors.length} Tutor${tutors.length !== 1 ? 's' : ''}`}
            </h2>
            {subjectQuery && (
              <span className="text-xs text-slate-500">
                Showing results for "<strong className="text-slate-800">{subjectQuery}</strong>"
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#056852] mb-3" size={36} />
              <p className="text-sm font-semibold text-slate-600">Finding best verified tutors for you...</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#056852]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No tutors found for your search</h3>
              <p className="text-xs text-slate-500 mb-6">
                Try searching with a broader keyword or register your request to let verified tutors reach out to you directly.
              </p>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-[#056852] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#045241] transition"
              >
                Post Your Tutor Request
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-[#056852] font-bold text-lg overflow-hidden border border-emerald-200">
                          {tutor.image ? (
                            <img src={tutor.image} alt={tutor.name} className="w-full h-full object-cover" />
                          ) : (
                            tutor.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">{tutor.name}</h3>
                            <CheckCircle size={14} className="text-emerald-600" />
                          </div>
                          <p className="text-xs text-slate-500">{tutor.headline || 'Home & Online Tutor'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-700 font-bold text-xs">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{tutor.rating || '4.9'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{tutor.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-slate-400" />
                        <span>{tutor.experience} Teaching Exp.</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {(tutor.subjects || []).map((sub, i) => (
                        <span key={i} className="bg-emerald-50 text-[#056852] px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-100">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Fee Starts at</span>
                      <span className="text-base font-extrabold text-slate-900">₹{tutor.price} <span className="text-xs font-normal text-slate-500">/{tutor.feeType || 'hr'}</span></span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setIsBookingOpen(true);
                      }}
                      className="bg-[#056852] hover:bg-[#045241] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Book Trial</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedTutor && (
        <BookingModal
          tutor={selectedTutor}
          isOpen={isBookingOpen}
          onClose={() => {
            setIsBookingOpen(false);
            setSelectedTutor(null);
          }}
        />
      )}

      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
}

export default function TutorsSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#056852]" size={36} /></div>}>
      <TutorsSearchContent />
    </Suspense>
  );
}
