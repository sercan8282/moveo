import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';

// Admin
import AdminLayout from './components/AdminLayout';
import Login from './admin/Login';
import Dashboard from './admin/Dashboard';
import Pages from './admin/Pages';
import PageEditor from './admin/PageEditor';
import Posts from './admin/Posts';
import PostEditor from './admin/PostEditor';
import MediaManager from './admin/MediaManager';
import MenuManager from './admin/MenuManager';
import UserManager from './admin/UserManager';
import ThemeSettings from './admin/ThemeSettings';
import HomepageEditor from './admin/HomepageEditor';
import FooterEditor from './admin/FooterEditor';
import Settings from './admin/Settings';
import CompanySettings from './admin/CompanySettings';
import Profile from './admin/Profile';
import VehicleTypes from './admin/VehicleTypes';
import QuoteManager from './admin/QuoteManager';
import EmailSettings from './admin/EmailSettings';
import SiteManager from './admin/SiteManager';

// Public
import PublicLayout from './public/PublicLayout';
import HomePage from './public/HomePage';
import PageView from './public/PageView';
import PostList from './public/PostList';
import PostView from './public/PostView';
import TransportCalculator from './public/TransportCalculator';
import NotFound from './public/NotFound';

function CalculatorGuard() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/settings').then(r => r.json()).then(data => {
      setEnabled(data.calculator_enabled !== 'false');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  return enabled ? <TransportCalculator /> : <NotFound />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/admin/login" replace />;
}

function AdminRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/admin" replace /> : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '14px' }
              }}
            />
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminRedirect />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="pages" element={<Pages />} />
                <Route path="pages/new" element={<PageEditor />} />
                <Route path="pages/:id" element={<PageEditor />} />
                <Route path="posts" element={<Posts />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/:id" element={<PostEditor />} />
                <Route path="media" element={<MediaManager />} />
                <Route path="menus" element={<MenuManager />} />
                <Route path="users" element={<UserManager />} />
                <Route path="themes" element={<ThemeSettings />} />
                <Route path="homepage" element={<HomepageEditor />} />
                <Route path="footer" element={<FooterEditor />} />
                <Route path="settings" element={<Settings />} />
                <Route path="company" element={<CompanySettings />} />
                <Route path="vehicle-types" element={<VehicleTypes />} />
                <Route path="quotes" element={<QuoteManager />} />
                <Route path="email" element={<EmailSettings />} />
                <Route path="sites" element={<SiteManager />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Public routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="calculator" element={<CalculatorGuard />} />
                <Route path="blog" element={<PostList />} />
                <Route path="blog/:slug" element={<PostView />} />
                <Route path=":slug" element={<PageView />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
