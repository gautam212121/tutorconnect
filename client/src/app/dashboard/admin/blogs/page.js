"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, User, Eye, X, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || ' ';
const CATEGORIES = ['Parents Guide', 'Study Tips', 'Tutor Strategies', 'Exam Prep'];

export default function BlogsAdminPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(null); // null for new blog, else editing
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Parents Guide',
    author: '',
    role: 'Educator',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verifiedtutor-token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchBlogs = () => {
    setLoading(true);
    fetch(`${API}/api/v1/blogs`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBlogs(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openAddModal = () => {
    setCurrentBlog(null);
    setForm({
      title: '',
      excerpt: '',
      content: '',
      category: 'Parents Guide',
      author: '',
      role: 'Educator',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
    });
    setModalOpen(true);
  };

  const openEditModal = (blog) => {
    setCurrentBlog(blog);
    setForm({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'Parents Guide',
      author: blog.author || '',
      role: blog.role || 'Educator',
      readTime: blog.readTime || '5 min read',
      image: blog.image || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const isEdit = !!currentBlog;
    const url = isEdit ? `${API}/api/v1/admin/blogs/${currentBlog._id || currentBlog.id}` : `${API}/api/v1/admin/blogs`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');
      
      setModalOpen(false);
      fetchBlogs();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const res = await fetch(`${API}/api/v1/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      fetchBlogs();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Blogs</h1>
          <p className="text-xs text-slate-500 mt-1">Publish, edit or delete articles for your Verified Tutor blog.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#056852] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#045241] transition shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Blog Post</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between pb-6">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Total Articles: {filteredBlogs.length}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#056852] border-t-transparent" />
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredBlogs.map((blog) => (
                  <tr key={blog._id || blog.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 max-w-md">
                      <div className="flex items-center gap-3">
                        <img src={blog.image} className="h-10 w-16 object-cover rounded-lg border border-slate-100" />
                        <div>
                          <p className="text-slate-900 line-clamp-1 font-bold">{blog.title}</p>
                          <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5">{blog.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {blog.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span>{blog.author}</span>
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">{blog.role}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-normal text-slate-400">
                      {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(blog)}
                          className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id || blog.id)}
                          className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            No articles found.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                {currentBlog ? 'Edit Blog Post' : 'Add New Blog Post'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Author Name</label>
                  <input
                    type="text"
                    required
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Author Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Read Time</label>
                  <input
                    type="text"
                    value={form.readTime}
                    onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    placeholder="e.g. 5 min read"
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Banner Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Short Excerpt</label>
                <input
                  type="text"
                  required
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Full Content</label>
                <textarea
                  required
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Markdown or plain text content..."
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#056852] text-white hover:bg-[#045241] text-xs font-bold disabled:bg-slate-700 transition"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{currentBlog ? 'Update Post' : 'Publish Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
