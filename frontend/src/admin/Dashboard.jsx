import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ pages: 0, posts: 0, media: 0, users: 0 });
  const [recentPages, setRecentPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [pagesRes, postsRes, mediaRes] = await Promise.all([
        api.get('/pages?limit=5'),
        api.get('/posts?limit=5'),
        api.get('/media?limit=1')
      ]);

      setStats({
        pages: pagesRes.data.pagination?.total || 0,
        posts: postsRes.data.pagination?.total || 0,
        media: mediaRes.data.pagination?.total || 0,
        users: '-'
      });

      setRecentPages(pagesRes.data.data || []);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: t('totalPages'), value: stats.pages, icon: '📄', color: 'bg-blue-50 text-blue-700', link: '/admin/pages' },
    { label: t('totalPosts'), value: stats.posts, icon: '📝', color: 'bg-green-50 text-green-700', link: '/admin/posts' },
    { label: t('totalMedia'), value: stats.media, icon: '🖼', color: 'bg-purple-50 text-purple-700', link: '/admin/media' },
    { label: t('totalUsers'), value: stats.users, icon: '👥', color: 'bg-orange-50 text-orange-700', link: '/admin/users' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">{t('welcomeBack')}, {user?.name}! 👋</h2>
        <p className="text-blue-100 mt-1">Moveo CMS Beheer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/pages/new" className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
              📄 {t('newPage')}
            </Link>
            <Link to="/admin/posts/new" className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors text-sm font-medium">
              📝 {t('newPost')}
            </Link>
            <Link to="/admin/media" className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors text-sm font-medium">
              🖼 {t('uploadMedia')}
            </Link>
            <Link to="/admin/menus" className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors text-sm font-medium">
              ☰ {t('menus')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recentActivity')}</h3>
          {recentPages.length > 0 ? (
            <ul className="space-y-3">
              {recentPages.map(page => (
                <li key={page.id}>
                  <Link to={`/admin/pages/${page.id}`} className="flex items-center justify-between hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{page.title}</p>
                      <p className="text-xs text-gray-400">/{page.slug}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {page.status === 'PUBLISHED' ? t('published') : t('draft')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">{t('noResults')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
