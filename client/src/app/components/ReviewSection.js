"use client";

const reviews = [
  { name: 'Priya S.', rating: '5.0', text: 'Clear explanations and excellent communication. My son gained confidence quickly.' },
  { name: 'Rahul M.', rating: '4.9', text: 'The booking flow and tutor matching feel very polished and convenient.' },
];

export default function ReviewSection() {
  return (
    <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-xl font-semibold text-slate-900">Student reviews</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.name} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{review.name}</div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">★ {review.rating}</div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
