"use client";

import { useState } from 'react';
import { FilePen, Image, FileText, Plus, Edit2, Trash2, Eye, Globe } from 'lucide-react';

const PAGES = [
  { id: 'home', title: 'Home Page', slug: '/', lastEdited: '18 May 2026', status: 'published' },
  { id: 'about', title: 'About Us', slug: '/about', lastEdited: '15 May 2026', status: 'published' },
  { id: 'contact', title: 'Contact Us', slug: '/contact', lastEdited: '10 May 2026', status: 'published' },
  { id: 'faq', title: 'FAQ', slug: '/faq', lastEdited: '5 May 2026', status: 'draft' },
  { id: 'terms', title: 'Terms & Conditions', slug: '/terms', lastEdited: '1 Apr 2026', status: 'published' },
  { id: 'privacy', title: 'Privacy Policy', slug: '/privacy', lastEdited: '1 Apr 2026', status: 'published' },
];

const BLOGS = [
  { id: 'b1', title: 'Top 10 Tips for Online Tutoring Success', author: 'Admin', date: '17 May 2026', status: 'published', views: 2140 },
  { id: 'b2', title: 'How to Find the Perfect Tutor for JEE?', author: 'Admin', date: '14 May 2026', status: 'published', views: 3860 },
  { id: 'b3', title: 'Benefits of 1-on-1 Online Classes', author: 'Admin', date: '10 May 2026', status: 'draft', views: 0 },
];

const BANNERS = [
  { id: 'bn1', title: 'Summer Special — 30% Off', position: 'Home Top', status: 'active', expires: '31 Jul 2026' },
  { id: 'bn2', title: 'New Tutors Joining! Book Now', position: 'Sidebar', status: 'active', expires: '30 Jun 2026' },
  { id: 'bn3', title: 'Refer & Earn ₹500', position: 'Footer', status: 'inactive', expires: '31 Dec 2026' },
];

export default function CMSAdminPage() {
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState(PAGES);
  const [blogs, setBlogs] = useState(BLOGS);
  const [banners, setBanners] = useState(BANNERS);

  const tabs = [
    { id: 'pages', label: 'Pages', icon: FileText, count: pages.length },
    { id: 'blogs', label: 'Blog Posts', icon: FilePen, count: blogs.length },
    { id: 'banners', label: 'Banners', icon: Image, count: banners.length },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Content Management</h1>
          <p className="text-xs text-slate-500">Manage website pages, blogs, banners and announcements</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#056852] px-4 py-2 text-xs font-bold text-white hover:bg-[#045241] transition shadow-md">
          <Plus size={14} /> Create Content
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition ${
                activeTab === tab.id ? 'border-[#056852] text-[#056852]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left">Page Title</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Last Edited</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{page.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell font-mono text-[11px] text-slate-400">{page.slug}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-400">{page.lastEdited}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${page.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"><Edit2 size={13} /></button>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"><Eye size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blog Tab */}
      {activeTab === 'blogs' && (
        <div className="space-y-2.5">
          {blogs.map(blog => (
            <div key={blog.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{blog.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${blog.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {blog.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{blog.author} · {blog.date}{blog.views > 0 ? ` · ${blog.views.toLocaleString()} views` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"><Edit2 size={13} /></button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"><Eye size={13} /></button>
                  <button onClick={() => setBlogs(prev => prev.filter(b => b.id !== blog.id))} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-2.5">
          {banners.map(banner => (
            <div key={banner.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900">{banner.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${banner.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {banner.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{banner.position} · Expires {banner.expires}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"><Edit2 size={13} /></button>
                  <button
                    onClick={() => setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b))}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${banner.status === 'active' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                  >
                    <Globe size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
