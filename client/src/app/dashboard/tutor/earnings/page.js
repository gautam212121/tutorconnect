export default function TutorEarningsPage() {
  const balances = [
    { label: 'Wallet Balance', value: '₹24,800' },
    { label: 'Total Earnings', value: '₹1,42,300' },
    { label: 'Pending Payment', value: '₹8,600' },
  ];

  const transactions = [
    { title: 'Class payout', amount: '₹2,800', date: 'Today' },
    { title: 'Referral bonus', amount: '₹1,200', date: '5 Aug' },
    { title: 'Withdrawal', amount: '₹5,000', date: '3 Aug' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Earnings</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Payment summary</h1>
          <p className="mt-2 text-sm text-slate-500">View your balance, transactions, and withdrawal options.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {balances.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Transaction history</p>
            <span className="text-xs text-slate-500">Latest 3</span>
          </div>
          <div className="mt-6 space-y-3">
            {transactions.map((item) => (
              <div key={item.title} className="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.date}</p>
                </div>
                <p className="font-semibold text-slate-900">{item.amount}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
