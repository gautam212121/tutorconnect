import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube, Linkedin, Download } from 'lucide-react';

export default function Footer() {
  const handleNewsletterSubscribe = (e) => {
    e.preventDefault();
    // Implementation can be added later or we can omit the form
  };

  return (
    <footer className="bg-slate-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/verified-tutor-logo.png" alt="Verified Tutor" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Connecting students with the right tutors for better learning and brighter futures.
            </p>
            <div className="space-y-2 text-xs text-slate-400 mb-4">
              <p className="flex items-center gap-2"><MapPin size={12} /> Lucknow, Uttar Pradesh, India</p>
              <p className="flex items-center gap-2">
                <Phone size={12} />
                <a href="tel:+919044195981" className="hover:underline hover:text-white transition">+91 90441 95981</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={12} />
                <a href="mailto:verifiedtutor.in@gmail.com" className="hover:underline hover:text-white transition">verifiedtutor.in@gmail.com</a>
              </p>
            </div>
            <div className="flex gap-3 mb-6">
              <a href="https://www.facebook.com/share/1JdUJuQVYe/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 transition" title="Facebook">
                <Facebook size={14} />
              </a>
              <a href="https://www.instagram.com/verifiedtutor?igsh=MWh3d3U5Y2JxMmN1YQ==" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 transition" title="Instagram">
                <Instagram size={14} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 transition" title="YouTube">
                <Youtube size={14} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-600 transition" title="LinkedIn">
                <Linkedin size={14} />
              </a>
            </div>
            
            <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition">
              <Download size={16} />
              Download App
            </a>
          </div>

          {/* For Students */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">For Students</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {[
                { label: 'Find a Tutor', href: '/?register=true' },
                { label: 'How It Works', href: '/how-it-works' },
                { label: 'Subjects', href: '/subjects' },
                { label: 'Exams', href: '/subjects' },
                { label: 'Safety & Security', href: '/why-us' },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="hover:text-white transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Tutors */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">For Tutors</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {[
                { label: 'Become a Tutor', href: '/careers' },
                { label: 'How Tutors Earn', href: '/how-it-works' },
                { label: 'Pricing & Commission', href: '/why-us' },
                { label: 'Help Center', href: '/about' },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="hover:text-white transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Company</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {[
                  { label: 'About Us', href: '/about' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Terms & Conditions', href: '/about' },
                  { label: 'Privacy Policy', href: '/about' },
                ].map((item, i) => (
                  <li key={i}>
                    <Link href={item.href} className="hover:text-white transition">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Verified Tutor. All rights reserved.
          </p>
          <div className="flex gap-4 text-[11px] text-slate-500">
            <Link href="/about" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/about" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/about" className="hover:text-white transition">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
