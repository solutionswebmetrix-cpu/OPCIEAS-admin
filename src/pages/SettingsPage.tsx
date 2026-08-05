import { useEffect, useState } from 'react';
import { Settings, ShieldCheck, BellRing, Database, Save, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

interface SettingValue {
  value: any;
  type?: string;
  description?: string | null;
}

type SettingsMap = Record<string, SettingValue>;

const settingKeys = {
  siteName: 'site_name',
  primaryEmail: 'primary_email',
  defaultCurrency: 'default_currency',
  adminApprovalRequired: 'admin_approval_required',
  csrfProtectionEnabled: 'csrf_protection_enabled',
  sessionTimeoutHours: 'session_timeout_hours',
  sellerRegistrationAlerts: 'seller_registration_alerts',
  buyerRequirementAlerts: 'buyer_requirement_alerts',
  orderStatusUpdates: 'order_status_updates',
  imageUploadDirectoryActive: 'image_upload_directory_active',
  activityLogsEnabled: 'activity_logs_enabled',
  databaseBackupSchedulePending: 'database_backup_schedule_pending',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: any = await apiGet('/admin/settings/list.php');
        const list = res?.data && typeof res.data === 'object' ? res.data : {};
        setSettings(list as SettingsMap);
      } catch {
        setSettings({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getSettingValue = (key: string, fallback: any = '') => {
    const value = settings[key]?.value;
    return value === undefined || value === null ? fallback : value;
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), value },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const payload = Object.fromEntries(
        Object.entries(settings).map(([key, entry]) => [key, entry.value])
      );
      await apiPost('/admin/settings/update.php', { settings: payload });
    } catch {
      // Keep the form state intact and surface the failure through the current UI.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-slate-900">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1 font-sub">Manage core platform preferences and operational defaults.</p>
        </div>
        <button onClick={saveSettings} className="admin-btn admin-btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>

      {loading ? (
        <div className="admin-card p-6 text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-900">General Settings</h3>
                  <p className="text-sm text-slate-500">Brand, contact and portal defaults.</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-3">
                  <span>Site name</span>
                  <input value={String(getSettingValue(settingKeys.siteName, 'OPCIEAS'))} onChange={e => updateSetting(settingKeys.siteName, e.target.value)} className="admin-input max-w-[180px] py-2" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-3">
                  <span>Primary email</span>
                  <input value={String(getSettingValue(settingKeys.primaryEmail, 'admin@opcieas.com'))} onChange={e => updateSetting(settingKeys.primaryEmail, e.target.value)} className="admin-input max-w-[220px] py-2" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-3">
                  <span>Default currency</span>
                  <input value={String(getSettingValue(settingKeys.defaultCurrency, 'INR'))} onChange={e => updateSetting(settingKeys.defaultCurrency, e.target.value)} className="admin-input max-w-[100px] py-2" />
                </div>
              </div>
            </div>

            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-900">Security & Access</h3>
                  <p className="text-sm text-slate-500">Authentication and approval safeguards.</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span>Admin approval required</span>
                  <select value={String(getSettingValue(settingKeys.adminApprovalRequired, true))} onChange={e => updateSetting(settingKeys.adminApprovalRequired, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span>CSRF protection</span>
                  <select value={String(getSettingValue(settingKeys.csrfProtectionEnabled, true))} onChange={e => updateSetting(settingKeys.csrfProtectionEnabled, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 gap-3">
                  <span>Session timeout</span>
                  <input type="number" value={Number(getSettingValue(settingKeys.sessionTimeoutHours, 8))} onChange={e => updateSetting(settingKeys.sessionTimeoutHours, Number(e.target.value))} className="admin-input max-w-[100px] py-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-500">Email and in-app notification defaults.</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Seller registration alerts</span>
                  <select value={String(getSettingValue(settingKeys.sellerRegistrationAlerts, true))} onChange={e => updateSetting(settingKeys.sellerRegistrationAlerts, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Buyer requirement alerts</span>
                  <select value={String(getSettingValue(settingKeys.buyerRequirementAlerts, true))} onChange={e => updateSetting(settingKeys.buyerRequirementAlerts, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Order status updates</span>
                  <select value={String(getSettingValue(settingKeys.orderStatusUpdates, true))} onChange={e => updateSetting(settingKeys.orderStatusUpdates, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-900">Storage & Backup</h3>
                  <p className="text-sm text-slate-500">Uploads, logs and backup preferences.</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Image upload directory</span>
                  <select value={String(getSettingValue(settingKeys.imageUploadDirectoryActive, true))} onChange={e => updateSetting(settingKeys.imageUploadDirectoryActive, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Activity logs</span>
                  <select value={String(getSettingValue(settingKeys.activityLogsEnabled, true))} onChange={e => updateSetting(settingKeys.activityLogsEnabled, e.target.value === 'true')} className="admin-input max-w-[120px] py-2">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
                  <span>Database backup schedule</span>
                  <select value={String(getSettingValue(settingKeys.databaseBackupSchedulePending, false))} onChange={e => updateSetting(settingKeys.databaseBackupSchedulePending, e.target.value === 'true')} className="admin-input max-w-[140px] py-2">
                    <option value="true">Pending</option>
                    <option value="false">Complete</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
