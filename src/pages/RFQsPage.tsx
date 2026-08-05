import { useEffect, useState } from 'react';

const refreshRfqsEvent = 'rfq-status-updated';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText, Search, Filter, Eye, X, CheckCircle, ChevronLeft, ChevronRight,
  Building, Mail, Phone, MapPin, Package, DollarSign, Calendar,
  Clock, Ban, MessageSquare, Download, UserCircle,
} from 'lucide-react';
import { apiFormData, apiGet, apiPost } from '../lib/api';
import { safeLakhDisplay } from '../lib/number';
import type { RFQ } from '../lib/types';

const statusStyles: Record<string, string> = {
  New: 'bg-blue-50 text-blue-800 border-blue-100',
  'In Review': 'bg-amber-50 text-amber-800 border-amber-100',
  Quoted: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
  Rejected: 'bg-red-50 text-red-700 border-red-100',
};

export default function RFQsPage() {
  const [items, setItems] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [view, setView] = useState<RFQ | null>(null);
  const [actionMode, setActionMode] = useState<'quote' | 'reject' | null>(null);
  const [quoteForm, setQuoteForm] = useState({ quote_number: '', price: '', gst_amount: '', currency: 'INR', delivery_time: '', payment_terms: '', validity: '', remarks: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;

  const loadRfqs = async () => {
    try {
      setLoading(true);
      const res: any = await apiGet('/rfqs/submit.php');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
      if (Array.isArray(list)) setItems(list as RFQ[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRfqs();
    const onRefresh = () => { void loadRfqs(); };
    window.addEventListener(refreshRfqsEvent, onRefresh);
    return () => window.removeEventListener(refreshRfqsEvent, onRefresh);
  }, []);

  const updateStatus = async (r: RFQ, status: string, extra: Record<string, string | number | undefined> = {}) => {
    if (status === 'Rejected' && !String(extra.reason ?? '').trim()) {
      setFeedback({ type: 'error', message: 'Please enter a rejection reason before confirming.' });
      return;
    }
    if (status === 'Quoted' && (!String(extra.quote_number ?? '').trim() || !String(extra.price ?? '').trim())) {
      setFeedback({ type: 'error', message: 'Quote number and amount are required before saving.' });
      return;
    }

    try {
      setWorking(true);
      setFeedback(null);

      let res: any;
      if (status === 'Quoted') {
        const formData = new FormData();
        formData.append('id', String(r.id));
        formData.append('status', status);
        formData.append('quote_number', String(extra.quote_number ?? ''));
        formData.append('price', String(extra.price ?? ''));
        formData.append('gst_amount', String(extra.gst_amount ?? ''));
        formData.append('currency', String(extra.currency ?? 'INR'));
        formData.append('delivery_time', String(extra.delivery_time ?? ''));
        formData.append('payment_terms', String(extra.payment_terms ?? ''));
        formData.append('validity', String(extra.validity ?? ''));
        formData.append('remarks', String(extra.remarks ?? ''));
        if (quoteFile) {
          formData.append('attachment', quoteFile);
        }
        res = await apiFormData('/admin/rfqs/update_status.php', formData);
      } else {
        res = await apiPost('/admin/rfqs/update_status.php', { id: r.id, status, ...extra });
      }

      const updated: RFQ = { ...r, status, is_read: true };
      setItems(prev => prev.map(x => x.id === r.id ? updated : x));
      if (view?.id === r.id) setView(updated);
      setFeedback({ type: 'success', message: res?.message || 'RFQ updated successfully.' });
      window.dispatchEvent(new CustomEvent(refreshRfqsEvent));
      setActionMode(null);
      setQuoteForm({ quote_number: '', price: '', gst_amount: '', currency: 'INR', delivery_time: '', payment_terms: '', validity: '', remarks: '' });
      setQuoteFile(null);
      setRejectReason('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'The request failed.' });
    } finally {
      setWorking(false);
    }
  };

  const filtered = items.filter(r => {
    const matchesSearch = !search || r.company_name?.toLowerCase().includes(search.toLowerCase())
      || r.product_name?.toLowerCase().includes(search.toLowerCase())
      || r.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const fmt = (n?: number | null) => safeLakhDisplay(n ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">RFQs & Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Review incoming Request for Quotation submissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="admin-btn admin-btn-secondary"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total RFQs', value: items.length, color: 'bg-blue-50 text-blue-800', icon: FileText },
          { label: 'New Unread', value: items.filter(r => !r.is_read).length, color: 'bg-rose-50 text-rose-700', icon: Mail },
          { label: 'In Process', value: items.filter(r => ['New', 'In Review'].includes(r.status || '')).length, color: 'bg-amber-50 text-amber-800', icon: Clock },
          { label: 'Avg. Budget', value: fmt(items.reduce((s, r) => s + (((r.budget_range_max || 0) + (r.budget_range_min || 0)) / 2), 0) / (items.length || 1)), color: 'bg-emerald-900 text-white', icon: DollarSign },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="admin-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-sub font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search RFQ by company, product, contact..." className="admin-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input pl-10 pr-8 appearance-none min-w-[180px]">
              {['All', 'New', 'In Review', 'Quoted', 'Closed', 'Rejected'].map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-500 font-sub">Loading RFQs...</div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-sub">No RFQs found.</div>
          ) : paginated.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${r.is_read ? 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30' : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70'}`}
              onClick={() => setView(r)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0 flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${r.is_read ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                    {r.is_read ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-heading font-bold text-slate-900 truncate">{r.company_name}</h4>
                      {!r.is_read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      <span className={`admin-badge border !py-0 !px-2 text-[10px] ${statusStyles[r.status ?? 'New'] ?? ''}`}>{r.status}</span>
                      <span className="text-xs text-slate-400 font-sub">#{r.id}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium line-clamp-1">{r.product_name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-sub">
                      <span className="flex items-center gap-1"><UserCircle className="w-3.5 h-3.5" />{r.contact_name}</span>
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{r.quantity?.toLocaleString()} units</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{fmt(r.budget_range_min)} – {fmt(r.budget_range_max)}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{r.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex lg:flex-col items-center lg:items-end gap-2">
                  <button onClick={e => { e.stopPropagation(); setView(r); }} className="admin-btn !py-2 !px-3 !text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  {r.status === 'New' && (
                    <button onClick={e => { e.stopPropagation(); void updateStatus(r, 'In Review'); }} className="admin-btn !py-2 !px-3 !text-xs admin-btn-secondary">
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Reviewing
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 font-sub">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} RFQs</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === p ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {view && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setView(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-blue-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`admin-badge border ${statusStyles[view.status ?? 'New'] ?? ''}`}>{view.status}</span>
                      <span className="text-xs text-slate-400 font-sub">#{view.id} · Received {view.created_at?.slice(0, 10)}</span>
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl leading-tight">{view.company_name}</h3>
                    <p className="text-sm text-slate-500 font-sub mt-0.5">RFQ · {view.product_name}</p>
                  </div>
                </div>
                <button onClick={() => setView(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Contact Person', value: view.contact_name, icon: UserCircle },
                    { label: 'Email', value: view.email, icon: Mail },
                    { label: 'Phone', value: view.phone, icon: Phone },
                    { label: 'Category', value: view.category, icon: Package },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800 break-words">{f.value || '—'}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Quantity Required', value: `${view.quantity?.toLocaleString() || 0} units` },
                    { label: 'Budget Range', value: `${fmt(view.budget_range_min)} – ${fmt(view.budget_range_max)}` },
                    { label: 'Required By', value: view.required_date?.slice(0, 10) || '—' },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-[11px] text-amber-700 font-sub uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-bold text-amber-900 mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Full Inquiry Details</h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{view.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[20px] space-y-3">
                {feedback ? (
                  <div className={`rounded-xl border px-3 py-2 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {feedback.message}
                  </div>
                ) : null}
                {actionMode === 'quote' ? (
                  <div className="rounded-xl border border-amber-100 bg-white p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input value={quoteForm.quote_number} onChange={e => setQuoteForm({ ...quoteForm, quote_number: e.target.value })} className="admin-input" placeholder="Quote number" />
                      <input type="number" value={quoteForm.price} onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })} className="admin-input" placeholder="Price" />
                      <input type="number" value={quoteForm.gst_amount} onChange={e => setQuoteForm({ ...quoteForm, gst_amount: e.target.value })} className="admin-input" placeholder="GST" />
                      <input value={quoteForm.currency} onChange={e => setQuoteForm({ ...quoteForm, currency: e.target.value })} className="admin-input" placeholder="Currency" />
                      <input value={quoteForm.delivery_time} onChange={e => setQuoteForm({ ...quoteForm, delivery_time: e.target.value })} className="admin-input" placeholder="Delivery time" />
                      <input value={quoteForm.payment_terms} onChange={e => setQuoteForm({ ...quoteForm, payment_terms: e.target.value })} className="admin-input" placeholder="Payment terms" />
                      <input value={quoteForm.validity} onChange={e => setQuoteForm({ ...quoteForm, validity: e.target.value })} className="admin-input" placeholder="Validity" />
                      <label className="flex flex-col gap-1 text-sm text-slate-600">
                        Attachment (PDF)
                        <input type="file" accept=".pdf" onChange={e => setQuoteFile(e.target.files?.[0] || null)} className="admin-input !p-2" />
                      </label>
                      <textarea value={quoteForm.remarks} onChange={e => setQuoteForm({ ...quoteForm, remarks: e.target.value })} className="admin-input md:col-span-2" rows={3} placeholder="Quote remarks" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setActionMode(null)} className="admin-btn admin-btn-secondary !py-2 !px-3 !text-xs">Cancel</button>
                      <button disabled={working} onClick={() => void updateStatus(view, 'Quoted', { quote_number: quoteForm.quote_number, price: quoteForm.price, gst_amount: quoteForm.gst_amount, currency: quoteForm.currency, delivery_time: quoteForm.delivery_time, payment_terms: quoteForm.payment_terms, validity: quoteForm.validity, remarks: quoteForm.remarks })} className="admin-btn admin-btn-gold !py-2 !px-3 !text-xs disabled:opacity-60">{working ? 'Saving...' : 'Save Quote'}</button>
                    </div>
                  </div>
                ) : actionMode === 'reject' ? (
                  <div className="rounded-xl border border-red-100 bg-white p-4 space-y-3">
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="admin-input" rows={3} placeholder="Rejection reason" />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setActionMode(null)} className="admin-btn admin-btn-secondary !py-2 !px-3 !text-xs">Cancel</button>
                      <button disabled={working} onClick={() => void updateStatus(view, 'Rejected', { reason: rejectReason })} className="admin-btn admin-btn-danger !py-2 !px-3 !text-xs disabled:opacity-60">{working ? 'Submitting...' : 'Confirm Reject'}</button>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button disabled={working} onClick={() => void updateStatus(view, 'New')} className={`admin-btn !py-2 !px-3 !text-xs ${view.status === 'New' ? 'admin-btn-primary' : 'admin-btn-secondary'} disabled:opacity-60`}>New</button>
                    <button disabled={working} onClick={() => void updateStatus(view, 'In Review')} className={`admin-btn !py-2 !px-3 !text-xs ${view.status === 'In Review' ? 'admin-btn-primary' : 'admin-btn-secondary'} disabled:opacity-60`}>In Review</button>
                    <button disabled={working} onClick={() => setActionMode('quote')} className={`admin-btn !py-2 !px-3 !text-xs ${view.status === 'Quoted' ? 'admin-btn-gold' : 'admin-btn-secondary'} disabled:opacity-60`}>Send Quote</button>
                    <button disabled={working} onClick={() => { if (window.confirm('Close this RFQ?')) { void updateStatus(view, 'Closed'); } }} className={`admin-btn !py-2 !px-3 !text-xs ${view.status === 'Closed' ? 'admin-btn-primary' : 'admin-btn-secondary'} disabled:opacity-60`}>Close</button>
                    <button disabled={working} onClick={() => setActionMode('reject')} className={`admin-btn !py-2 !px-3 !text-xs ${view.status === 'Rejected' ? 'admin-btn-danger' : 'admin-btn-secondary'} disabled:opacity-60`}>
                      <Ban className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
