import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingCart, Search, Filter, Plus, Eye, X, ChevronLeft,
  ChevronRight, Building, Package, DollarSign, Download,
  Truck, CheckCircle2, Clock, XCircle, PackageCheck,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { safeLakhDisplay } from '../lib/number';
import type { Order } from '../lib/types';

const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
const paymentStatuses = ['Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded'];

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-100',
  Processing: 'bg-blue-50 text-blue-800 border-blue-100',
  Shipped: 'bg-purple-50 text-purple-800 border-purple-100',
  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
  Refunded: 'bg-rose-50 text-rose-700 border-rose-100',
  Paid: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  'Partially Paid': 'bg-amber-50 text-amber-800 border-amber-100',
  Failed: 'bg-red-50 text-red-700 border-red-100',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [view, setView] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [newOrder, setNewOrder] = useState({
    buyer_id: '', product_id: '', quantity: 1, unit_price: 0, status: 'Pending', payment_status: 'Pending',
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiGet('/admin/orders/list.php', { status: statusFilter !== 'All' ? statusFilter : undefined });
        const list = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(list)) setOrders(list as Order[]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [statusFilter]);

  const filtered = orders.filter(o => {
    const matchesSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase())
      || o.buyer?.company_name?.toLowerCase()?.includes(search.toLowerCase())
      || o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const updateStatus = async (o: Order, status: string) => {
    try { await apiPost('/admin/orders/update_status.php', { id: o.id, status }); }
    catch {}
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status } : x));
    if (view?.id === o.id) setView(v => v ? { ...v, status } : null);
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        order_number: `ORD-${Date.now()}`,
        buyer_id: Number(newOrder.buyer_id) || undefined,
        seller_id: undefined,
        product_id: Number(newOrder.product_id) || undefined,
        quantity: Number(newOrder.quantity) || 1,
        unit_price: Number(newOrder.unit_price) || 0,
        total_price: (Number(newOrder.quantity) || 1) * (Number(newOrder.unit_price) || 0),
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        notes: '',
      };
      const res: any = await apiPost('/admin/orders/create.php', payload as any);
      const created = res?.data || { ...payload, id: `ORD${Date.now()}`, order_number: payload.order_number, total_amount: payload.total_price, created_at: new Date().toISOString() };
      setOrders(prev => [created as Order, ...prev]);
    } catch {
      setOrders(prev => [{ ...newOrder, id: `ORD${Date.now()}`, order_number: `OPC-ORD-${Date.now()}`, total_amount: newOrder.quantity * newOrder.unit_price, created_at: new Date().toISOString() } as Order, ...prev]);
    }
    setCreateOpen(false);
    setNewOrder({ buyer_id: '', product_id: '', quantity: 1, unit_price: 0, status: 'Pending', payment_status: 'Pending' });
  };

  const totalRevenue = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);

  const getStatusIcon = (s?: string) => {
    switch (s) {
      case 'Pending': return Clock;
      case 'Processing': return Package;
      case 'Shipped': return Truck;
      case 'Delivered': return PackageCheck;
      case 'Cancelled': return XCircle;
      default: return CheckCircle2;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Orders Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Track and manage all platform orders, payments and shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="admin-btn admin-btn-secondary"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => setCreateOpen(true)} className="admin-btn admin-btn-primary"><Plus className="w-4 h-4" /> New Order</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, sub: `Filtered ${filtered.length}`, color: 'bg-blue-50 text-blue-800', icon: ShoppingCart },
          { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, sub: 'awaiting processing', color: 'bg-amber-50 text-amber-800', icon: Clock },
          { label: 'In Transit', value: orders.filter(o => ['Processing', 'Shipped'].includes(o.status || '')).length, sub: 'active shipments', color: 'bg-purple-50 text-purple-800', icon: Truck },
          { label: 'Revenue', value: safeLakhDisplay(totalRevenue), sub: 'filtered total', color: 'bg-emerald-900 text-white', icon: DollarSign },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="admin-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-sub font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900">{card.value}</h3>
              <p className="text-xs text-slate-500 font-sub mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="admin-card p-5">
        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by order #, buyer..." className="admin-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input pl-10 pr-8 appearance-none min-w-[180px]">
              <option value="All">All Statuses</option>
              {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 font-sub">{loading ? 'Loading orders...' : 'No orders found.'}</td></tr>
              ) : paginated.map(o => {
                const StatusIcon = getStatusIcon(o.status);
                return (
                  <tr key={o.id}>
                    <td>
                      <div className="min-w-0">
                        <button onClick={() => setView(o)} className="font-semibold text-slate-900 hover:text-emerald-800 text-left block truncate">
                          {o.order_number}
                        </button>
                        <p className="text-xs text-slate-500 font-sub truncate">{o.created_at?.slice(0, 10)}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Building className="w-4 h-4 text-blue-800" /></div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{(o.buyer as any)?.company_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{(o.product as any)?.name || 'Product Package'}</div>
                      <p className="text-xs text-slate-400 font-sub">#{o.product_id}</p>
                    </td>
                    <td><span className="font-bold text-slate-800">{o.quantity}</span></td>
                    <td className="whitespace-nowrap">
                      <div className="font-bold text-emerald-800">₹{(o.total_amount || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500 font-sub">₹{(o.unit_price || 0).toLocaleString()}/unit</div>
                    </td>
                    <td>
                      <span className={`admin-badge border flex items-center gap-1.5 ${statusStyles[o.status ?? 'Pending'] ?? ''}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {o.status}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge border ${statusStyles[o.payment_status ?? 'Pending'] ?? ''}`}>{o.payment_status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={o.status || ''}
                          onChange={e => updateStatus(o, e.target.value)}
                          className="h-8 text-xs rounded-lg border border-slate-200 px-2 focus:ring-emerald-800 focus:border-emerald-800"
                        >
                          {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => setView(o)} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-blue-800" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">{view.order_number}</h3>
                    <p className="text-sm text-slate-500 font-sub mt-0.5">Placed {view.created_at?.slice(0, 10)}</p>
                  </div>
                </div>
                <button onClick={() => setView(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  <span className={`admin-badge border ${statusStyles[view.status ?? 'Pending'] ?? ''}`}>Order: {view.status}</span>
                  <span className={`admin-badge border ${statusStyles[view.payment_status ?? 'Pending'] ?? ''}`}>Payment: {view.payment_status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Buyer', value: (view.buyer as any)?.company_name || '—' },
                    { label: 'Seller ID', value: view.seller_id || '—' },
                    { label: 'Product', value: (view.product as any)?.name || `Product #${view.product_id}` },
                    { label: 'Quantity', value: `${view.quantity} units` },
                    { label: 'Unit Price', value: `₹${(view.unit_price || 0).toLocaleString()}` },
                    { label: 'Total Amount', value: `₹${(view.total_amount || 0).toLocaleString()}` },
                  ].map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>
                {view.shipping_address && (
                  <div>
                    <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Shipping Address</h4>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-sm text-slate-700">
                        {(view.shipping_address as any).address}<br />
                        {(view.shipping_address as any).city}, {(view.shipping_address as any).state} — {(view.shipping_address as any).pincode}
                      </p>
                    </div>
                  </div>
                )}
                {view.notes && (
                  <div>
                    <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Order Notes</h4>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-sm text-amber-900">{view.notes}</p>
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Update Order Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {orderStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(view, s)}
                        className={`admin-btn !py-1.5 !px-3 !text-xs ${view.status === s ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {createOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
              <form onSubmit={submitNew}>
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl">Create New Order</h3>
                    <p className="text-sm text-slate-500 mt-0.5 font-sub">Manual order entry for admins</p>
                  </div>
                  <button type="button" onClick={() => setCreateOpen(false)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="admin-label">Buyer ID</label>
                      <input required value={newOrder.buyer_id} onChange={e => setNewOrder(p => ({ ...p, buyer_id: e.target.value }))} className="admin-input" placeholder="B3001" />
                    </div>
                    <div>
                      <label className="admin-label">Product ID</label>
                      <input required value={newOrder.product_id} onChange={e => setNewOrder(p => ({ ...p, product_id: e.target.value }))} className="admin-input" placeholder="P4001" />
                    </div>
                    <div>
                      <label className="admin-label">Quantity</label>
                      <input required type="number" min={1} value={newOrder.quantity} onChange={e => setNewOrder(p => ({ ...p, quantity: Number(e.target.value) }))} className="admin-input" />
                    </div>
                    <div>
                      <label className="admin-label">Unit Price (₹)</label>
                      <input required type="number" min={0} value={newOrder.unit_price} onChange={e => setNewOrder(p => ({ ...p, unit_price: Number(e.target.value) }))} className="admin-input" />
                    </div>
                    <div>
                      <label className="admin-label">Order Status</label>
                      <select value={newOrder.status} onChange={e => setNewOrder(p => ({ ...p, status: e.target.value }))} className="admin-input">
                        {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="admin-label">Payment Status</label>
                      <select value={newOrder.payment_status} onChange={e => setNewOrder(p => ({ ...p, payment_status: e.target.value }))} className="admin-input">
                        {paymentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between">
                    <span className="text-sm font-semibold text-emerald-900">Total Amount</span>
                    <span className="text-lg font-bold text-emerald-900">₹{(newOrder.quantity * newOrder.unit_price).toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 rounded-b-[20px]">
                  <button type="button" onClick={() => setCreateOpen(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">Create Order</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
