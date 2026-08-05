import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, MoreVertical, CheckCircle, XCircle, Ban, Mail,
  Edit, Trash2, X, Building, Phone, MapPin, Globe, FileText, Send,
  ChevronLeft, ChevronRight, Download, UserPlus, Eye,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { downloadCsv } from '../lib/export';
import { safeDecimal } from '../lib/number';
import type { Seller } from '../lib/types';

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-100',
  Approved: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Rejected: 'bg-red-50 text-red-700 border-red-100',
  Suspended: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selected, setSelected] = useState<Seller | null>(null);
  const [detailsModal, setDetailsModal] = useState<Seller | null>(null);
  const [editModal, setEditModal] = useState<Seller | null>(null);
  const [emailModal, setEmailModal] = useState<Seller | null>(null);
  const [emailNote, setEmailNote] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [newSeller, setNewSeller] = useState({ company_name: '', contact_name: '', email: '', phone: '', country: 'India', state: '', city: '', pincode: '', gst: '', pan: '', password: '' });
  const [notice, setNotice] = useState<string | null>(null);
  const perPage = 5;

  const loadSellers = async () => {
    try {
      setLoading(true);
      const res: any = await apiGet('/sellers', { status: statusFilter !== 'All' ? statusFilter : undefined, search });
      const list = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(list)) setSellers(list as Seller[]);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSellers();
  }, [statusFilter, search]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filtered = sellers.filter(s => {
    const matchesSearch = !search || s.company_name.toLowerCase().includes(search.toLowerCase())
      || s.user?.email?.toLowerCase().includes(search.toLowerCase())
      || s.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = async (seller: Seller, status: string, remarks?: string) => {
    try {
      await apiPost('/admin/sellers/update.php', { id: seller.id, status, verification_remarks: remarks });
      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status } : s));
    } catch {
      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status } : s));
    }
    setMenuOpen(null);
  };

  const sendDetailsEmail = async () => {
    if (!emailModal) return;
    try {
      await apiPost('/admin/sellers/send_details_email.php', { seller_id: emailModal.id, note: emailNote });
    } catch {}
    setEmailModal(null);
    setEmailNote('');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      await apiPost('/admin/sellers/update.php', editModal as any);
      setSellers(prev => prev.map(s => s.id === editModal.id ? editModal : s));
    } catch {
      setSellers(prev => prev.map(s => s.id === editModal.id ? editModal : s));
    }
    setEditModal(null);
  };

  const createSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        company_name: newSeller.company_name,
        contact_name: newSeller.contact_name,
        email: newSeller.email,
        phone: newSeller.phone,
        address: `${newSeller.city}, ${newSeller.state}`,
        country: newSeller.country,
        state: newSeller.state,
        city: newSeller.city,
        pincode: newSeller.pincode,
        gst: newSeller.gst,
        pan: newSeller.pan,
        password: newSeller.password,
      };
      const res: any = await apiPost('/sellers', payload);
      if (!res?.success) {
        const msg = res?.message || 'Seller creation failed.';
        setNotice(msg);
        return;
      }

      setNotice('Seller created successfully.');
      await loadSellers();
      window.dispatchEvent(new CustomEvent('admin-data-updated'));
      setAddOpen(false);
      setNewSeller({ company_name: '', contact_name: '', email: '', phone: '', country: 'India', state: '', city: '', pincode: '', gst: '', pan: '', password: '' });
    } catch (err: any) {
      const msg = err?.message || 'Seller creation failed.';
      setNotice(msg);
    }
  };

  const exportSellers = () => {
    const headers = ['ID', 'Company', 'Contact', 'Email', 'Phone', 'Location', 'Status'];
    const rows = filtered.map(item => ({
      ID: item.id,
      Company: item.company_name,
      Contact: item.user?.name || '',
      Email: item.user?.email || '',
      Phone: item.phone || '',
      Location: `${item.city || ''}, ${item.state || ''}`.trim(),
      Status: item.status || '',
    }));
    downloadCsv('sellers.csv', headers, rows);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 right-5 z-50 max-w-md rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-card-lg text-sm text-slate-700"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Seller Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Review, approve, and manage seller registrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportSellers} className="admin-btn admin-btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setAddOpen(true)} className="admin-btn admin-btn-primary">
            <UserPlus className="w-4 h-4" /> Add Seller
          </button>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by company, name, email..."
              className="admin-input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="admin-input pl-10 pr-8 appearance-none min-w-[180px]"
              >
                {['All', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {['All', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(s => {
            const count = s === 'All' ? sellers.length : sellers.filter(x => x.status === s).length;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`tab-btn text-xs ${statusFilter === s ? 'active' : ''}`}
              >
                {s === 'All' ? 'All Sellers' : s} <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Products</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-sub">
                    {loading ? 'Loading sellers...' : 'No sellers found.'}
                  </td>
                </tr>
              ) : paginated.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shrink-0">
                        <Building className="w-5 h-5 text-emerald-800" />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => setDetailsModal(s)}
                          className="font-semibold text-slate-900 hover:text-emerald-800 text-left block truncate max-w-[180px]"
                        >
                          {s.company_name}
                        </button>
                        <p className="text-xs text-slate-500 font-sub truncate max-w-[180px]">
                          {s.user?.name} · #{s.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm truncate max-w-[200px]">{s.user?.email}</div>
                    <div className="text-xs text-slate-500 font-sub flex items-center gap-1">
                      <Phone className="w-3 h-3" />{s.phone}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[120px]">{s.city}, {s.state}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-800">{s.total_products ?? 0}</span>
                    <span className="text-xs text-slate-500 font-sub ml-1">items</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-800">{safeDecimal(s.rating).toFixed(1)}</span>
                      <span className="text-amber-500">★</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sub">{s.total_reviews ?? 0} reviews</p>
                  </td>
                  <td>
                    <span className={`admin-badge border ${statusStyles[s.status ?? 'Pending'] ?? ''}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        onClick={() => setDetailsModal(s)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {s.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(s, 'Approved')}
                            className="h-8 w-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-700 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(s, 'Rejected')}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setEmailModal(s)}
                        className="h-8 w-8 rounded-lg hover:bg-amber-50 flex items-center justify-center text-amber-700 transition-colors"
                        title="Request Details"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === s.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-card-lg border border-slate-100 py-1.5 z-20">
                            <button
                              onClick={() => { setEditModal(s); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Edit className="w-4 h-4" /> Edit Profile
                            </button>
                            <button
                              onClick={() => { setEmailModal(s); setMenuOpen(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Mail className="w-4 h-4" /> Request More Details
                            </button>
                            {s.status === 'Approved' ? (
                              <button
                                onClick={() => updateStatus(s, 'Suspended')}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                              >
                                <Ban className="w-4 h-4" /> Suspend
                              </button>
                            ) : s.status === 'Suspended' ? (
                              <button
                                onClick={() => updateStatus(s, 'Approved')}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle className="w-4 h-4" /> Reactivate
                              </button>
                            ) : null}
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => updateStatus(s, 'Deleted')}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Seller
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
            Showing <span className="font-semibold text-slate-700">{((page - 1) * perPage) + 1}</span>
            {' '}-{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * perPage, filtered.length)}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-700">{filtered.length}</span> sellers
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === p ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {detailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setDetailsModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="modal-content max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <Building className="w-7 h-7 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">{detailsModal.company_name}</h3>
                    <p className="text-sm text-slate-500 font-sub">Seller #{detailsModal.id} · {detailsModal.business_type}</p>
                  </div>
                </div>
                <button onClick={() => setDetailsModal(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`admin-badge border ${statusStyles[detailsModal.status ?? 'Pending'] ?? ''}`}>
                    {detailsModal.status}
                  </span>
                  {detailsModal.verification_status === 'Verified' ? (
                    <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="admin-badge bg-amber-50 text-amber-800 border border-amber-100">
                      <FileText className="w-3 h-3 mr-1" /> {detailsModal.verification_status}
                    </span>
                  )}
                  {detailsModal.established_year && (
                    <span className="admin-badge bg-slate-50 text-slate-700 border border-slate-100">
                      Est. {detailsModal.established_year}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Owner Name', value: detailsModal.user?.name, icon: Building },
                    { label: 'Email', value: detailsModal.user?.email, icon: Mail },
                    { label: 'Phone', value: detailsModal.phone, icon: Phone },
                    { label: 'Website', value: detailsModal.website, icon: Globe },
                    { label: 'GST Number', value: detailsModal.gst_number },
                    { label: 'PAN Number', value: detailsModal.pan_number },
                    { label: 'Location', value: `${detailsModal.city}, ${detailsModal.state}` },
                    { label: 'Team Size', value: detailsModal.total_employees },
                    { label: 'Annual Turnover', value: detailsModal.annual_turnover },
                    { label: 'Products Listed', value: `${detailsModal.total_products ?? 0} items` },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                <button onClick={() => { setDetailsModal(null); setEditModal(detailsModal); }} className="admin-btn admin-btn-secondary">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                {detailsModal.status === 'Pending' && (
                  <button onClick={() => { updateStatus(detailsModal, 'Approved'); setDetailsModal(null); }} className="admin-btn admin-btn-primary">
                    <CheckCircle className="w-4 h-4" /> Approve Seller
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={saveEdit}>
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">Edit Seller Profile</h3>
                    <p className="text-sm text-slate-500 mt-1 font-sub">Update seller #{editModal.id} details</p>
                  </div>
                  <button type="button" onClick={() => setEditModal(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                  {[
                    { label: 'Company Name', key: 'company_name' },
                    { label: 'Business Type', key: 'business_type' },
                    { label: 'GST Number', key: 'gst_number' },
                    { label: 'PAN Number', key: 'pan_number' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Website', key: 'website' },
                    { label: 'City', key: 'city' },
                    { label: 'State', key: 'state' },
                    { label: 'Country', key: 'country' },
                    { label: 'Team Size', key: 'total_employees' },
                    { label: 'Annual Turnover', key: 'annual_turnover' },
                    { label: 'Status', key: 'status', type: 'select' as const, options: ['Pending', 'Approved', 'Rejected', 'Suspended'] },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="admin-label">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={(editModal as any)[field.key] ?? ''}
                          onChange={e => setEditModal({ ...editModal, [field.key]: e.target.value } as Seller)}
                          className="admin-input"
                        >
                          {field.options!.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          value={(editModal as any)[field.key] ?? ''}
                          onChange={e => setEditModal({ ...editModal, [field.key]: e.target.value } as Seller)}
                          className="admin-input"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                  <button type="button" onClick={() => setEditModal(null)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={createSeller}>
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">Add New Seller</h3>
                    <p className="text-sm text-slate-500 mt-1 font-sub">Create a seller account and submit it for approval.</p>
                  </div>
                  <button type="button" onClick={() => setAddOpen(false)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
                  {[
                    { label: 'Company Name', key: 'company_name' },
                    { label: 'Contact Person', key: 'contact_name' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Country', key: 'country' },
                    { label: 'State', key: 'state' },
                    { label: 'City', key: 'city' },
                    { label: 'PIN Code', key: 'pincode' },
                    { label: 'GST Number', key: 'gst' },
                    { label: 'PAN Number', key: 'pan' },
                    { label: 'Password', key: 'password', type: 'password' },
                  ].map(field => (
                    <div key={field.key} className={field.key === 'company_name' || field.key === 'contact_name' || field.key === 'email' || field.key === 'phone' ? 'sm:col-span-1' : 'sm:col-span-1'}>
                      <label className="admin-label">{field.label}</label>
                      <input
                        required={field.key !== 'gst' && field.key !== 'pan' && field.key !== 'password' ? true : false}
                        type={field.type || 'text'}
                        value={(newSeller as any)[field.key]}
                        onChange={e => setNewSeller({ ...newSeller, [field.key]: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                  <button type="button" onClick={() => setAddOpen(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">Create Seller</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {emailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setEmailModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Send className="w-6 h-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-lg">Request More Details</h3>
                    <p className="text-sm text-slate-500 mt-0.5 font-sub">Send email to {emailModal.company_name}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setEmailModal(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="admin-label">Recipient</label>
                  <input value={emailModal.user?.email || ''} readOnly className="admin-input bg-slate-50 text-slate-600" />
                </div>
                <div>
                  <label className="admin-label">Additional Notes</label>
                  <textarea
                    rows={4}
                    value={emailNote}
                    onChange={e => setEmailNote(e.target.value)}
                    className="admin-input resize-none"
                    placeholder="Request specific documents, GST certificate, business proofs, etc."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                <button onClick={() => setEmailModal(null)} className="admin-btn admin-btn-secondary">Cancel</button>
                <button onClick={sendDetailsEmail} className="admin-btn admin-btn-primary">
                  <Send className="w-4 h-4" /> Send Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
