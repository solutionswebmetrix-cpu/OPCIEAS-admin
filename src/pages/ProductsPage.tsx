import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Plus, Filter, Trash2, Edit, Eye, X, Package,
  Upload, Image as ImageIcon, CheckCircle, XCircle, MoreVertical, Star,
  Download, ChevronLeft, ChevronRight, TrendingUp, Tag, Minus,
} from 'lucide-react';
import { apiGet, apiPost, apiFormData } from '../lib/api';
import { downloadCsv } from '../lib/export';
import { safeDecimal } from '../lib/number';
import type { Product, Category, ProductImage } from '../lib/types';

const tabs = ['All', 'Published', 'Pending', 'Rejected'];
const productStatuses = ['Published', 'Pending', 'Rejected', 'Draft'];

const statusStyles: Record<string, string> = {
  Published: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Pending: 'bg-amber-50 text-amber-800 border-amber-100',
  Rejected: 'bg-red-50 text-red-700 border-red-100',
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
};

const API_BASE =
  (import.meta as any).env?.VITE_API_URL || '';
const BACKEND_BASE =
  (import.meta as any).env?.VITE_BACKEND_URL ||
  (import.meta as any).env?.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  '';

type ProductForm = Partial<Product> & { category_name?: string };

type ProductFormModalProps = {
  product: ProductForm;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  submitLabel: string;
  isEdit: boolean;
  categories: Category[];
  existingImages: Array<{ id?: string; url: string; is_primary?: boolean }>;
  pendingImages: File[];
  uploadedImages: string[];
  setField: (k: keyof ProductForm, v: any) => void;
  setFeatures: (next: string[]) => void;
  setSpecs: (next: Record<string, string>) => void;
  resolveImageUrl: (src?: string | null) => string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeExistingImage: (index: number) => Promise<void>;
  replacePrimaryImage: (file: File) => Promise<void>;
  onClose: () => void;
};

const resolveImageUrl = (src?: string | null): string => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) return src;
  if (src.startsWith('/uploads/')) return `${BACKEND_BASE}${src}`;
  if (src.startsWith('uploads/')) return `${BACKEND_BASE}/${src}`;
  if (src.startsWith('/')) return `${BACKEND_BASE}${src}`;
  return src;
};

const parseJsonArray = (v: any, fallback: string[] = []): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : fallback; } catch { return fallback; }
  }
  return fallback;
};

const parseJsonObject = (v: any, fallback: Record<string, string> = {}): Record<string, string> => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (const k of Object.keys(v)) out[k] = String((v as any)[k] ?? '');
    return out;
  }
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return parseJsonObject(p, fallback); } catch { return fallback; }
  }
  return fallback;
};

function ProductFormModal({
  product,
  onSubmit,
  title,
  submitLabel,
  isEdit,
  categories,
  existingImages,
  pendingImages,
  uploadedImages,
  setField,
  setFeatures,
  setSpecs,
  resolveImageUrl,
  handleImageUpload,
  removeExistingImage,
  replacePrimaryImage,
  onClose,
}: ProductFormModalProps) {
  const featuresList: string[] = Array.isArray(product.features) ? product.features : [];
  const specsMap: Record<string, string> = (product.specs && typeof product.specs === 'object') ? product.specs as Record<string, string> : {};

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="modal-content max-w-4xl"
      onClick={e => e.stopPropagation()}
    >
      <form onSubmit={onSubmit}>
        <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white rounded-t-[20px] z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-xl">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5 font-sub">Fill product information</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
          <div className="sm:col-span-2">
            <label className="admin-label">Product Name *</label>
            <input required value={product.name || ''} onChange={e => setField('name', e.target.value)} className="admin-input" placeholder="Executive Office Chair Pro" />
          </div>
          <div>
            <label className="admin-label">SKU</label>
            <input value={product.sku || ''} onChange={e => setField('sku', e.target.value)} className="admin-input" placeholder="OPC-1001" />
          </div>
          <div>
            <label className="admin-label">Category *</label>
            <select required value={product.category_id || ''} onChange={e => setField('category_id', e.target.value)} className="admin-input">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label">Subcategory</label>
            <input value={product.subcategory || ''} onChange={e => setField('subcategory', e.target.value)} className="admin-input" placeholder="Kindergarten, Primary, Hostel Cot, etc." />
          </div>
          <div>
            <label className="admin-label">Supply Type</label>
            <select value={product.supply_type || 'IN_HOUSE'} onChange={e => setField('supply_type', e.target.value)} className="admin-input">
              <option value="IN_HOUSE">In-House Manufacturing</option>
              <option value="PARTNER">Partner Supply</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Price (₹) *</label>
            <input type="number" required min={0} value={product.price || 0} onChange={e => setField('price', Number(e.target.value))} className="admin-input" />
          </div>
          <div>
            <label className="admin-label">Discount Price (₹)</label>
            <input type="number" min={0} value={product.discount_price || 0} onChange={e => setField('discount_price', Number(e.target.value))} className="admin-input" />
          </div>
          <div>
            <label className="admin-label">Stock Quantity</label>
            <input type="number" min={0} value={product.stock_quantity || 0} onChange={e => setField('stock_quantity', Number(e.target.value))} className="admin-input" />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="admin-label">Status</label>
              <select value={product.status || 'Pending'} onChange={e => setField('status', e.target.value)} className="admin-input">
                {productStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={!!(product.is_featured ?? product.featured)} onChange={e => { setField('is_featured', e.target.checked ? 1 : 0); setField('featured', !!e.target.checked); }} className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800" />
              <span className="admin-label mb-0">Featured</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="admin-label">Short Description</label>
            <input value={product.short_description || ''} onChange={e => setField('short_description', e.target.value)} className="admin-input" placeholder="One-liner for product cards" />
          </div>
          <div className="sm:col-span-2">
            <label className="admin-label">Full Description</label>
            <textarea rows={4} value={product.description || ''} onChange={e => setField('description', e.target.value)} className="admin-input resize-none" placeholder="Detailed product description, materials, use-cases..." />
          </div>
          <div>
            <label className="admin-label">Dimensions</label>
            <input value={product.dimensions && typeof product.dimensions === 'object' ? JSON.stringify(product.dimensions) : (typeof product.dimensions === 'string' ? product.dimensions : '')} onChange={e => { try { const parsed = JSON.parse(e.target.value || '{}'); setField('dimensions', parsed); } catch { setField('dimensions', e.target.value || 'Available on request'); } }} className="admin-input" placeholder='{"L": 1800, "W": 900, "H": 350}' />
          </div>
          <div>
            <label className="admin-label">Materials Used</label>
            <input value={product.materials_used || product.material || ''} onChange={e => { setField('materials_used', e.target.value); setField('material', e.target.value); }} className="admin-input" placeholder="Mild Steel, Powder Coated Finish" />
          </div>
          <div>
            <label className="admin-label">Weight</label>
            <input value={product.weight || ''} onChange={e => setField('weight', e.target.value)} className="admin-input" placeholder="1,300 grams" />
          </div>
          <div>
            <label className="admin-label">Packaging Specifications</label>
            <input value={product.packaging_specifications || ''} onChange={e => setField('packaging_specifications', e.target.value)} className="admin-input" placeholder="Export carton / standard packaging" />
          </div>
          <div>
            <label className="admin-label">Warranty Terms</label>
            <input value={product.warranty_terms || ''} onChange={e => setField('warranty_terms', e.target.value)} className="admin-input" placeholder="12 Months Warranty on domestic supply." />
          </div>
          <div>
            <label className="admin-label">Variants</label>
            <input value={Array.isArray(product.variants) ? product.variants.join(', ') : typeof product.variants === 'string' ? product.variants : ''} onChange={e => setField('variants', e.target.value ? e.target.value.split(',').map(v => v.trim()).filter(Boolean) : [])} className="admin-input" placeholder="Standard, Luxury, Premium" />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" checked={!!product.export_available} onChange={e => setField('export_available', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800" />
            <label className="admin-label mb-0">Export Applicable</label>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="admin-label mb-0">Features</label>
              <button type="button" onClick={() => setFeatures([...featuresList, ''])} className="admin-btn admin-btn-secondary !py-1 !px-3 !text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Feature
              </button>
            </div>
            <div className="space-y-2">
              {featuresList.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={f} onChange={e => { const next = [...featuresList]; next[i] = e.target.value; setFeatures(next); }} className="admin-input !py-2" placeholder={`Feature ${i + 1}`} />
                  <button type="button" onClick={() => setFeatures(featuresList.filter((_, idx) => idx !== i))} className="h-9 w-9 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center text-slate-500" title="Remove">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!featuresList.length && <p className="text-xs text-slate-400 font-sub italic">No features added yet.</p>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="admin-label mb-0">Specifications</label>
              <button type="button" onClick={() => setSpecs({ ...specsMap, [`Spec ${Object.keys(specsMap).length + 1}`]: '' })} className="admin-btn admin-btn-secondary !py-1 !px-3 !text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Spec
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(specsMap).map(([k, v], i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={k} onChange={e => { const next = { ...specsMap }; delete next[k]; next[e.target.value || `Spec ${i + 1}`] = v; setSpecs(next); }} className="admin-input !py-2 flex-1 font-medium" placeholder="Spec name (e.g. Material)" />
                  <input value={v} onChange={e => { const next = { ...specsMap }; next[k] = e.target.value; setSpecs(next); }} className="admin-input !py-2 flex-[1.4]" placeholder="Spec value" />
                  <button type="button" onClick={() => { const next = { ...specsMap }; delete next[k]; setSpecs(next); }} className="h-9 w-9 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center text-slate-500" title="Remove">
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {!Object.keys(specsMap).length && <p className="text-xs text-slate-400 font-sub italic">No specifications added yet.</p>}
            </div>
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="admin-label">SEO Title</label>
              <input value={product.meta_title || ''} onChange={e => setField('meta_title', e.target.value)} className="admin-input" placeholder="Browser tab title / OG title" />
            </div>
            <div>
              <label className="admin-label">SEO Description</label>
              <input value={product.meta_description || ''} onChange={e => setField('meta_description', e.target.value)} className="admin-input" placeholder="155-character search snippet" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="admin-label">Product Images</label>
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors bg-slate-50/60">
              <input type="file" id="prod-imgs" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <label htmlFor="prod-imgs" className="flex flex-col items-center justify-center gap-2 py-4 cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Upload className="w-6 h-6 text-emerald-800" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Click to upload or drag images</p>
                <p className="text-xs text-slate-500 font-sub">PNG, JPG, WebP up to 5MB each</p>
              </label>
              {existingImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Existing Gallery ({existingImages.length})</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {existingImages.map((img, i) => {
                      const src = resolveImageUrl(img.url);
                      return (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                          {img.is_primary && <span className="absolute top-1 left-1 z-10 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">Primary</span>}
                          {src ? (
                            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                          )}
                          {isEdit && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 gap-1">
                              {img.is_primary && (
                                <label className="flex-1 relative">
                                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) replacePrimaryImage(f); if (e.target) e.target.value = ''; }} />
                                  <span className="block w-full text-center bg-emerald-700 text-white text-[10px] py-1 rounded cursor-pointer font-semibold hover:bg-emerald-800">Replace</span>
                                </label>
                              )}
                              <button type="button" onClick={() => removeExistingImage(i)} title="Delete image" className="bg-red-600 text-white rounded p-1 hover:bg-red-700 shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {pendingImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Pending Uploads ({pendingImages.length})</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {pendingImages.map((f, i) => {
                      const preview = typeof URL !== 'undefined' && typeof (URL as any).createObjectURL === 'function' ? (URL as any).createObjectURL(f) : '';
                      return (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-emerald-200">
                          <span className="absolute top-1 left-1 z-10 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">New</span>
                          {preview ? (
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-[9px] truncate w-full mt-1">{f.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {uploadedImages.length > 0 && pendingImages.length === 0 && !existingImages.length && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-200">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px] sticky bottom-0">
          <button type="button" onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary">{submitLabel}</button>
        </div>
      </form>
    </motion.div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Product | null>(null);
  const [viewOpen, setViewOpen] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const perPage = 6;
  const [form, setForm] = useState<ProductForm>({
    name: '', sku: '', category_id: '', subcategory: '', price: 0, discount_price: 0,
    stock_quantity: 0, short_description: '', description: '', status: 'Published',
    is_featured: false, features: [], specs: {}, meta_title: '', meta_description: '',
    supply_type: 'IN_HOUSE', dimensions: {}, materials_used: '', packaging_specifications: '', warranty_terms: '12 Months Warranty on domestic supply.', weight: '', variants: [], export_available: false,
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id?: string; url: string; is_primary?: boolean }>>([]);

  useEffect(() => {
    if (editOpen) {
      const ex: Array<{ id?: string; url: string; is_primary?: boolean }> = [];
      if (Array.isArray(editOpen.images) && editOpen.images.length) {
        for (const im of editOpen.images as ProductImage[]) {
          ex.push({ id: String(im.id ?? ''), url: (im as any).image_url || im.image_path, is_primary: !!im.is_primary });
        }
      } else if (Array.isArray(editOpen.gallery) && editOpen.gallery.length) {
        editOpen.gallery.forEach((u, i) => ex.push({ url: u, is_primary: i === 0 }));
      } else if (editOpen.image) {
        ex.push({ url: editOpen.image, is_primary: true });
      }
      setExistingImages(ex);
      const feats = parseJsonArray(editOpen.features || editOpen.features, []);
      const specs = parseJsonObject(editOpen.specifications || editOpen.specs, {});
      setEditOpen({
        ...editOpen,
        is_featured: !!(editOpen.is_featured ?? editOpen.featured),
        featured: !!(editOpen.is_featured ?? editOpen.featured),
        features: feats,
        specs,
        specifications: specs as any,
        meta_title: editOpen.meta_title || '',
        meta_description: editOpen.meta_description || '',
      });
    } else {
      setExistingImages([]);
    }
  }, [editOpen?.id]);

  useEffect(() => {
    if (createOpen) {
      setExistingImages([]);
    }
  }, [createOpen]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await apiGet('/products/list.php', {
        status: tab !== 'All' ? tab : undefined,
        category_id: catFilter !== 'All' ? catFilter : undefined,
      });
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.data || res?.data?.items || []);
      if (Array.isArray(list)) {
        setProducts(list as Product[]);
      } else {
        setProducts([]);
      }
      return list as Product[];
    } catch {
      setProducts([]);
      return [] as Product[];
    } finally {
      setLoading(false);
    }
  }, [tab, catFilter]);

  useEffect(() => {
    (async () => {
      try {
        const catRes: any = await apiGet('/categories/list.php');
        const cats = Array.isArray(catRes?.data) ? catRes.data : (catRes?.data?.data || []);
        if (Array.isArray(cats)) setCategories(cats as Category[]);
      } catch {}
      await loadProducts();
    })();
  }, [loadProducts]);

  useEffect(() => {
    const reloadOnActive = () => {
      if (document.visibilityState !== 'hidden') {
        void loadProducts();
      }
    };

    window.addEventListener('focus', reloadOnActive);
    document.addEventListener('visibilitychange', reloadOnActive);

    return () => {
      window.removeEventListener('focus', reloadOnActive);
      document.removeEventListener('visibilitychange', reloadOnActive);
    };
  }, [loadProducts]);

  const filtered = products.filter(p => {
    const matchesSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
      || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'All' || p.status === tab;
    const matchesCat = catFilter === 'All' || p.category_id === catFilter;
    return matchesSearch && matchesTab && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const allSelectedOnPage = paginated.length > 0 && paginated.every(p => selected.has(p.id));
  const toggleAllPage = () => {
    const next = new Set(selected);
    if (allSelectedOnPage) paginated.forEach(p => next.delete(p.id));
    else paginated.forEach(p => next.add(p.id));
    setSelected(next);
  };

  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    try {
      if (action === 'delete') {
        for (const id of ids) {
          await apiPost('/admin/products/delete.php', { id });
        }
      } else {
        for (const id of ids) {
          await apiPost('/admin/products/update.php', { id, status: action });
        }
      }
      await loadProducts();
    } catch {
      await loadProducts();
    }

    setSelected(new Set());
  };

  const deleteProduct = async (p: Product) => {
    try {
      await apiPost('/admin/products/delete.php', { id: p.id });
      await loadProducts();
    } catch {
      await loadProducts();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPendingImages(prev => [...prev, ...files]);
    setUploadedImages(prev => [...prev, ...files.map(file => file.name)]);
    if (e.target) e.target.value = '';
  };

  const removeExistingImage = async (index: number) => {
    if (!editOpen) return;
    const target = existingImages[index];
    if (!target) return;
    try {
      await apiPost('/admin/products/images.php', {
        product_id: editOpen.id,
        action: 'remove',
        image_id: target.id,
        image_url: target.url,
      } as any);
    } catch {}
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const replacePrimaryImage = async (file: File) => {
    if (!editOpen) return;
    try {
      const fd = new FormData();
      fd.append('action', 'replace_primary');
      fd.append('product_id', editOpen.id);
      fd.append('image', file);
      const res: any = await apiFormData('/admin/products/images.php', fd);
      const newUrl = res?.data?.replaced_with?.url;
      if (newUrl) {
        setExistingImages(prev => {
          const next = prev.filter(p => !p.is_primary);
          next.unshift({ url: newUrl, is_primary: true });
          return next;
        });
      }
    } catch {}
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        supply_type: form.supply_type || 'IN_HOUSE',
        features: Array.isArray(form.features) ? form.features.filter(Boolean) : [],
        specifications: (form.specs && typeof form.specs === 'object') ? { ...form.specs, 'Supply Type': form.supply_type || 'IN_HOUSE' } : { 'Supply Type': form.supply_type || 'IN_HOUSE' },
        dimensions: form.dimensions && typeof form.dimensions === 'object' ? form.dimensions : (form.dimensions ? { details: String(form.dimensions) } : {}),
        materials_used: form.materials_used || form.material || '',
        packaging_specifications: form.packaging_specifications || '',
        warranty_terms: form.warranty_terms || '12 Months Warranty on domestic supply.',
        weight: form.weight || '',
        variants: Array.isArray(form.variants) ? form.variants : (form.variants ? String(form.variants).split(',').map(v => v.trim()).filter(Boolean) : []),
        export_available: form.export_available ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
        meta_title: form.meta_title || '',
        meta_description: form.meta_description || '',
      };
      const res: any = await apiPost('/admin/products/create.php', payload);
      const created = res?.data?.product || res?.data || { ...payload, id: `P${Date.now()}`, created_at: new Date().toISOString() };
      const createdId = String(res?.data?.product_id ?? res?.data?.id ?? created?.id ?? '');
      if (createdId && pendingImages.length) {
        for (let i = 0; i < pendingImages.length; i++) {
          const file = pendingImages[i];
          const fd = new FormData();
          fd.append('action', 'add');
          fd.append('product_id', createdId);
          if (i === 0 && !existingImages.some(ei => ei.is_primary)) {
            fd.append('image', file);
            await apiFormData('/admin/products/images.php', fd);
            try {
              await apiPost('/admin/products/images.php', { product_id: createdId, action: 'set_primary', image_id: '' } as any);
            } catch {}
          } else {
            fd.append('image', file);
            await apiFormData('/admin/products/images.php', fd);
          }
        }
      }
      await loadProducts();
    } catch {
      await loadProducts();
    }
    setCreateOpen(false);
    setForm({ name: '', sku: '', category_id: '', price: 0, discount_price: 0, stock_quantity: 0, short_description: '', description: '', status: 'Published', is_featured: false, features: [], specs: {}, meta_title: '', meta_description: '' });
    setUploadedImages([]);
    setPendingImages([]);
    setExistingImages([]);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOpen) return;
    try {
      const feats = Array.isArray(editOpen.features) ? editOpen.features.filter(Boolean) : [];
      const specsObj = (editOpen.specs && typeof editOpen.specs === 'object') ? editOpen.specs : {};
      const payload: any = {
        id: editOpen.id,
        name: editOpen.name,
        slug: editOpen.slug,
        supply_type: editOpen.supply_type || 'IN_HOUSE',
        category_id: editOpen.category_id,
        subcategory: editOpen.subcategory || '',
        sku: editOpen.sku,
        short_description: editOpen.short_description,
        description: editOpen.description,
        price: editOpen.price,
        discount_price: editOpen.discount_price,
        stock_quantity: editOpen.stock_quantity,
        status: editOpen.status,
        features: feats,
        specifications: { ...specsObj, 'Supply Type': editOpen.supply_type || 'IN_HOUSE' },
        dimensions: editOpen.dimensions && typeof editOpen.dimensions === 'object' ? editOpen.dimensions : (editOpen.dimensions ? { details: String(editOpen.dimensions) } : {}),
        materials_used: editOpen.materials_used || editOpen.material || '',
        packaging_specifications: editOpen.packaging_specifications || '',
        warranty_terms: editOpen.warranty_terms || '12 Months Warranty on domestic supply.',
        weight: editOpen.weight || '',
        variants: Array.isArray(editOpen.variants) ? editOpen.variants : (editOpen.variants ? String(editOpen.variants).split(',').map(v => v.trim()).filter(Boolean) : []),
        export_available: !!(editOpen.export_available),
        is_featured: (editOpen.is_featured ?? editOpen.featured) ? 1 : 0,
        meta_title: editOpen.meta_title || '',
        meta_description: editOpen.meta_description || '',
      };
      await apiPost('/admin/products/update.php', payload);
      if (pendingImages.length) {
        for (const file of pendingImages) {
          const fd = new FormData();
          fd.append('action', 'add');
          fd.append('product_id', editOpen.id);
          fd.append('image', file);
          await apiFormData('/admin/products/images.php', fd);
        }
      }
      await loadProducts();
    } catch {
      await loadProducts();
    }
    setEditOpen(null);
    setUploadedImages([]);
    setPendingImages([]);
    setExistingImages([]);
  };

  const setField = useCallback((k: keyof ProductForm, v: any) => {
    if (editOpen) {
      setEditOpen(prev => prev ? ({ ...prev, [k]: v } as Product) : prev);
      return;
    }
    setForm(prev => ({ ...prev, [k]: v }));
  }, [editOpen]);

  const setFeatures = useCallback((next: string[]) => {
    setField('features', next);
  }, [setField]);

  const setSpecs = useCallback((next: Record<string, string>) => {
    setField('specs', next);
  }, [setField]);

  const handleModalClose = useCallback(() => {
    setCreateOpen(false);
    setEditOpen(null);
    setUploadedImages([]);
    setPendingImages([]);
    setExistingImages([]);
  }, []);

  const getCatName = (id?: string | null) => categories.find(c => c.id === id)?.name || '—';

  const exportProducts = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Discount', 'Stock', 'Status'];
    const rows = filtered.map(item => ({
      ID: item.id,
      Name: item.name,
      Category: getCatName(item.category_id),
      Price: `₹${(item.price || 0).toLocaleString()}`,
      Discount: `₹${(item.discount_price || 0).toLocaleString()}`,
      Stock: item.stock_quantity || 0,
      Status: item.status || '',
    }));
    downloadCsv('products.csv', headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Manage product listings, approvals, and inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportProducts} className="admin-btn admin-btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary">
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, SKU..." className="admin-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} className="admin-input pl-10 pr-8 appearance-none min-w-[180px]">
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {tabs.map(t => {
              const count = t === 'All' ? products.length : products.filter(p => p.status === t).length;
              return (
                <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`tab-btn text-xs ${tab === t ? 'active' : ''}`}>
                  {t} <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-700">{selected.size} selected:</span>
              <button onClick={() => handleBulkAction('Published')} className="admin-btn !py-1.5 !px-3 !text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100">
                <CheckCircle className="w-3.5 h-3.5" /> Publish
              </button>
              <button onClick={() => handleBulkAction('Rejected')} className="admin-btn !py-1.5 !px-3 !text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => handleBulkAction('delete')} className="admin-btn admin-btn-danger !py-1.5 !px-3 !text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[950px]">
            <thead>
              <tr>
                <th className="w-12 pl-6">
                  <input type="checkbox" checked={allSelectedOnPage} onChange={toggleAllPage} className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800" />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Stats</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 font-sub">
                    {loading ? 'Loading products...' : 'No products found.'}
                  </td>
                </tr>
              ) : paginated.map(p => (
                <tr key={p.id}>
                  <td className="pl-6">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => {
                        const next = new Set(selected);
                        if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                        setSelected(next);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const imgSrc = resolveImageUrl(p.image || (p.gallery?.[0]) || (Array.isArray(p.images) && p.images.length ? (p.images[0] as any)?.image_url || (p.images[0] as any)?.image_path : null));
                        if (imgSrc) {
                          return (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                              <img src={imgSrc} alt={p.name} loading="lazy" className="w-full h-full object-cover" onError={e => { (e.currentTarget as any).style.display = 'none'; (e.currentTarget.parentElement?.querySelector('.pkg-fb') as HTMLElement | null)?.classList.remove('hidden'); }} />
                              <div className="pkg-fb hidden w-full h-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                                <Package className="w-6 h-6 text-amber-700" />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-amber-700" />
                          </div>
                        );
                      })()}
                      <div className="min-w-0 max-w-[260px]">
                        <button onClick={() => setViewOpen(p)} className="font-semibold text-slate-900 hover:text-emerald-800 text-left block truncate">
                          {p.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-sub">{p.sku || p.id}</span>
                          {(p.featured || p.is_featured) && (
                            <span className="admin-badge bg-amber-50 text-amber-700 border border-amber-100 !py-0 !px-2">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />{getCatName(p.category_id)}
                    </span>
                  </td>
                  <td>
                    {p.discount_price && p.discount_price < (p.price || 0) ? (
                      <div>
                        <div className="font-bold text-emerald-800">₹{p.discount_price.toLocaleString()}</div>
                        <div className="text-xs text-slate-400 font-sub line-through">₹{(p.price || 0).toLocaleString()}</div>
                      </div>
                    ) : (
                      <div className="font-bold text-slate-800">₹{(p.price || 0).toLocaleString()}</div>
                    )}
                  </td>
                  <td>
                    <span className={`text-sm font-semibold ${(p.stock_quantity || 0) > 10 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {p.stock_quantity || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge border ${statusStyles[p.status ?? 'Pending'] ?? ''}`}>{p.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                        <span className="font-semibold text-slate-700">{p.total_orders ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-semibold text-slate-700">{safeDecimal(p.rating).toFixed(1)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button onClick={() => setViewOpen(p)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditOpen(p)} className="h-8 w-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-amber-700" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      {p.status === 'Pending' && (
                        <button onClick={async () => {
                          try {
                            await apiPost('/admin/products/update.php', { id: p.id, status: 'Published' });
                            await loadProducts();
                          } catch {
                            await loadProducts();
                          }
                        }} className="h-8 w-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-700" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-card-lg border border-slate-100 py-1.5 z-20">
                            <button onClick={() => { setEditOpen(p); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit className="w-4 h-4" /> Edit Product
                            </button>
                            <button onClick={() => { deleteProduct(p); setMenuOpen(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 font-sub">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} products
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === p ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={handleModalClose}>
            <ProductFormModal
              product={form}
              onSubmit={submitCreate}
              title="Add New Product"
              submitLabel="Create Product"
              isEdit={false}
              categories={categories}
              existingImages={existingImages}
              pendingImages={pendingImages}
              uploadedImages={uploadedImages}
              setField={setField}
              setFeatures={setFeatures}
              setSpecs={setSpecs}
              resolveImageUrl={resolveImageUrl}
              handleImageUpload={handleImageUpload}
              removeExistingImage={removeExistingImage}
              replacePrimaryImage={replacePrimaryImage}
              onClose={handleModalClose}
            />
          </motion.div>
        )}
        {editOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={handleModalClose}>
            <ProductFormModal
              product={editOpen}
              onSubmit={submitEdit}
              title="Edit Product"
              submitLabel="Save Changes"
              isEdit={true}
              categories={categories}
              existingImages={existingImages}
              pendingImages={pendingImages}
              uploadedImages={uploadedImages}
              setField={setField}
              setFeatures={setFeatures}
              setSpecs={setSpecs}
              resolveImageUrl={resolveImageUrl}
              handleImageUpload={handleImageUpload}
              removeExistingImage={removeExistingImage}
              replacePrimaryImage={replacePrimaryImage}
              onClose={handleModalClose}
            />
          </motion.div>
        )}
        {viewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setViewOpen(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {(() => {
                    const viewImg = resolveImageUrl(viewOpen.image || (viewOpen.gallery?.[0]) || (Array.isArray(viewOpen.images) && viewOpen.images.length ? (viewOpen.images[0] as any)?.image_url || (viewOpen.images[0] as any)?.image_path : null));
                    if (viewImg) {
                      return (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                          <img src={viewImg} alt={viewOpen.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    }
                    return (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shrink-0">
                        <Package className="w-8 h-8 text-amber-700" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-slate-900 text-xl truncate">{viewOpen.name}</h3>
                    <p className="text-sm text-slate-500 font-sub mt-0.5 truncate">{viewOpen.sku} · {getCatName(viewOpen.category_id)}</p>
                  </div>
                </div>
                <button onClick={() => setViewOpen(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`admin-badge border ${statusStyles[viewOpen.status ?? 'Pending'] ?? ''}`}>{viewOpen.status}</span>
                  {viewOpen.featured && <span className="admin-badge bg-amber-50 text-amber-700 border border-amber-100"><Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-1" /> Featured</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Price', value: viewOpen.discount_price ? `₹${viewOpen.discount_price.toLocaleString()}` : `₹${(viewOpen.price || 0).toLocaleString()}` },
                    { label: 'Original Price', value: `₹${(viewOpen.price || 0).toLocaleString()}` },
                    { label: 'Stock', value: `${viewOpen.stock_quantity || 0} units` },
                    { label: 'Rating', value: `${safeDecimal(viewOpen.rating).toFixed(1)} (${viewOpen.total_reviews || 0})` },
                    { label: 'Views', value: `${viewOpen.total_views || 0}` },
                    { label: 'Orders', value: `${viewOpen.total_orders || 0}` },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{viewOpen.description || 'No description provided.'}</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                <button onClick={() => { setViewOpen(null); setEditOpen(viewOpen); }} className="admin-btn admin-btn-secondary"><Edit className="w-4 h-4" /> Edit</button>
                {viewOpen.status === 'Pending' && <button onClick={async () => {
                  try {
                    await apiPost('/admin/products/update.php', { id: viewOpen.id, status: 'Published' });
                    await loadProducts();
                  } catch {
                    await loadProducts();
                  }
                  setViewOpen(null);
                }} className="admin-btn admin-btn-primary"><CheckCircle className="w-4 h-4" /> Approve & Publish</button>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
