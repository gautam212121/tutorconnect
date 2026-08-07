export default function TutorCoursesPage() {
  const cards = [
    { title: 'My Courses', count: 32, description: 'Published and active classes' },
    { title: 'Draft Courses', count: 4, description: 'Work in progress' },
    { title: 'Pending Approval', count: 2, description: 'Awaiting review' },
    { title: 'Published Courses', count: 26, description: 'Live for students' },
  ];

  const courses = [
    { title: 'JEE Physics', status: 'Published', students: 128 },
    { title: 'CBSE Math', status: 'Draft', students: 0 },
    { title: 'NEET Chemistry', status: 'Pending', students: 0 },
    { title: 'Spoken English', status: 'Published', students: 72 },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Courses</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Course management</h1>
          <p className="mt-2 text-sm text-slate-500">Add, edit, or remove your course content and track approval status.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.title}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{card.count}</p>
              <p className="mt-3 text-sm text-slate-500">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Course list</p>
              <p className="text-xs text-slate-500">Review published courses or update drafts.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <div key={course.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">{course.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{course.students} enrolled students</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
