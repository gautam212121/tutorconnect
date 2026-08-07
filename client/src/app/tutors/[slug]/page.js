import Link from 'next/link';
import ReviewSection from '../../components/ReviewSection';

const tutorProfiles = {};

export default function TutorDetailPage({ params }) {
  const tutor = tutorProfiles[params.slug];

  if (!tutor) {
    return <div className="p-10 text-center text-slate-600">Tutor not found.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Tutor profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{tutor.name}</h1>
            <p className="mt-2 text-lg text-slate-600">{tutor.title}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.specialties.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Starting from</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{tutor.rate}</div>
            <div className="mt-2 text-sm text-slate-600">★ {tutor.rating} · {tutor.experience}</div>
            <Link href="/tutors" className="mt-4 inline-flex rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Book a demo</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">About</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{tutor.about}</p>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <strong className="text-slate-900">Location:</strong> {tutor.location}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">Quick chat</h2>
            <p className="mt-2 text-sm text-slate-500">Send a quick intro to discuss your learning goals.</p>
            <textarea className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Hello! I am looking for help with..." />
            <button className="mt-4 w-full rounded-full bg-teal-600 px-4 py-3 font-semibold text-white">Send message</button>
          </div>
        </div>
        <ReviewSection />
      </div>
    </main>
  );
}
