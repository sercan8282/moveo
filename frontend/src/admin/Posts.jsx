import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function Posts() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadPosts(); }, [page, search]);

  const loadPosts = async () => {
    try {
      const res = await api.get('/posts', { params: { page, search, limit: 20 } });
      setPosts(res.data.data || res.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (post) => {
    try {
      await api.put(`/posts/${post.id}`, {
        status: post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      });
      loadPosts();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const deletePost = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/posts/${id}`);
      toast.success(t('deletedSuccess'));
      loadPosts();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('posts')}</h2>
        <button
          onClick={() => navigate('/admin/posts/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + {t('newPost')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('noPosts')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('postTitle')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('status')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('date')}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-medium text-gray-900 cursor-pointer hover:text-blue-600" onClick={() => navigate(`/admin/posts/${post.id}`)}>
                        {post.title}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">/{post.slug}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleStatus(post)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {post.status === 'PUBLISHED' ? t('published') : t('draft')}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => navigate(`/admin/posts/${post.id}`)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">{t('edit')}</button>
                      <button onClick={() => deletePost(post.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">←</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">→</button>
          </div>
        )}
      </div>
    </div>
  );
}
