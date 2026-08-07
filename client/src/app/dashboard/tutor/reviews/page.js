export default function TutorReviewsPage() {
  const ratings = [
    { label: 'Student Reviews', value: 4.9 },
    { label: 'Reported Reviews', value: 2 },
    { label: 'Reply Reviews', value: 18 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Reviews</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Feedback & ratings</h1>
          <p className="mt-2 text-sm text-slate-500">Review student feedback and manage any reported ratings.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ratings.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
