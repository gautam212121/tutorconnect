"use client";

import { useState, useEffect } from 'react';
import { FileText, BarChart2, Download, Calendar, Users, CreditCard, Star, TrendingUp, RefreshCw, MessageSquare } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';

const REPORT_TABS = [
  { id: 'revenue', label: 'Revenue & Payments', desc: 'Earnings, payouts, and splits', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
  { id: 'users', label: 'User Analytics', desc: 'Registrations, verification metrics', icon: Users, color: 'bg-blue-50 text-blue-700' },
  { id: 'bookings', label: 'Booking Trends', desc: 'Schedules, cancellations, slots', icon: Calendar, color: 'bg-violet-50 text-violet-700' },
  { id: 'tutors', label: 'Tutor Performance', desc: 'Ratings, reviews, and payouts', icon: Star, color: 'bg-amber-50 text-amber-700' },
  { id: 'students', label: 'Student Engagement', desc: 'Activity and billing summaries', icon: FileText, color: 'bg-slate-50 text-slate-700' },
  { id: 'communications', label: 'Communications Log', desc: 'Monitored chats & system messages', icon: MessageSquare, color: 'bg-rose-50 text-rose-700' }
];

export default function ReportsAdminPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  const [reportData, setReportData] = useState({
    usersReport: { totalStudents: 0, totalTutors: 0, activeUsers: 0, inactiveUsers: 0, verifiedTutors: 0, pendingTutorVerification: 0 },
    bookingsReport: { totalBookings: 0, pendingBookings: 0, assignedBookings: 0, approvedBookings: 0, paidBookings: 0, completedBookings: 0, cancelledBookings: 0 },
    paymentsReport: { totalBookingValue: 0, totalSuccessfulPayments: 0, pendingPaymentsVal: 0, failedPaymentsVal: 0, adminPlatformEarnings: 0, tutorPayouts: 0 },
    tutors: [],
    students: [],
    communicationsReport: { totalConversations: 0, totalMessagesSent: 0, unreadMessagesCount: 0 },
    revenueTrends: []
  });

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/admin/reports?fromDate=${dateFrom}&toDate=${dateTo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CSV/Excel Exporter helper
  const triggerExport = (format) => {
    let headers = [];
    let rows = [];
    let filename = `${activeTab}-report-${dateFrom}-to-${dateTo}`;

    if (activeTab === 'revenue') {
      headers = ['Category', 'Value (INR)'];
      rows = [
        ['Total Bookings Value', reportData.paymentsReport.totalBookingValue],
        ['Total Successful Payments', reportData.paymentsReport.totalSuccessfulPayments],
        ['Pending Payments', reportData.paymentsReport.pendingPaymentsVal],
        ['Failed Payments', reportData.paymentsReport.failedPaymentsVal],
        ['Admin Commission Earnings', reportData.paymentsReport.adminPlatformEarnings],
        ['Tutor Share Payouts', reportData.paymentsReport.tutorPayouts]
      ];
    } else if (activeTab === 'users') {
      headers = ['Metric', 'Count'];
      rows = [
        ['Total Registered Students', reportData.usersReport.totalStudents],
        ['Total Registered Tutors', reportData.usersReport.totalTutors],
        ['Active Users', reportData.usersReport.activeUsers],
        ['Inactive Users', reportData.usersReport.inactiveUsers],
        ['Verified Tutors', reportData.usersReport.verifiedTutors],
        ['Pending Tutor Approvals', reportData.usersReport.pendingTutorVerification]
      ];
    } else if (activeTab === 'bookings') {
      headers = ['Status', 'Count'];
      rows = [
        ['Total Bookings Request', reportData.bookingsReport.totalBookings],
        ['Pending Bookings', reportData.bookingsReport.pendingBookings],
        ['Tutor Assigned Bookings', reportData.bookingsReport.assignedBookings],
        ['Approved Bookings', reportData.bookingsReport.approvedBookings],
        ['Paid Bookings', reportData.bookingsReport.paidBookings],
        ['Completed Bookings', reportData.bookingsReport.completedBookings],
        ['Cancelled/Rejected Bookings', reportData.bookingsReport.cancelledBookings]
      ];
    } else if (activeTab === 'tutors') {
      headers = ['Tutor Name', 'Email', 'Rating', 'Reviews Count', 'Bookings', 'Total Earnings (INR)'];
      rows = reportData.tutors.map(t => [
        t.name, t.email, t.rating, t.reviewsCount, t.bookingsCount, t.earnings
      ]);
    } else if (activeTab === 'students') {
      headers = ['Student Name', 'Email', 'Bookings Count', 'Total Spent (INR)'];
      rows = reportData.students.map(s => [
        s.name, s.email, s.bookingsCount, s.spent
      ]);
    } else if (activeTab === 'communications') {
      headers = ['Metric', 'Count'];
      rows = [
        ['Total Active Conversations', reportData.communicationsReport.totalConversations],
        ['Total Messages Sent', reportData.communicationsReport.totalMessagesSent],
        ['Unread Messages', reportData.communicationsReport.unreadMessagesCount]
      ];
    }

    if (format === 'pdf') {
      window.print();
      return;
    }

    const delimiter = format === 'excel' ? '\t' : ',';
    const extension = format === 'excel' ? 'xls' : 'csv';
    const mimeType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';

    const fileContent = [
      headers.join(delimiter),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(delimiter))
    ].join('\n');

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filename}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendering Helper for Charts
  const renderLineChart = () => {
    const data = reportData.revenueTrends || [];
    if (data.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
          No trend data found for this range.
        </div>
      );
    }

    const maxVal = Math.max(...data.map(d => d.amount), 1);
    const height = 160;
    const width = 500;
    const padding = 20;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - (d.amount / maxVal) * (height - padding * 2);
      return { x, y, ...d };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <p className="text-xs font-bold text-slate-700 mb-2">Revenue Timeline Curve (₹)</p>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          
          {/* Timeline curve path */}
          <path d={pathData} fill="none" stroke="#056852" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Dots */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#056852" stroke="#ffffff" strokeWidth="1.5" />
              <title>{`${p.date}: ₹${p.amount}`}</title>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 print:p-0">
      <div className="flex flex-wrap justify-between items-center gap-2 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500">View real platform performance metrics and export audit data sheets</p>
        </div>
        
        {/* Date Filter & Exports */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <div>
              <label className="text-[9px] font-semibold uppercase text-slate-400 block mb-0.5">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-semibold uppercase text-slate-400 block mb-0.5">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none" />
            </div>
          </div>
          
          <div className="h-8 border-l border-slate-200 self-end mx-1" />

          <div className="flex gap-1.5 self-end">
            <button onClick={() => triggerExport('csv')} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition">
              CSV
            </button>
            <button onClick={() => triggerExport('excel')} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition">
              Excel
            </button>
            <button onClick={() => triggerExport('pdf')} className="flex items-center gap-1 bg-[#056852] hover:bg-[#045241] px-3 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-sm">
              Print PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 print:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-0.5">
            {REPORT_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                    activeTab === tab.id ? 'bg-[#056852] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Details Viewport */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw size={24} className="animate-spin text-[#056852] mx-auto mb-2" />
              <p className="text-xs text-slate-400">Compiling report statistics...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              
              {/* Tab: Revenue & Payments */}
              {activeTab === 'revenue' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Revenue & Payments Breakdown</h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {[
                      { label: 'Booking Value (Gross)', val: `₹${reportData.paymentsReport.totalBookingValue}` },
                      { label: 'Successful Payouts', val: `₹${reportData.paymentsReport.totalSuccessfulPayments}` },
                      { label: 'Pending Payments', val: `₹${reportData.paymentsReport.pendingPaymentsVal}` },
                      { label: 'Failed Payments', val: `₹${reportData.paymentsReport.failedPaymentsVal}` },
                      { label: 'Admin Commission (Gross)', val: `₹${reportData.paymentsReport.adminPlatformEarnings}` },
                      { label: 'Tutor Payouts Share', val: `₹${reportData.paymentsReport.tutorPayouts}` }
                    ].map((c, i) => (
                      <div key={i} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400">{c.label}</p>
                        <p className="text-lg font-extrabold text-slate-800 mt-1">{c.val}</p>
                      </div>
                    ))}
                  </div>
                  {renderLineChart()}
                </div>
              )}

              {/* Tab: Users Analytics */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">User Growth & Status Overview</h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {[
                      { label: 'Total Registered Students', val: reportData.usersReport.totalStudents },
                      { label: 'Total Registered Tutors', val: reportData.usersReport.totalTutors },
                      { label: 'Active Platform Users', val: reportData.usersReport.activeUsers },
                      { label: 'Suspended/Inactive Accounts', val: reportData.usersReport.inactiveUsers },
                      { label: 'Verified Tutor Profiles', val: reportData.usersReport.verifiedTutors },
                      { label: 'Pending Approvals Queue', val: reportData.usersReport.pendingTutorVerification }
                    ].map((c, i) => (
                      <div key={i} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400">{c.label}</p>
                        <p className="text-lg font-extrabold text-slate-800 mt-1">{c.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Booking Trends */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Class Bookings Logs</h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {[
                      { label: 'Total Bookings', val: reportData.bookingsReport.totalBookings },
                      { label: 'Pending Slots', val: reportData.bookingsReport.pendingBookings },
                      { label: 'Tutor Assigned', val: reportData.bookingsReport.assignedBookings },
                      { label: 'Approved Requests', val: reportData.bookingsReport.approvedBookings },
                      { label: 'Payments Settled', val: reportData.bookingsReport.paidBookings },
                      { label: 'Successfully Completed', val: reportData.bookingsReport.completedBookings },
                      { label: 'Cancelled Slots', val: reportData.bookingsReport.cancelledBookings }
                    ].map((c, i) => (
                      <div key={i} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400">{c.label}</p>
                        <p className="text-lg font-extrabold text-slate-800 mt-1">{c.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Tutor Performance */}
              {activeTab === 'tutors' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Tutors Earnings & Ratings League</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-500">
                      <thead className="text-[10px] text-slate-700 uppercase bg-slate-50">
                        <tr>
                          <th className="px-4 py-3">Tutor Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3 text-center">Avg Rating</th>
                          <th className="px-4 py-3 text-center">Reviews</th>
                          <th className="px-4 py-3 text-center">Bookings</th>
                          <th className="px-4 py-3 text-right">Total Earnings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.tutors.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-6 text-slate-400">No tutor statistics available.</td>
                          </tr>
                        ) : reportData.tutors.map((t, idx) => (
                          <tr key={t.id || idx} className="bg-white border-b hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                            <td className="px-4 py-3">{t.email}</td>
                            <td className="px-4 py-3 text-center font-bold text-amber-600">★ {t.rating}</td>
                            <td className="px-4 py-3 text-center">{t.reviewsCount}</td>
                            <td className="px-4 py-3 text-center">{t.bookingsCount}</td>
                            <td className="px-4 py-3 text-right font-extrabold text-slate-900">₹{t.earnings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Student Engagement */}
              {activeTab === 'students' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Student Booking Activity</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-500">
                      <thead className="text-[10px] text-slate-700 uppercase bg-slate-50">
                        <tr>
                          <th className="px-4 py-3">Student Name</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3 text-center">Total Bookings</th>
                          <th className="px-4 py-3 text-right">Total Billing Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.students.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-6 text-slate-400">No student statistics available.</td>
                          </tr>
                        ) : reportData.students.map((s, idx) => (
                          <tr key={s.id || idx} className="bg-white border-b hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                            <td className="px-4 py-3">{s.email}</td>
                            <td className="px-4 py-3 text-center font-bold">{s.bookingsCount}</td>
                            <td className="px-4 py-3 text-right font-extrabold text-slate-900">₹{s.spent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Communications Log */}
              {activeTab === 'communications' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Communications & Message Center</h3>
                  <div className="grid gap-3 grid-cols-3">
                    {[
                      { label: 'Active Conversations', val: reportData.communicationsReport.totalConversations },
                      { label: 'Total Messages Sent', val: reportData.communicationsReport.totalMessagesSent },
                      { label: 'Unread Chats', val: reportData.communicationsReport.unreadMessagesCount }
                    ].map((c, i) => (
                      <div key={i} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-slate-400">{c.label}</p>
                        <p className="text-lg font-extrabold text-slate-800 mt-1">{c.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
