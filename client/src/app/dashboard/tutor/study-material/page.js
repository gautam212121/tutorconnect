export default function TutorStudyMaterialPage() {
  const items = [
    { title: 'Upload PDF', description: 'Add lecture notes and practice booklets' },
    { title: 'Upload Notes', description: 'Share handouts and summaries' },
    { title: 'Upload Videos', description: 'Add recorded lesson content' },
    { title: 'Assignments', description: 'Create practice work for students' },
    { title: 'Quizzes', description: 'Build quick assessments' },
    { title: 'Homework', description: 'Assign take-home practice' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Study Material</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Learning resources</h1>
          <p className="mt-2 text-sm text-slate-500">Upload and manage PDFs, videos, quizzes, and more.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-3 text-sm text-slate-500">{item.description}</p>
              <button className="mt-5 inline-flex rounded-2xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition">Open</button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
