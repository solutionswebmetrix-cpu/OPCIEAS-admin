import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Filter, MoreVertical, CheckCircle, Ban, Trash2,
  X, Users, Phone, MapPin, Building, ShoppingCart, Download,
  ChevronLeft, ChevronRight, UserPlus, Eye,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { downloadCsv } from '../lib/export';
import { safeLakhDisplay } from '../lib/number';
import type { Buyer } from '../lib/types';

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-100',
  Approved: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Suspended: 'bg-slate-100 text-slate-700 border-slate-200',
  Deleted: 'bg-red-50 text-red-700 border-red-100',
};

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewBuyer, setViewBuyer] = useState<Buyer | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: '', email: '', phone: '', company: '', country: 'India', state: '', city: '', pincode: '', password: '' });
  const [notice, setNotice] = useState<string | null>(null);
  const perPage = 6;

  const loadBuyers = async () => {
    try {
      setLoading(true);
      const res: any = await apiGet('/buyers', { status: statusFilter !== 'All' ? statusFilter : undefined, search });
      const list = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(list)) setBuyers(list as Buyer[]);
    } catch {
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBuyers();
  }, [statusFilter, search]);

  const filtered = buyers.filter(b => {
    const matchesSearch = !search || b.company_name?.toLowerCase().includes(search.toLowerCase())
      || b.user?.email?.toLowerCase().includes(search.toLowerCase())
      || b.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = async (buyer: Buyer, status: string) => {
    try {
      await apiPost('/admin/buyers/update_status.php', { id: buyer.id, status });
      setBuyers(prev => prev.map(b => b.id === buyer.id ? { ...b, status } : b));
    } catch {
      setBuyers(prev => prev.map(b => b.id === buyer.id ? { ...b, status } : b));
    }
    setMenuOpen(null);
  };

  const deleteBuyer = async (buyer: Buyer) => {
    try {
      await apiPost('/admin/buyers/delete.php', { id: buyer.id });
      setBuyers(prev => prev.filter(b => b.id !== buyer.id));
    } catch {
      setBuyers(prev => prev.filter(b => b.id !== buyer.id));
    }
  };

  const createBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await apiPost('/buyers', {
        name: newBuyer.name,
        email: newBuyer.email,
        phone: newBuyer.phone,
        company: newBuyer.company,
        country: newBuyer.country,
        state: newBuyer.state,
        city: newBuyer.city,
        pincode: newBuyer.pincode,
        password: newBuyer.password,
      });
      if (res?.success) {
        setNotice('Buyer created successfully.');
        await loadBuyers();
        window.dispatchEvent(new CustomEvent('admin-data-updated'));
      }
    } catch (err: any) {
      setNotice(err?.message || 'Buyer creation failed.');
      return;
    }
    setAddOpen(false);
    setNewBuyer({ name: '', email: '', phone: '', company: '', country: 'India', state: '', city: '', pincode: '', password: '' });
  };

  const exportBuyers = () => {
    const headers = ['ID', 'Company', 'Contact', 'Email', 'Phone', 'Location', 'Status', 'Total Spent'];
    const rows = filtered.map(item => ({
      ID: item.id,
      Company: item.company_name || 'Individual Buyer',
      Contact: item.user?.name || '',
      Email: item.user?.email || '',
      Phone: item.phone || '',
      Location: `${item.city || ''}, ${item.state || ''}`.trim(),
      Status: item.status || '',
      'Total Spent': `₹${(item.total_spent || 0).toLocaleString()}`,
    }));
    downloadCsv('buyers.csv', headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Buyer Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Manage registered buyers, approvals, and accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportBuyers} className="admin-btn admin-btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setAddOpen(true)} className="admin-btn admin-btn-primary">
            <UserPlus className="w-4 h-4" /> Add Buyer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Buyers', value: buyers.length, color: 'bg-blue-50 text-blue-800', icon: Users },
          { label: 'Approved', value: buyers.filter(b => b.status === 'Approved').length, color: 'bg-emerald-50 text-emerald-800', icon: CheckCircle },
          { label: 'Pending', value: buyers.filter(b => b.status === 'Pending').length, color: 'bg-amber-50 text-amber-800', icon: Filter },
          { label: 'Total Revenue', value: safeLakhDisplay(buyers.reduce((s, b) => s + (b.total_spent || 0), 0)), color: 'bg-purple-50 text-purple-800', icon: ShoppingCart },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="admin-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-sub font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
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
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search buyer company, contact, email..."
              className="admin-input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="admin-input pl-10 pr-8 appearance-none min-w-[180px]"
            >
              {['All', 'Pending', 'Approved', 'Suspended'].map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[850px]">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-sub">
                    {loading ? 'Loading buyers...' : 'No buyers found.'}
                  </td>
                </tr>
              ) : paginated.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0">
                        <Building className="w-5 h-5 text-blue-800" />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => setViewBuyer(b)}
                          className="font-semibold text-slate-900 hover:text-blue-800 text-left block truncate max-w-[180px]"
                        >
                          {b.company_name || 'Individual Buyer'}
                        </button>
                        <p className="text-xs text-slate-500 font-sub truncate max-w-[180px]">
                          {b.user?.name} · #{b.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm truncate max-w-[200px]">{b.user?.email}</div>
                    <div className="text-xs text-slate-500 font-sub flex items-center gap-1">
                      <Phone className="w-3 h-3" />{b.phone}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[120px]">{b.city}, {b.state}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-800">{b.total_orders ?? 0}</span>
                    <span className="text-xs text-slate-500 font-sub ml-1">orders</span>
                  </td>
                  <td className="font-bold text-emerald-800 whitespace-nowrap">
                    ₹{((b.total_spent ?? 0) / 1000).toLocaleString()}K
                  </td>
                  <td>
                    <span className={`admin-badge border ${statusStyles[b.status ?? 'Approved'] ?? ''}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button
                        onClick={() => setViewBuyer(b)}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {b.status === 'Approved' ? (
                        <button
                          onClick={() => updateStatus(b, 'Suspended')}
                          className="h-8 w-8 rounded-lg hover:bg-orange-50 flex items-center justify-center text-orange-700"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(b, 'Approved')}
                          className="h-8 w-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-700"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === b.id ? null : b.id)}
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === b.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-card-lg border border-slate-100 py-1.5 z-20">
                            <button
                              onClick={() => { updateStatus(b, 'Approved'); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => { updateStatus(b, 'Suspended'); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                            >
                              <Ban className="w-4 h-4" /> Suspend
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => deleteBuyer(b)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Account
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
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} buyers
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                  page === p ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setAddOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <form onSubmit={createBuyer}>
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">Add New Buyer</h3>
                    <p className="text-sm text-slate-500 mt-1 font-sub">Create a buyer account and allow immediate access.</p>
                  </div>
                  <button type="button" onClick={() => setAddOpen(false)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
                  {[
                    { label: 'Full Name', key: 'name' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Company', key: 'company' },
                    { label: 'Country', key: 'country' },
                    { label: 'State', key: 'state' },
                    { label: 'City', key: 'city' },
                    { label: 'PIN Code', key: 'pincode' },
                    { label: 'Password', key: 'password', type: 'password' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="admin-label">{field.label}</label>
                      <input required={field.key !== 'company'} type={field.type || 'text'} value={(newBuyer as any)[field.key]} onChange={e => setNewBuyer({ ...newBuyer, [field.key]: e.target.value })} className="admin-input" />
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                  <button type="button" onClick={() => setAddOpen(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">Create Buyer</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {viewBuyer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setViewBuyer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <Building className="w-7 h-7 text-blue-800" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">{viewBuyer.company_name || 'Individual Buyer'}</h3>
                    <p className="text-sm text-slate-500 font-sub">Buyer #{viewBuyer.id} · {viewBuyer.business_type || 'Buyer'}</p>
                  </div>
                </div>
                <button onClick={() => setViewBuyer(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`admin-badge border ${statusStyles[viewBuyer.status ?? 'Approved'] ?? ''}`}>{viewBuyer.status}</span>
                  <span className="admin-badge bg-blue-50 text-blue-800 border border-blue-100">
                    {viewBuyer.total_orders ?? 0} orders
                  </span>
                  <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100">
                    {safeLakhDisplay(viewBuyer.total_spent)} spent
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Contact Person', value: viewBuyer.user?.name },
                    { label: 'Email', value: viewBuyer.user?.email },
                    { label: 'Phone', value: viewBuyer.phone },
                    { label: 'Website', value: viewBuyer.website },
                    { label: 'GST Number', value: viewBuyer.gst_number },
                    { label: 'Location', value: `${viewBuyer.city}, ${viewBuyer.state}` },
                    { label: 'Total Orders', value: String(viewBuyer.total_orders ?? 0) },
                    { label: 'Lifetime Value', value: `₹${(viewBuyer.total_spent ?? 0).toLocaleString()}` },
                    { label: 'Registered On', value: viewBuyer.created_at?.slice(0, 10) },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                {viewBuyer.status === 'Approved' ? (
                  <button onClick={() => { updateStatus(viewBuyer, 'Suspended'); setViewBuyer(null); }} className="admin-btn admin-btn-secondary">
                    <Ban className="w-4 h-4" /> Suspend
                  </button>
                ) : (
                  <button onClick={() => { updateStatus(viewBuyer, 'Approved'); setViewBuyer(null); }} className="admin-btn admin-btn-primary">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
