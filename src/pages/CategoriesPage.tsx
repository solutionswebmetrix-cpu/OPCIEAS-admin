import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, FolderTree, Edit, Trash2, X, ArrowUp, ArrowDown,
  CheckCircle, GripVertical, Eye, Image as ImageIcon, Upload,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import type { Category } from '../lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<(Category & { total_products?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<(Category & { total_products?: number }) | null>(null);
  const [form, setForm] = useState<Partial<Category>>({
    name: '', slug: '', description: '', sort_order: 1, status: 'Active', is_featured: false,
  });
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiGet('/categories/list.php');
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        if (Array.isArray(list)) setCategories(list as (Category & { total_products?: number })[]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', sort_order: categories.length + 1, status: 'Active', is_featured: false });
    setFormOpen(true);
  };

  const openEdit = (c: Category & { total_products?: number }) => {
    setEditing(c);
    setForm({ ...c });
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: editing?.id,
        name: form.name,
        slug: form.slug,
        description: form.description,
        sort_order: form.sort_order,
        status: form.status === 'Draft' ? 'inactive' : 'active',
        is_featured: !!form.is_featured,
      };
      const res: any = await apiPost(editing ? '/admin/categories/update.php' : '/admin/categories/create.php', payload);
      const category = res?.data || { ...payload, id: editing?.id || `C${Date.now()}` };
      if (editing) {
        setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...category } as any : c));
      } else {
        setCategories(prev => [{ ...category, total_products: 0 }, ...prev]);
      }
    } catch {
      if (editing) setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } as any : c));
      else setCategories(prev => [...prev, { ...form, id: `C${Date.now()}`, total_products: 0 } as any]);
    }
    setFormOpen(false);
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { await apiPost('/admin/categories/delete.php', { id: c.id }); }
    catch {}
    setCategories(prev => prev.filter(x => x.id !== c.id));
  };

  const move = (id: string, dir: 'up' | 'down') => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy.map((c, i) => ({ ...c, sort_order: i + 1 }));
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Organize product catalog with categories and subcategories.</p>
        </div>
        <button onClick={openCreate} className="admin-btn admin-btn-primary">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-sub uppercase tracking-wider">Total</p>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{categories.length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-sub uppercase tracking-wider">Active</p>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{categories.filter(c => c.status === 'Active').length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-sub uppercase tracking-wider">Featured</p>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{categories.filter(c => c.is_featured).length}</h3>
            </div>
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-sub uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{categories.reduce((s, c) => s + (c.total_products || 0), 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden p-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-heading font-bold text-slate-900">All Categories</h3>
          <p className="text-xs text-slate-500 font-sub">Drag to reorder or use arrows</p>
        </div>
        <div className="divide-y divide-slate-100">
          {loading || categories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-sub">{loading ? 'Loading...' : 'No categories yet.'}</div>
          ) : categories.map((c, idx) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onDragStart={() => setDragId(c.id)}
              onDragEnd={() => setDragId(null)}
              className={`p-5 flex items-center gap-4 hover:bg-slate-50/80 transition-colors ${dragId === c.id ? 'opacity-50' : ''}`}
              draggable
            >
              <div className="text-slate-300 cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 via-amber-50 to-amber-100 flex items-center justify-center shrink-0 border border-amber-100/80">
                <FolderTree className="w-7 h-7 text-emerald-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-heading font-bold text-slate-900 text-lg">{c.name}</h4>
                  {c.status === 'Active' ? (
                    <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100 !py-0 !px-2 text-[10px]">ACTIVE</span>
                  ) : (
                    <span className="admin-badge bg-slate-100 text-slate-700 border border-slate-200 !py-0 !px-2 text-[10px]">DRAFT</span>
                  )}
                  {c.is_featured && (
                    <span className="admin-badge bg-amber-50 text-amber-700 border border-amber-100 !py-0 !px-2 text-[10px]">⭐ FEATURED</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1 font-sub">{c.description || 'No description.'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-sub">
                  <span>/{c.slug}</span>
                  <span>·</span>
                  <span>{c.total_products || 0} products</span>
                  <span>·</span>
                  <span>Order #{c.sort_order}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => move(c.id, 'up')}
                  disabled={idx === 0}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(c.id, 'down')}
                  disabled={idx === categories.length - 1}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(c)} className="h-8 w-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-amber-700">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => remove(c)} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setFormOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
              <form onSubmit={save}>
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">{editing ? 'Edit Category' : 'Add New Category'}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 font-sub">Category details and display settings</p>
                  </div>
                  <button type="button" onClick={() => setFormOpen(false)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="admin-label">Category Name *</label>
                      <input
                        required
                        value={form.name || ''}
                        onChange={e => setForm(prev => ({
                          ...prev, name: e.target.value,
                          slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                        }))}
                        className="admin-input"
                        placeholder="Office Furniture"
                      />
                    </div>
                    <div>
                      <label className="admin-label">URL Slug</label>
                      <input value={form.slug || ''} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} className="admin-input" placeholder="office-furniture" />
                    </div>
                    <div>
                      <label className="admin-label">Sort Order</label>
                      <input type="number" min={1} value={form.sort_order || 1} onChange={e => setForm(prev => ({ ...prev, sort_order: Number(e.target.value) }))} className="admin-input" />
                    </div>
                    <div>
                      <label className="admin-label">Status</label>
                      <select value={form.status || 'Active'} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="admin-input">
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!form.is_featured}
                          onChange={e => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                        />
                        <span className="text-sm font-semibold text-slate-700 font-sub">Mark as Featured</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="admin-label">Description</label>
                      <textarea rows={3} value={form.description || ''} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="admin-input resize-none" placeholder="Brief description for category pages..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="admin-label">Category Image / Banner</label>
                      <div className="p-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors bg-slate-50/60">
                        <input type="file" id="cat-img" accept="image/*" className="hidden" />
                        <label htmlFor="cat-img" className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                            <Upload className="w-6 h-6 text-emerald-800" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Upload Image</p>
                          <p className="text-xs text-slate-500 font-sub">Recommended 1200x600px</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                  <button type="button" onClick={() => setFormOpen(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">{editing ? 'Save Changes' : 'Create Category'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
