import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardList, Search, Filter, Eye, X, CheckCircle, XCircle,
  Trash2, AlertCircle, Flag, Lock, ChevronLeft, ChevronRight,
  DollarSign, Calendar, MapPin, Building, Tag,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { safeLakhDisplay } from '../lib/number';
import type { PurchaseRequirement } from '../lib/types';

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-100',
  Approved: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Rejected: 'bg-red-50 text-red-700 border-red-100',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
  Fake: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function RequirementsPage() {
  const [items, setItems] = useState<PurchaseRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [view, setView] = useState<PurchaseRequirement | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiGet('/admin/purchase_requirements/list.php', { status: statusFilter !== 'All' ? statusFilter : undefined });
        const list = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(list)) setItems(list as PurchaseRequirement[]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [statusFilter]);

  const filtered = items.filter(r => {
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
      || (r.buyer as any)?.company_name?.toLowerCase()?.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = async (r: PurchaseRequirement, status: string) => {
    try {
      await apiPost('/admin/purchase_requirements/update_status.php', { id: r.id, status });
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    } catch {
      setItems(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    }
    setView(null);
  };

  const remove = async (r: PurchaseRequirement) => {
    if (!confirm(`Delete requirement "${r.title}"?`)) return;
    try { await apiPost('/admin/purchase_requirements/update_status.php', { id: r.id, status: 'Deleted' }); }
    catch {}
    setItems(prev => prev.filter(x => x.id !== r.id));
    setView(null);
  };

  const fmtINR = (n: number) => safeLakhDisplay(n);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Purchase Requirements</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Review buyer requirements and manage listing status.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Pending', 'Approved', 'Closed', 'Fake'].map(s => {
            const count = s === 'All' ? items.length : items.filter(x => x.status === s).length;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`tab-btn text-xs ${statusFilter === s ? 'active' : ''}`}>
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requirements', value: items.length, color: 'bg-blue-50 text-blue-800', icon: ClipboardList },
          { label: 'Pending Review', value: items.filter(r => r.status === 'Pending').length, color: 'bg-amber-50 text-amber-800', icon: AlertCircle },
          { label: 'Approved Live', value: items.filter(r => r.status === 'Approved').length, color: 'bg-emerald-50 text-emerald-800', icon: CheckCircle },
          { label: 'Avg. Budget', value: fmtINR(items.reduce((s, r) => s + ((r.budget_max || 0) + (r.budget_min || 0)) / 2, 0) / (items.length || 1)), color: 'bg-emerald-900 text-white', icon: DollarSign },
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
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search requirements by title, buyer..." className="admin-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input pl-10 pr-8 appearance-none min-w-[180px]">
              {['All', 'Pending', 'Approved', 'Rejected', 'Closed', 'Fake'].map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[950px]">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Buyer</th>
                <th>Quantity</th>
                <th>Budget Range</th>
                <th>Quotes</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-sub">{loading ? 'Loading...' : 'No requirements found.'}</td>
                </tr>
              ) : paginated.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="min-w-0 max-w-[280px]">
                      <button onClick={() => setView(r)} className="font-semibold text-slate-900 hover:text-emerald-800 text-left block truncate">
                        {r.title}
                      </button>
                      <p className="text-xs text-slate-500 font-sub mt-0.5 truncate">
                        #{r.id} · Posted {r.created_at?.slice(0, 10)}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Building className="w-4 h-4 text-blue-800" /></div>
                      <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{(r.buyer as any)?.company_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800">{r.required_quantity.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-sub">{r.unit || 'units'}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-bold text-emerald-800">{fmtINR(r.budget_min || 0)} – {fmtINR(r.budget_max || 0)}</div>
                    <div className="text-xs text-slate-500 font-sub flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{r.preferred_location}
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-slate-800">{r.total_quotes_received}</span>
                    <span className="text-xs text-slate-500 font-sub ml-1">quotes</span>
                  </td>
                  <td>
                    <span className={`admin-badge border ${statusStyles[r.status ?? 'Pending'] ?? ''}`}>{r.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setView(r)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {r.status === 'Pending' && (
                        <>
                          <button onClick={() => updateStatus(r, 'Approved')} className="h-8 w-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-700" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateStatus(r, 'Rejected')} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {r.status !== 'Fake' && (
                        <button onClick={() => updateStatus(r, 'Fake')} className="h-8 w-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-700" title="Mark Fake">
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                      {r.status !== 'Closed' && (
                        <button onClick={() => updateStatus(r, 'Closed')} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600" title="Close">
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => remove(r)} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 font-sub">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</p>
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-7 h-7 text-blue-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`admin-badge border ${statusStyles[view.status ?? 'Pending'] ?? ''}`}>{view.status}</span>
                      <span className="text-xs text-slate-400 font-sub">#{view.id}</span>
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl leading-tight">{view.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-sub">
                      Posted by {(view.buyer as any)?.company_name || 'Unknown'} · {view.created_at?.slice(0, 10)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setView(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Quantity', value: `${view.required_quantity.toLocaleString()} ${view.unit || ''}`, icon: Tag },
                    { label: 'Budget', value: `${fmtINR(view.budget_min || 0)} – ${fmtINR(view.budget_max || 0)}`, icon: DollarSign },
                    { label: 'Required By', value: view.required_by_date?.slice(0, 10) || '—', icon: Calendar },
                    { label: 'Location', value: view.preferred_location || 'Any', icon: MapPin },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{f.value}</p>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Full Description</h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{view.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[11px] text-amber-700 font-sub uppercase tracking-wider">Quotes Received</p>
                    <p className="text-2xl font-heading font-bold text-amber-900 mt-1">{view.total_quotes_received || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[11px] text-emerald-700 font-sub uppercase tracking-wider">Buyer Company</p>
                    <p className="text-sm font-bold text-emerald-900 mt-1">{(view.buyer as any)?.company_name || '—'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-600 font-sub uppercase tracking-wider">Visibility</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{view.visibility || 'Public'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-b-[20px]">
                <div className="flex gap-2 flex-wrap">
                  {view.status !== 'Approved' && <button onClick={() => updateStatus(view, 'Approved')} className="admin-btn admin-btn-primary"><CheckCircle className="w-4 h-4" /> Approve</button>}
                  {view.status !== 'Rejected' && <button onClick={() => updateStatus(view, 'Rejected')} className="admin-btn admin-btn-danger"><XCircle className="w-4 h-4" /> Reject</button>}
                  {view.status !== 'Fake' && <button onClick={() => updateStatus(view, 'Fake')} className="admin-btn !bg-rose-50 !text-rose-700 !border !border-rose-200 hover:!bg-rose-100"><Flag className="w-4 h-4" /> Mark Fake</button>}
                  {view.status !== 'Closed' && <button onClick={() => updateStatus(view, 'Closed')} className="admin-btn admin-btn-secondary"><Lock className="w-4 h-4" /> Close</button>}
                </div>
                <button onClick={() => remove(view)} className="admin-btn admin-btn-danger"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
