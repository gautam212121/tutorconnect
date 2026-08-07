export default function InstituteDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Institute dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Coaching network overview</h1>
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">12 active requirements</div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            ['Open requirements', '6 new tutor requests'],
            ['Partner tutors', '24 verified educators'],
            ['Response rate', '88% within 24 hours'],
          ].map(([title, value]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
