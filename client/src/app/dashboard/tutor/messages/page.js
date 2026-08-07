export default function TutorMessagesPage() {
  const chats = [
    { name: 'Arjun Patel', last: 'Can we reschedule?', time: '2m ago' },
    { name: 'Sneha Kumar', last: 'Thanks for the class!', time: '15m ago' },
    { name: 'Priya Singh', last: 'Need extra notes.', time: '45m ago' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Messages</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Student conversations</h1>
          <p className="mt-2 text-sm text-slate-500">Chat with students and admins in real time.</p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {chats.map((chat) => (
              <div key={chat.name} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{chat.name}</p>
                    <p className="text-sm text-slate-500">{chat.last}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{chat.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
