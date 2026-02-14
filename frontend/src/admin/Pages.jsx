import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function Pages() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadPages(); }, []);

  const loadPages = async () => {
    try {
      const res = await api.get('/pages', { params: { limit: 100, search } });
      setPages(res.data.data || []);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await api.delete(`/pages/${id}`);
      toast.success(t('deleteSuccess'));
      loadPages();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleStatusToggle = async (page) => {
    try {
      await api.put(`/pages/${page.id}`, {
        status: page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      });
      loadPages();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('pages')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPages()}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
          />
          <Link
            to="/admin/pages/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t('newPage')}
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">{t('title')}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Slug</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">{t('status')}</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">{t('lastModified')}</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pages.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">{t('noResults')}</td></tr>
              ) : (
                pages.map(page => (
                  <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/pages/${page.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">
                        {page.parentId && <span className="text-gray-400 mr-1">↳</span>}
                        {page.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">/{page.slug}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(page)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          page.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {page.status === 'PUBLISHED' ? t('published') : t('draft')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(page.updatedAt).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/pages/${page.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {t('edit')}
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
