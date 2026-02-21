import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { key: 'dashboard', path: '/admin', icon: '📊' },
  { key: 'pages', path: '/admin/pages', icon: '📄' },
  { key: 'posts', path: '/admin/posts', icon: '📝' },
  { key: 'media', path: '/admin/media', icon: '🖼' },
  { key: 'menus', path: '/admin/menus', icon: '☰' },
  { key: 'homepage', path: '/admin/homepage', icon: '🏠' },
  { key: 'footer', path: '/admin/footer', icon: '⬇' },
  { key: 'themes', path: '/admin/themes', icon: '🎨' },
  { key: 'vehicleTypes', path: '/admin/vehicle-types', icon: '🚛', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'quotes', path: '/admin/quotes', icon: '📋', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'users', path: '/admin/users', icon: '👥', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'company', path: '/admin/company', icon: '🏢', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'emailSettings', path: '/admin/email', icon: '📧', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'sites', path: '/admin/sites', icon: '🌐', roles: ['SUPER_ADMIN'] },
  { key: 'settings', path: '/admin/settings', icon: '⚙' , roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
              <span className="font-semibold text-gray-800">Moveo CMS</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {filteredNav.map(item => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              
              return (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={!sidebarOpen ? t(item.key) : undefined}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && <span>{t(item.key)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <span>🚪</span>
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              ☰
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {t(navItems.find(i => 
                location.pathname === i.path || 
                (i.path !== '/admin' && location.pathname.startsWith(i.path))
              )?.key || 'dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switch */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => changeLanguage('nl')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  language === 'nl' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                NL
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                EN
              </button>
            </div>

            {/* View site */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🌐 Website
            </a>

            {/* Profile */}
            <Link
              to="/admin/profile"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              👤 {user?.name}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
