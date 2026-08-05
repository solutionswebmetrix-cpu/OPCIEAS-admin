import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Mail, Search, Filter, Eye, X, CheckCircle, ChevronLeft, ChevronRight,
  UserCircle, Phone, Building, Calendar, Clock, CheckCheck, AlertCircle,
  Download, Reply, Send, ArrowLeftRight, Ban,
} from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';
import { downloadCsv } from '../lib/export';
import type { ContactSubmission } from '../lib/types';

const priorityStyle: Record<string, string> = {
  Urgent: 'bg-red-50 text-red-700 border-red-100',
  High: 'bg-amber-50 text-amber-800 border-amber-100',
  Medium: 'bg-blue-50 text-blue-800 border-blue-100',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const typeStyle: Record<string, string> = {
  Sales: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  Tender: 'bg-amber-50 text-amber-800 border-amber-100',
  Export: 'bg-purple-50 text-purple-800 border-purple-100',
  Support: 'bg-rose-50 text-rose-700 border-rose-100',
  Custom: 'bg-blue-50 text-blue-800 border-blue-100',
  Corporate: 'bg-teal-50 text-teal-800 border-teal-100',
  General: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ContactsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [view, setView] = useState<ContactSubmission | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiGet('/contacts/submit.php');
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
        if (Array.isArray(list)) setItems(list as ContactSubmission[]);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markRead = async (c: ContactSubmission) => {
    try {
      await apiPost('/admin/contacts/update_status.php', { id: c.id, status: 'read' });
      setItems(prev => prev.map(x => x.id === c.id ? { ...x, is_read: true } : x));
      if (view?.id === c.id) setView({ ...c, is_read: true });
    } catch {
      // Keep UI state unchanged if the request fails.
    }
  };
  const markResolved = async (c: ContactSubmission) => {
    try {
      await apiPost('/admin/contacts/update_status.php', { id: c.id, status: 'resolved' });
      setItems(prev => prev.map(x => x.id === c.id ? { ...x, is_resolved: true, is_read: true } : x));
      if (view?.id === c.id) setView({ ...c, is_resolved: true, is_read: true });
    } catch {
      // Keep UI state unchanged if the request fails.
    }
  };
  const assign = async (c: ContactSubmission, who: string) => {
    try {
      await apiPost('/admin/contacts/update_status.php', { id: c.id, status: 'assigned', assigned_to: who });
      setItems(prev => prev.map(x => x.id === c.id ? { ...x, assigned_to: who, is_read: true } : x));
      if (view?.id === c.id) setView({ ...c, assigned_to: who, is_read: true });
    } catch {
      // Keep UI state unchanged if the request fails.
    }
  };
  const submitReply = async (c: ContactSubmission) => {
    if (!replyText.trim()) return;
    try {
      await apiPost('/admin/contacts/update_status.php', { id: c.id, status: 'replied', reply: replyText });
      setItems(prev => prev.map(x => x.id === c.id ? { ...x, reply: replyText, is_resolved: true, is_read: true } : x));
      if (view?.id === c.id) setView({ ...c, reply: replyText, is_resolved: true, is_read: true });
      setReplyText('');
    } catch {
      // Keep UI state unchanged if the request fails.
    }
  };

  const exportContacts = () => {
    const headers = ['ID', 'Name', 'Email', 'Company', 'Subject', 'Type', 'Priority', 'Status', 'Date'];
    const rows = filtered.map(item => ({
      ID: item.id,
      Name: item.name,
      Email: item.email,
      Company: item.company || '',
      Subject: item.subject,
      Type: item.type || '',
      Priority: item.priority || '',
      Status: item.is_resolved ? 'Resolved' : 'Pending',
      Date: item.created_at || '',
    }));
    downloadCsv('contacts.csv', headers, rows);
  };

  const filtered = items.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      || c.subject.toLowerCase().includes(search.toLowerCase())
      || c.email.toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Unread') return matchesSearch && !c.is_read;
    if (statusFilter === 'Resolved') return matchesSearch && c.is_resolved;
    if (statusFilter === 'Pending') return matchesSearch && !c.is_resolved;
    return matchesSearch && c.type === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const filterOptions = ['All', 'Unread', 'Pending', 'Resolved', ...Array.from(new Set(items.map(c => c.type || 'General')))];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Contact Submissions</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Manage inquiries, support tickets and contact form messages.</p>
        </div>
        <button onClick={exportContacts} className="admin-btn admin-btn-secondary"><Download className="w-4 h-4" /> Export All</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: items.length, color: 'bg-blue-50 text-blue-800', icon: Mail },
          { label: 'Unread New', value: items.filter(c => !c.is_read).length, color: 'bg-rose-50 text-rose-700', icon: AlertCircle },
          { label: 'Pending Action', value: items.filter(c => !c.is_resolved).length, color: 'bg-amber-50 text-amber-800', icon: Clock },
          { label: 'Resolved', value: items.filter(c => c.is_resolved).length, color: 'bg-emerald-50 text-emerald-800', icon: CheckCheck },
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
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, subject, email..." className="admin-input pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input pl-10 pr-8 appearance-none min-w-[200px]">
              {filterOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Type / Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-sub">Loading messages...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-sub">No messages found.</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} onClick={() => { setView(c); void markRead(c); }} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                        {!c.is_read && <span className="absolute w-2 h-2 bg-blue-500 rounded-full -mt-5 -mr-5" />}
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 max-w-[180px]">
                        <p className={`text-sm truncate ${c.is_read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>{c.name}</p>
                        <p className="text-xs text-slate-500 font-sub truncate">{c.company || c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className={`text-sm truncate max-w-[240px] ${c.is_read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>{c.subject}</p>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`admin-badge border !py-0 !px-2 text-[10px] ${typeStyle[c.type || 'General'] ?? ''}`}>{c.type}</span>
                      <span className={`admin-badge border !py-0 !px-2 text-[10px] ${priorityStyle[c.priority || 'Medium'] ?? ''}`}>{c.priority}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {c.is_resolved ? (
                        <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100 !py-0 !px-2 text-[10px]"><CheckCheck className="w-3 h-3 mr-0.5" /> Resolved</span>
                      ) : (
                        <span className="admin-badge bg-amber-50 text-amber-800 border border-amber-100 !py-0 !px-2 text-[10px]"><Clock className="w-3 h-3 mr-0.5" /> Pending</span>
                      )}
                      {c.assigned_to && (
                        <span className="admin-badge bg-blue-50 text-blue-700 border border-blue-100 !py-0 !px-2 text-[10px]"><ArrowLeftRight className="w-3 h-3 mr-0.5" /> Assigned</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm text-slate-600 whitespace-nowrap">{c.created_at?.slice(0, 10)}</div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setView(c); void markRead(c); }} className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {!c.is_resolved && (
                        <button onClick={() => void markResolved(c)} className="h-8 w-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-700" title="Resolve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
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
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-blue-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {!view.is_resolved ? (
                        <span className="admin-badge bg-amber-50 text-amber-800 border border-amber-100 !py-0 !px-2 text-[10px]">Pending</span>
                      ) : (
                        <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100 !py-0 !px-2 text-[10px]">Resolved</span>
                      )}
                      <span className={`admin-badge border !py-0 !px-2 text-[10px] ${typeStyle[view.type || 'General'] ?? ''}`}>{view.type}</span>
                      <span className={`admin-badge border !py-0 !px-2 text-[10px] ${priorityStyle[view.priority || 'Medium'] ?? ''}`}>{view.priority} Priority</span>
                      {view.assigned_to && (
                        <span className="admin-badge bg-blue-50 text-blue-700 border border-blue-100 !py-0 !px-2 text-[10px]">Assigned: {view.assigned_to}</span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 text-xl leading-tight">{view.subject}</h3>
                    <p className="text-sm text-slate-500 font-sub mt-1">#{view.id} · Received {view.created_at?.slice(0, 10)}</p>
                  </div>
                </div>
                <button onClick={() => setView(null)} className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Name', value: view.name, icon: UserCircle },
                    { label: 'Company', value: view.company || '—', icon: Building },
                    { label: 'Email', value: view.email, icon: Mail },
                    { label: 'Phone', value: view.phone || '—', icon: Phone },
                  ].map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-[11px] text-slate-500 font-sub uppercase tracking-wider">{f.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800 break-words">{f.value}</p>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm">Message</h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{view.message}</p>
                  </div>
                </div>
                {view.reply && (
                  <div>
                    <h4 className="font-heading font-semibold text-slate-900 mb-2 text-sm flex items-center gap-1.5"><Reply className="w-4 h-4 text-emerald-700" /> Our Reply</h4>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">{view.reply}</p>
                    </div>
                  </div>
                )}
              </div>
              {!view.reply && (
                <div className="px-6 pb-4">
                  <label className="admin-label"><Send className="w-3.5 h-3.5 inline mr-1" /> Quick Reply</label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your response here... (will also mark as resolved)"
                    className="admin-input resize-none"
                  />
                </div>
              )}
              <div className="p-6 border-t border-slate-100 flex flex-wrap justify-between gap-2 bg-slate-50 rounded-b-[20px]">
                <div className="flex flex-wrap gap-2">
                  {!view.is_read && <button onClick={() => void markRead(view)} className="admin-btn !py-2 !px-3 !text-xs bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"><Mail className="w-3.5 h-3.5" /> Mark Read</button>}
                  {!view.is_resolved && <button onClick={() => void markResolved(view)} className="admin-btn !py-2 !px-3 !text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> Mark Resolved</button>}
                  {!view.assigned_to && <button onClick={() => void assign(view, 'Admin User')} className="admin-btn !py-2 !px-3 !text-xs bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100"><ArrowLeftRight className="w-3.5 h-3.5" /> Assign to Me</button>}
                  <button onClick={() => { void (async () => { try { await apiPost('/admin/contacts/update_status.php', { id: view.id, status: 'spam' }); setItems(prev => prev.map(x => x.id === view.id ? { ...x, is_resolved: true, is_read: true, status: 'spam' } : x)); setView(prev => prev ? { ...prev, is_resolved: true, is_read: true, status: 'spam' } : prev); } catch {} })(); }} className="admin-btn !py-2 !px-3 !text-xs admin-btn-secondary"><Ban className="w-3.5 h-3.5" /> Mark Spam</button>
                </div>
                {!view.reply && (
                  <button onClick={() => void submitReply(view)} disabled={!replyText.trim()} className="admin-btn admin-btn-primary disabled:opacity-50"><Send className="w-4 h-4" /> Send Reply</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
