"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, AlertCircle, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../../../lib/api';
import { useSocket } from '../../../../hooks/useSocket';

const DEMAND_COLORS = {
  High: 'bg-rose-100 text-rose-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-500',
};

const CATEGORY_COLORS = [
  '#056852', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f97316', '#ec4899', '#10b981', '#3b82f6'
];

// Simple Toast Component
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg transition-all ${type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-80"><X size={16} /></button>
    </div>
  );
};

export default function CoursesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [pending, setPending] = useState([]); // Real-world: fetch from API
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState({ name: '', image: '', description: '', priority: 'Medium', status: 'active' });
  
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to delete
  
  // Toast
  const [toast, setToast] = useState({ message: '', type: '' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3000);
  };

  const socket = useSocket();

  // Fetch Data
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      showToast('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleCreated = (newCat) => setCategories(prev => [newCat, ...prev]);
    const handleUpdated = (updatedCat) => setCategories(prev => prev.map(c => c._id === updatedCat._id ? updatedCat : c));
    const handleDeleted = (id) => setCategories(prev => prev.filter(c => c._id !== id));
    
    socket.on('categoryCreated', handleCreated);
    socket.on('categoryUpdated', handleUpdated);
    socket.on('categoryDeleted', handleDeleted);
    
    return () => {
      socket.off('categoryCreated', handleCreated);
      socket.off('categoryUpdated', handleUpdated);
      socket.off('categoryDeleted', handleDeleted);
    };
  }, [socket]);

  // Handlers
  const handleOpenModal = (mode, category = null) => {
    setModalMode(mode);
    if (mode === 'edit' && category) {
      setCurrentCategory(category);
    } else {
      setCurrentCategory({ name: '', image: '', description: '', priority: 'Medium', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await adminApi.createCategory(currentCategory);
        showToast('Category created successfully');
      } else {
        await adminApi.updateCategory(currentCategory._id, currentCategory);
        showToast('Category updated successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm) return;
    try {
      await adminApi.deleteCategory(deleteConfirm);
      showToast('Category deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6 space-y-6 relative h-full flex flex-col">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-sm text-slate-500">Manage categories, subjects, and course approvals</p>
        </div>
        <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center gap-2 rounded-xl bg-[#056852] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#045241] transition shadow-md">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2 shrink-0">
        <div className="flex gap-2">
          {[
            { id: 'categories', label: 'Categories', count: categories.length },
            { id: 'approval', label: 'Pending Approval', count: pending.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${activeTab === tab.id ? 'bg-slate-100 text-[#056852]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? 'bg-[#056852] text-white' : 'bg-slate-200 text-slate-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        
        {activeTab === 'categories' && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-[#056852] focus:outline-none focus:ring-2 focus:ring-[#056852]/10 transition"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#056852]" />
          </div>
        ) : activeTab === 'categories' ? (
          filteredCategories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
              {filteredCategories.map(cat => (
                <div key={cat._id} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${cat.status === 'inactive' ? 'opacity-60 border-slate-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="h-12 w-12 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#056852]/10 text-xl text-[#056852]">
                          <BookOpen size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-base font-bold text-slate-900 line-clamp-1" title={cat.name}>{cat.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(cat.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${DEMAND_COLORS[cat.priority] || DEMAND_COLORS.Medium}`}>{cat.priority}</span>
                  </div>
                  
                  {cat.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{cat.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal('edit', cat)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm(cat._id)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={14} /></button>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${cat.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {cat.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center p-6">
              <BookOpen className="mb-4 h-10 w-10 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700">No categories found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">Get started by creating your first course category. Categories help students find relevant subjects quickly.</p>
              <button onClick={() => handleOpenModal('add')} className="mt-4 rounded-xl bg-[#056852] px-4 py-2 text-sm font-bold text-white hover:bg-[#045241] transition">Add Category</button>
            </div>
          )
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
             <p className="text-slate-500">Pending courses approval UI will go here.</p>
          </div>
        )}
      </div>

      {/* Category Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{modalMode === 'add' ? 'Add New Category' : 'Edit Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category Name *</label>
                <input required type="text" value={currentCategory.name} onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/20 transition" placeholder="e.g. Mathematics" />
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Image Upload</label>
                <div className="flex items-center gap-4">
                  {currentCategory.image ? (
                    <img src={currentCategory.image} alt="Preview" className="h-14 w-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <BookOpen size={20} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setCurrentCategory({ ...currentCategory, image: reader.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#056852] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#045241] cursor-pointer focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Description</label>
                <textarea value={currentCategory.description} onChange={e => setCurrentCategory({...currentCategory, description: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-[#056852] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#056852]/20 transition min-h-[80px]" placeholder="Brief description of this category..."></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Priority</label>
                  <select value={currentCategory.priority} onChange={e => setCurrentCategory({...currentCategory, priority: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#056852] focus:bg-white focus:outline-none transition appearance-none">
                    <option value="High">High Demand</option>
                    <option value="Medium">Medium Demand</option>
                    <option value="Low">Low Demand</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Status</label>
                  <select value={currentCategory.status} onChange={e => setCurrentCategory({...currentCategory, status: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-[#056852] focus:bg-white focus:outline-none transition appearance-none">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-[#056852] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#045241] transition">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Delete Category?</h3>
            <p className="mb-6 text-sm text-slate-500">This action cannot be undone. Are you sure you want to permanently delete this category?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleDeleteCategory} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition shadow-md shadow-rose-200">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
