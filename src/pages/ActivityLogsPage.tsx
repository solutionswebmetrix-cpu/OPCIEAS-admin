import { useEffect, useState } from 'react';
import {
  Activity, Search, Filter, ChevronLeft, ChevronRight, Download,
  User, FileText, Package, ShoppingCart, Building, Users, ClipboardList,
  Mail, Settings as SettingsIcon, Shield, Calendar, MapPin, Eye,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import type { ActivityLog } from '../lib/types';

const modules = ['All', 'Auth', 'Sellers', 'Buyers', 'Products', 'Orders', 'Requirements', 'Categories', 'Contacts', 'Settings'];
const actions = ['All', 'create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'reply', 'update_status'];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (moduleFilter !== 'All') params.module = moduleFilter;
        if (actionFilter !== 'All') params.action = actionFilter;
        if (userFilter !== 'All') params.user = userFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const res: any = await apiGet('/admin/activity_logs/list.php', params);
        const list = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(list)) setLogs(list as ActivityLog[]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [moduleFilter, actionFilter, userFilter, dateFrom, dateTo]);

  const users = Array.from(new Set(logs.map(l => l.user_name || 'Unknown')));

  const filtered = logs.filter(l => {
    const matchesSearch = !search
      || (l.description || '').toLowerCase().includes(search.toLowerCase())
      || (l.user_name || '').toLowerCase().includes(search.toLowerCase())
      || (l.module || '').toLowerCase().includes(search.toLowerCase())
      || (l.action || '').toLowerCase().includes(search.toLowerCase());
    const matchesUser = userFilter === 'All' || l.user_name === userFilter;
    const matchesModule = moduleFilter === 'All' || l.module === moduleFilter;
    const matchesAction = actionFilter === 'All' || l.action === actionFilter;
    const matchesFrom = !dateFrom || (l.created_at || '') >= dateFrom;
    const matchesTo = !dateTo || (l.created_at || '') <= `${dateTo} 23:59:59`;
    return matchesSearch && matchesUser && matchesModule && matchesAction && matchesFrom && matchesTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getMeta = (l: ActivityLog) => ({ color: 'bg-slate-100 text-slate-600', icon: Activity } as any);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Complete audit trail of all admin and system actions.</p>
        </div>
        <button className="admin-btn admin-btn-secondary"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, color: 'bg-slate-900 text-white', icon: Activity },
          { label: 'Today', value: logs.filter(l => (l.created_at || '').startsWith(new Date().toISOString().slice(0, 10))).length, color: 'bg-emerald-50 text-emerald-800', icon: Calendar },
          { label: 'Unique Users', value: users.length, color: 'bg-blue-50 text-blue-800', icon: User },
          { label: 'Modules Used', value: new Set(logs.map(l => l.module)).size, color: 'bg-amber-50 text-amber-800', icon: SettingsIcon },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search activity, user, module..." className="admin-input pl-10" />
          </div>
          <select value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }} className="admin-input">
            {modules.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>)}
          </select>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="admin-input">
            {actions.map(a => <option key={a} value={a}>{a === 'All' ? 'All Actions' : a}</option>)}
          </select>
          <select value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }} className="admin-input">
            <option value="All">All Users</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-w-md">
          <div>
            <label className="admin-label text-xs">From Date</label>
            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="admin-input pl-10" /></div>
          </div>
          <div>
            <label className="admin-label text-xs">To Date</label>
            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="admin-input pl-10" /></div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Event</th>
                <th>Module</th>
                <th>User</th>
                <th>Subject</th>
                <th>IP Address</th>
                <th>Timestamp</th>
                <th className="text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading || paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 font-sub">{loading ? 'Loading logs...' : 'No activity found matching filters.'}</td></tr>
              ) : paginated.map(l => {
                const meta = getMeta(l);
                const Icon = meta.icon;
                return (
                  <tr key={l.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold capitalize text-slate-900">{l.action}</p>
                          <p className="text-[11px] text-slate-400 font-sub">#{l.id}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-badge bg-slate-100 text-slate-700 border border-slate-200 !py-0 !px-2">{l.module}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white text-[11px] font-bold">
                          {(l.user_name || 'U').charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{l.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-slate-700 truncate max-w-[160px]">{l.subject_type} #{l.subject_id}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />{l.ip_address || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-slate-600 whitespace-nowrap">{l.created_at?.slice(0, 16)?.replace('T', ' ')}</div>
                    </td>
                    <td className="text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 ml-auto" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 font-sub">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} entries</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === p ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
