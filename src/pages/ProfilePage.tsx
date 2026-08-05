import { Mail, Phone, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAuth } from '../App';

export default function ProfilePage() {
  const { auth } = useAuth();
  const userName = auth.user?.name || 'System Administrator';
  const userEmail = auth.user?.email || 'admin@opcieas.com';
  const userRole = auth.user?.role || 'Super Admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">Admin Profile</h1>
        <p className="text-sm text-slate-500 mt-1 font-sub">Manage your account details and access preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
        <div className="admin-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-white flex items-center justify-center">
              <UserCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-900 text-xl">{userName}</h3>
              <p className="text-sm text-slate-500">{userRole} · {userEmail}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{userEmail}</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Full access to dashboard, users, products, orders and settings</span>
            </div>
          </div>
        </div>

        <div className="admin-card p-6">
          <h3 className="font-heading font-semibold text-slate-900 mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button className="admin-btn admin-btn-primary w-full justify-center">Update Profile</button>
            <button className="admin-btn admin-btn-secondary w-full justify-center">Change Password</button>
            <button className="admin-btn admin-btn-secondary w-full justify-center">Download Activity Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}
