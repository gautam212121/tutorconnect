export default function TutorNotificationsPage() {
  const alerts = [
    { title: 'New enquiry', message: 'Riya requested a trial class.', time: 'Just now' },
    { title: 'Payment alert', message: '₹2,800 deposited.', time: '30m ago' },
    { title: 'Class cancelled', message: 'Session with Arjun was cancelled.', time: '1h ago' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Notifications</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Alerts & updates</h1>
          <p className="mt-2 text-sm text-slate-500">Stay on top of enquiries, payments and class changes.</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-500">{alert.message}</p>
                <p className="mt-2 text-[11px] text-slate-400">{alert.time}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
