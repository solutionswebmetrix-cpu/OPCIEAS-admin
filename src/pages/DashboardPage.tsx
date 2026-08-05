import { useEffect, useState } from 'react';

const refreshDashboardEvent = 'rfq-status-updated';
const adminRefreshEvent = 'admin-data-updated';
import { Link } from 'react-router-dom';
import {
  Building2, Users, Package, ClipboardList, ShoppingCart,
  ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle,
  Eye, DollarSign, Zap, BarChart3, FileText, Plus, Star,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import type { DashboardStats } from '../lib/types';

interface DashboardApiResponse {
  counts?: Record<string, number | string | undefined>;
  recent_activity?: Array<{
    id?: string;
    action?: string;
    details?: string;
    created_at?: string;
    user_name?: string;
  }>;
  monthly_chart?: Array<{ month?: string; product_count?: number }>;
}

function StatCard({
  title, value, subValue, icon: Icon, color,
}: {
  title: string; value: string | number; subValue?: string;
  icon: any; color: string;
}) {
  return (
    <div className="admin-card p-5 hover:shadow-card-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-sub font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-heading font-bold text-slate-900 mt-2">{value}</h3>
          {subValue && <p className="text-xs text-slate-500 mt-1 font-sub">{subValue}</p>}
        </div>
        <div className={`stat-card-icon ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res: any = await apiGet('/admin/dashboard/stats.php');
      const data: DashboardApiResponse = res?.data || res || {};
      const counts = data.counts || {};
      const normalized: DashboardStats = {
        total_sellers: Number(counts.total_sellers ?? counts.sellers_total ?? 0),
        pending_sellers: Number(counts.pending_sellers ?? 0),
        approved_sellers: Number(counts.approved_sellers ?? 0),
        total_buyers: Number(counts.total_buyers ?? counts.buyers_total ?? 0),
        approved_buyers: Number(counts.approved_buyers ?? 0),
        total_products: Number(counts.total_products ?? 0),
        published_products: Number(counts.published_products ?? counts.approved_products ?? 0),
        pending_products: Number(counts.pending_products ?? 0),
        pending_requirements: Number(counts.pending_requirements ?? 0),
        pending_orders: Number(counts.pending_orders ?? 0),
        total_orders: Number(counts.total_orders ?? 0),
        total_revenue: Number(counts.total_revenue ?? 0),
        total_rfqs: Number(counts.total_rfqs ?? 0),
        new_rfqs: Number(counts.new_rfqs ?? 0),
        pending_rfqs: Number(counts.pending_rfqs ?? 0),
        quoted_rfqs: Number(counts.quoted_rfqs ?? 0),
        closed_rfqs: Number(counts.closed_rfqs ?? 0),
        rejected_rfqs: Number(counts.rejected_rfqs ?? 0),
        recent_activity: data.recent_activity || [],
        monthly_chart: data.monthly_chart || [],
      };
      setStats(normalized);
    } catch {
      setStats(null);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void loadStats();
    const onRefresh = () => { void loadStats(); };
    window.addEventListener(refreshDashboardEvent, onRefresh);
    window.addEventListener(adminRefreshEvent, onRefresh);
    return () => {
      window.removeEventListener(refreshDashboardEvent, onRefresh);
      window.removeEventListener(adminRefreshEvent, onRefresh);
    };
  }, []);

  const quickActions = [
    { label: 'Add Product', icon: Plus, path: '/products', color: 'bg-emerald-50 text-emerald-800' },
    { label: 'New Order', icon: ShoppingCart, path: '/orders', color: 'bg-amber-50 text-amber-800' },
    { label: 'View RFQs', icon: FileText, path: '/rfqs', color: 'bg-blue-50 text-blue-800' },
    { label: 'Site Settings', icon: Zap, path: '/settings', color: 'bg-purple-50 text-purple-800' },
  ];

  const recentActivities = (stats?.recent_activity || []).map(item => ({
    type: item.action || 'activity',
    title: item.action ? item.action.replace(/_/g, ' ') : 'Platform activity',
    detail: item.details || item.user_name || 'Activity recorded',
    time: item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently updated',
    status: item.action?.includes('approve') ? 'success' : item.action?.includes('create') ? 'pending' : 'info',
  }));

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'success': return 'bg-emerald-50 text-emerald-800';
      case 'pending': return 'bg-amber-50 text-amber-800';
      case 'warning': return 'bg-orange-50 text-orange-800';
      case 'danger': return 'bg-red-50 text-red-800';
      default: return 'bg-blue-50 text-blue-800';
    }
  };
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'success': return CheckCircle;
      case 'pending': return Clock;
      case 'warning': return AlertCircle;
      case 'danger': return XCircle;
      default: return Eye;
    }
  };

  const chartData = (stats as any)?.monthly_chart || [];
  const chartMax = chartData.length ? Math.max(1, ...chartData.map((d: any) => Number(d.product_count || 0))) : 1;
  const months = chartData.length ? chartData.map((d: any) => d.month?.slice(5) || '—') : [];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="admin-card p-5 h-32 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
            <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">
            Welcome back — here's what's happening at OPCIEAS today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="admin-badge bg-emerald-50 text-emerald-800 border border-emerald-100">
            <Star className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" />
            Live Data
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Sellers"
          value={stats?.total_sellers ?? 0}
          subValue={`${stats?.pending_sellers ?? 0} pending · ${stats?.approved_sellers ?? 0} approved`}
          icon={Building2}
          color="bg-emerald-50 text-emerald-800"
        />
        <StatCard
          title="Buyers Registered"
          value={stats?.total_buyers ?? 0}
          subValue={`${stats?.approved_buyers ?? 0} approved`}
          icon={Users}
          color="bg-blue-50 text-blue-800"
        />
        <StatCard
          title="Products"
          value={stats?.total_products ?? 0}
          subValue={`${stats?.published_products ?? 0} published · ${stats?.pending_products ?? 0} pending`}
          icon={Package}
          color="bg-amber-50 text-amber-800"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pending_orders ?? 0}
          subValue={`${stats?.total_orders ?? 0} total orders`}
          icon={ShoppingCart}
          color="bg-purple-50 text-purple-800"
        />
        <StatCard
          title="Requirements Pending"
          value={stats?.pending_requirements ?? 0}
          subValue="Awaiting review"
          icon={ClipboardList}
          color="bg-orange-50 text-orange-800"
        />
        <StatCard
          title="RFQs"
          value={stats?.total_rfqs ?? 0}
          subValue={`${stats?.new_rfqs ?? 0} new · ${stats?.pending_rfqs ?? 0} pending · ${stats?.quoted_rfqs ?? 0} quoted`}
          icon={FileText}
          color="bg-teal-50 text-teal-800"
        />
        <StatCard
          title="Total Orders"
          value={stats?.total_orders ?? 0}
          subValue="All time"
          icon={BarChart3}
          color="bg-slate-100 text-slate-800"
        />
        <StatCard
          title="Total Revenue"
          value={stats?.total_revenue ? `₹${Math.round(stats.total_revenue).toLocaleString('en-IN')}` : '₹0'}
          subValue="Lifetime GMV"
          icon={DollarSign}
          color="bg-emerald-900 text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 admin-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-lg">Sales Overview</h3>
              <p className="text-xs text-slate-500 mt-1 font-sub">Last 12 months orders & revenue</p>
            </div>
            <div className="flex gap-2">
              <button className="tab-btn active text-xs">Yearly</button>
              <button className="tab-btn text-xs">Monthly</button>
              <button className="tab-btn text-xs">Weekly</button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {chartData.length ? chartData.map((item: any, i: number) => {
              const h = Math.max(8, (Number(item.product_count || 0) / chartMax) * 100);
              return (
                <div key={item.month || i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-800 to-emerald-600 transition-all hover:from-emerald-900 hover:to-emerald-700 cursor-pointer relative group"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Number(item.product_count || 0)} products
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sub">{months[i] || '—'}</span>
                </div>
              );
            }) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-slate-500">
                No monthly product activity available yet.
              </div>
            )}
          </div>
        </div>

        <div className="admin-card p-6">
          <h3 className="font-heading font-bold text-slate-900 text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  to={a.path}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="font-heading font-bold text-sm text-slate-900 mb-3">Platform Snapshot</h4>
            {[
              { label: 'Total Sellers', value: stats?.total_sellers ?? 0, suffix: 'registered' },
              { label: 'Pending Products', value: stats?.pending_products ?? 0, suffix: 'awaiting review' },
              { label: 'Pending Requirements', value: stats?.pending_requirements ?? 0, suffix: 'open requests' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-[11px] text-slate-400 font-sub uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                </div>
                <span className="text-sm font-bold text-emerald-800">{item.suffix}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-bold text-slate-900 text-lg">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-1 font-sub">Latest events across the platform</p>
          </div>
          <Link to="/activity-logs" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1">
            View all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100 -mx-2">
          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No recent activity yet.</div>
          ) : recentActivities.map((a, i) => {
            const StatusIcon = getStatusIcon(a.status);
            return (
              <div key={i} className="flex items-center gap-4 py-3.5 px-2 hover:bg-slate-50/60 rounded-xl transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(a.status)}`}>
                  <StatusIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate font-sub">{a.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-sub shrink-0">{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
