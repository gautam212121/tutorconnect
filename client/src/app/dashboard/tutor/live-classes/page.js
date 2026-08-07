export default function TutorLiveClassesPage() {
  const classes = [
    { title: 'JEE Physics', time: '10:00 AM', status: 'Live', students: 15 },
    { title: 'CBSE Math', time: '12:30 PM', status: 'Upcoming', students: 10 },
    { title: 'NEET Chemistry', time: '03:00 PM', status: 'Upcoming', students: 12 },
    { title: 'English Speaking', time: '05:00 PM', status: 'Cancelled', students: 0 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Live Classes</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Live teaching schedule</h1>
          <p className="mt-2 text-sm text-slate-500">Start live sessions, review meeting history, and manage recordings.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {['Start Live Class', 'Meeting History', 'Zoom / Google Meet', 'Recordings'].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item}</p>
              <p className="mt-4 text-sm text-slate-500">Manage your real-time teaching workflow.</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Scheduled classes</p>
              <p className="text-xs text-slate-500">Today’s live and upcoming sessions.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {classes.map((cls) => (
              <div key={cls.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{cls.title}</p>
                    <p className="text-xs text-slate-500">{cls.time} · {cls.students} students</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${cls.status === 'Live' ? 'bg-rose-100 text-rose-600' : cls.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {cls.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
