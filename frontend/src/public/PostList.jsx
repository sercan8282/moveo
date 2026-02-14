import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadPosts(); }, [page]);

  const loadPosts = async () => {
    try {
      const res = await api.get('/public/posts', { params: { page, limit: 12 } });
      setPosts(res.data.data || res.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>Blog</h1>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: 'var(--color-text-light, #64748b)' }}>No posts yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => {
                const content = typeof post.content === 'string' ? post.content : (post.content?.html || '');
                const excerpt = post.excerpt || content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

                return (
                  <article key={post.id} className="rounded-xl overflow-hidden border transition-shadow hover:shadow-lg"
                    style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                    {post.featuredImage && (
                      <Link to={`/blog/${post.slug}`}>
                        <img src={post.featuredImage.path} alt={post.featuredImage.altText || post.title}
                          className="w-full h-48 object-cover" />
                      </Link>
                    )}
                    <div className="p-5">
                      <p className="text-xs mb-2" style={{ color: 'var(--color-text-light, #64748b)' }}>
                        {new Date(post.createdAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <Link to={`/blog/${post.slug}`}>
                        <h2 className="text-xl font-bold mb-2 hover:opacity-80 transition-opacity"
                          style={{ color: 'var(--color-text, #0f172a)' }}>
                          {post.title}
                        </h2>
                      </Link>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-light, #64748b)' }}>
                        {excerpt}
                      </p>
                      <Link to={`/blog/${post.slug}`}
                        className="text-sm font-medium hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--color-primary, #2563eb)' }}>
                        Read more →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                  ← Previous
                </button>
                <span className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
