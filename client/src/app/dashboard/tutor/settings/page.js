export default function TutorSettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Account preferences</h1>
          <p className="mt-2 text-sm text-slate-500">Update notification, security, and appearance settings.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Notifications', description: 'Booking alerts, messages, and announcements' },
            { label: 'Security', description: 'Password and login methods' },
            { label: 'Appearance', description: 'Theme and display preferences' },
            { label: 'Payment', description: 'Payout and withdrawal settings' },
            { label: 'Profile', description: 'Visibility and contact details' },
            { label: 'Support', description: 'Report issues and request help' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
