import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../logo/logo.png';
import {
  LayoutDashboard, Building2, Users, Package, FolderTree, ClipboardList,
  ShoppingCart, FileText, Mail, Activity, Settings, UserCog, Bell,
  Menu, X, ChevronDown, Search, LogOut, Home, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../App';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sellers', label: 'Sellers', icon: Building2, badge: 3 },
  { path: '/buyers', label: 'Buyers', icon: Users },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/requirements', label: 'Requirements', icon: ClipboardList, badge: 5 },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/rfqs', label: 'RFQs', icon: FileText },
  { path: '/contacts', label: 'Contacts', icon: Mail, badge: 2 },
  { path: '/activity-logs', label: 'Activity Logs', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { auth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userName = auth.user?.name || 'Admin User';
  const userEmail = auth.user?.email || 'admin@opcieas.com';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-white
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg shadow-emerald-900/40 ring-1 ring-white/10">
              <img src={logo} alt="OPCIEAS logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">OPCIEAS</h1>
              <p className="text-[10px] text-slate-400 font-sub uppercase tracking-wider">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          <div className="px-3 py-2 text-[10px] font-sub font-semibold text-slate-500 uppercase tracking-wider">
            Management
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <Link
            to="/profile"
            className={`sidebar-nav-link ${isActive('/profile') ? 'active' : ''}`}
          >
            <UserCog className="w-4 h-4" />
            <span className="flex-1 truncate">My Profile</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="admin-input pl-10 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-card-lg border border-slate-100 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-heading font-bold text-slate-900">Notifications</h3>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-emerald-800 font-semibold hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-4 h-4 text-emerald-800" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">New seller registered</p>
                              <p className="text-xs text-slate-500 mt-0.5">Seller #{1000 + i} is awaiting approval</p>
                              <p className="text-[11px] text-slate-400 mt-1">{i}h ago</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block w-full p-3 text-center text-sm text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      See all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <div
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="topbar-pill"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white text-sm font-bold">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{userName}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">Administrator</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </div>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-card-lg border border-slate-100 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white font-bold text-lg">
                          {userInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-slate-900 truncate">{userName}</p>
                          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        <UserCog className="w-4 h-4 text-slate-500" />
                        My Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Site Settings
                      </Link>
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
