import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SellersPage from './pages/SellersPage';
import BuyersPage from './pages/BuyersPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import RequirementsPage from './pages/RequirementsPage';
import OrdersPage from './pages/OrdersPage';
import RFQsPage from './pages/RFQsPage';
import ContactsPage from './pages/ContactsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './components/AdminLayout';
import type { AdminAuth, User } from './lib/types';

interface AuthContextType {
  auth: AdminAuth;
  login: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { useAuth };

function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AdminAuth>({ authenticated: false, user: null });

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('admin_remember_token');
      const userStr = localStorage.getItem('admin_user');
      if (token) {
        let user: User | null = null;
        try { user = userStr ? JSON.parse(userStr) : null; } catch {}
        setAuth({ authenticated: true, user, remember_token: token });
        return;
      }

      try {
        const { apiGet } = await import('./lib/api');
        const res = await apiGet<any>('/auth/me.php');
        const data = res?.data || res;
        const user = data?.user || null;
        if (user) {
          localStorage.setItem('admin_user', JSON.stringify(user));
          setAuth({ authenticated: true, user, remember_token: null });
        }
      } catch {
        setAuth({ authenticated: false, user: null, remember_token: null });
      }
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { apiPost } = await import('./lib/api');
    const res = await apiPost<any>('/auth/login.php', { email, password });
    const data = res?.data || res;
    const token = data?.remember_token || data?.token || res?.remember_token;
    const user = data?.user || res?.user || null;
    const redirect = data?.redirect || '/dashboard';
    if (token) localStorage.setItem('admin_remember_token', token);
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    setAuth({ authenticated: true, user, remember_token: token });
    return redirect;
  };

  const logout = async () => {
    try {
      const { apiGet } = await import('./lib/api');
      await apiGet('/auth/logout.php');
    } catch {}
    localStorage.removeItem('admin_remember_token');
    localStorage.removeItem('admin_user');
    setAuth({ authenticated: false, user: null, remember_token: null });
  };

  const setUser = (user: User | null) => {
    setAuth(prev => ({ ...prev, user }));
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    else localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function RoutesWithAnimation() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="sellers" element={<AnimatedPage><SellersPage /></AnimatedPage>} />
          <Route path="buyers" element={<AnimatedPage><BuyersPage /></AnimatedPage>} />
          <Route path="products" element={<AnimatedPage><ProductsPage /></AnimatedPage>} />
          <Route path="categories" element={<AnimatedPage><CategoriesPage /></AnimatedPage>} />
          <Route path="requirements" element={<AnimatedPage><RequirementsPage /></AnimatedPage>} />
          <Route path="orders" element={<AnimatedPage><OrdersPage /></AnimatedPage>} />
          <Route path="rfqs" element={<AnimatedPage><RFQsPage /></AnimatedPage>} />
          <Route path="contacts" element={<AnimatedPage><ContactsPage /></AnimatedPage>} />
          <Route path="activity-logs" element={<AnimatedPage><ActivityLogsPage /></AnimatedPage>} />
          <Route path="settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
          <Route path="notifications" element={<AnimatedPage><NotificationsPage /></AnimatedPage>} />
          <Route path="profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <RoutesWithAnimation />
      </AuthProvider>
    </BrowserRouter>
  );
}
