import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock3, Sparkles, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res: any = await apiGet('/admin/notifications/list.php', { page: 1, limit: 10 });
      const list = Array.isArray(res?.data?.items) ? res.data.items : [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      setProcessingId(id);
      await apiPost('/admin/notifications/mark_read.php', { ids: [id] });
      setItems(prev => prev.map(item => (item.id === id ? { ...item, is_read: true } : item)));
    } catch {
      // Keep the current state if the update fails.
    } finally {
      setProcessingId(null);
    }
  };

  const unreadCount = items.filter(item => !item.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1 font-sub">Track recent system and admin alerts.</p>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-slate-900">Recent Alerts</h3>
            <p className="text-sm text-slate-500">Latest platform updates and actions requiring attention.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading alerts...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No alerts available yet.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const isUnread = !item.is_read;
              const iconColor = item.type === 'success' ? 'bg-emerald-50 text-emerald-700' : item.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
              const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'warning' ? Sparkles : Clock3;
              return (
                <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.title || 'System alert'}</p>
                      <p className="text-sm text-slate-600">{item.message || 'No additional details available.'}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently updated'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap">{isUnread ? `${unreadCount} unread` : 'Read'}</span>
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        disabled={processingId === item.id}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-60"
                      >
                        {processingId === item.id ? 'Updating...' : 'Mark read'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
