import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, RefreshCw, Send } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentReviewsSection() {
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ bookingId: '', tutorId: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchEligibleReviews();
  }, []);

  const fetchEligibleReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/eligible-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEligible(data);
        if (data.length > 0) {
          setFormData({
            bookingId: data[0].bookingId,
            tutorId: data[0].tutorId,
            rating: 5,
            comment: ''
          });
        } else {
          setFormData({ bookingId: '', tutorId: '', rating: 5, comment: '' });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBooking = (e) => {
    const bId = e.target.value;
    const selected = eligible.find(item => String(item.bookingId) === String(bId));
    if (selected) {
      setFormData({
        ...formData,
        bookingId: selected.bookingId,
        tutorId: selected.tutorId
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bookingId || !formData.tutorId) return;
    setIsSubmitting(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ bookingId: '', tutorId: '', rating: 5, comment: '' });
        fetchEligibleReviews();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit review');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse font-bold text-sm">
        Loading pending reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Ratings & Reviews</h2>
        <p className="text-sm text-slate-500 font-medium">Leave feedback for completed classes and sessions</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-xs">
          <ShieldCheck size={18} className="text-emerald-600" />
          Thank you! Your feedback has been recorded and the tutor profile rating is updated.
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        {eligible.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-semibold space-y-2">
            <MessageSquare size={36} className="mx-auto text-slate-300 mb-1" />
            <p>No classes pending reviews.</p>
            <p className="text-[10px] text-slate-400 font-medium">Reviews can only be added for completed/paid bookings.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Select Completed Session */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Completed Session</label>
              <select
                required
                value={formData.bookingId}
                onChange={handleSelectBooking}
                className="w-full border-slate-200 rounded-xl text-xs"
              >
                {eligible.map((item) => (
                  <option key={item.bookingId} value={item.bookingId}>
                    {item.subject} with {item.tutorName} (Completed on {new Date(item.completedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Stars Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Session Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="transition hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Written Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Review / Comments</label>
              <textarea
                required
                rows="4"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full border-slate-200 rounded-xl text-xs placeholder-slate-400"
                placeholder="Share your experience with this tutor, their methodology, and classes..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#056852] hover:bg-[#045242] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send size={13} /> {isSubmitting ? 'Submitting Review...' : 'Submit Feedback'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
