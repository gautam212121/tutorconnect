export default function TutorStudentsPage() {
  const stats = [
    { title: 'All Students', value: 1820, badge: 'Total' },
    { title: 'Active Students', value: 1580, badge: 'Active' },
    { title: 'New Students', value: 120, badge: 'This Month' },
    { title: 'Blocked Students', value: 35, badge: 'Blocked' },
  ];

  const rows = [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Students</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Student management</h1>
          <p className="mt-2 text-sm text-slate-500">View student counts, statuses, and progress at a glance.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.title}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
              <span className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{item.badge}</span>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Student list</p>
              <p className="text-xs text-slate-500">Monitor new, active, and blocked learners.</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.email}>
                    <td className="py-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-4">{row.email}</td>
                    <td className="py-4 text-slate-600">{row.status}</td>
                    <td className="py-4 text-slate-600">{row.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
