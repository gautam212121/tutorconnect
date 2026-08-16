import React, { useState, useEffect } from 'react';
import { LifeBuoy, Send, ClipboardList, RefreshCw, MessageCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentSupportSection() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/student/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ subject: '', message: '' });
        fetchTickets();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit ticket');
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
        Loading support history...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Support Center</h2>
          <p className="text-sm text-slate-500">Submit requests and track status of tickets raised with administration</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        
        {/* Ticket Submission Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs md:col-span-2 space-y-4 h-fit">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-50 pb-3">
            <LifeBuoy size={16} className="text-emerald-700" />
            Raise a New Ticket
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-2xl text-[11px] font-bold">
              Ticket submitted successfully! Support staff will reply shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
                placeholder="e.g. Schedule cancellation request"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Message Description</label>
              <textarea
                required
                rows="5"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
                placeholder="Provide detailed description of your issue..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#056852] hover:bg-[#045242] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Send size={13} /> {isSubmitting ? 'Sending...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>

        {/* Support Tickets History List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs md:col-span-3 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-50 pb-3">
            <ClipboardList size={16} className="text-emerald-700" />
            Ticket History
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-semibold">
                No tickets created yet.
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{t.subject}</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Opened on {new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      t.status === 'Open'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : t.status === 'Replied'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100/50">
                    {t.message}
                  </p>

                  {t.adminReply && (
                    <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-3 space-y-1 mt-2 text-[11px]">
                      <div className="flex items-center gap-1 text-emerald-800 font-bold text-[10px]">
                        <MessageCircle size={12} /> Support Representative Reply
                      </div>
                      <p className="text-slate-700 whitespace-pre-line">{t.adminReply}</p>
                      {t.repliedAt && (
                        <p className="text-[8px] text-slate-400 font-medium text-right mt-1">
                          Replied on {new Date(t.repliedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
