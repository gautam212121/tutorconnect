export default function TutorProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Personal details</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your experience, education, subjects and availability.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Experience', value: '8 years' },
            { label: 'Education', value: 'M.Sc. Physics' },
            { label: 'Skills', value: 'Physics, Maths, Chemistry' },
            { label: 'Languages', value: 'English, Hindi' },
            { label: 'Subjects', value: 'JEE, NEET, CBSE' },
            { label: 'Availability', value: 'Weekdays 9am–7pm' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-4 text-base font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
