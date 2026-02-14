import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function PostView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPost(); }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/public/posts/${slug}`);
      setPost(res.data);
      document.title = (res.data.metaTitle || res.data.title) + ' | Blog | Moveo BV';
    } catch (error) {
      if (error.response?.status === 404) {
        navigate('/404', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  }

  if (!post) return null;

  const content = typeof post.content === 'string' ? post.content : (post.content?.html || '');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="text-sm font-medium hover:opacity-80 transition-opacity mb-4 inline-block"
            style={{ color: 'var(--color-primary, #2563eb)' }}>
            ← Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-2" style={{ color: 'var(--color-text, #0f172a)' }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
              {new Date(post.createdAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {post.author && (
              <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
                by {post.author.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <img src={post.featuredImage.path} alt={post.featuredImage.altText || post.title}
            className="w-full rounded-xl shadow-lg" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
