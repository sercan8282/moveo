import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import RichTextEditor from '../components/RichTextEditor';
import MediaLibrary from '../components/MediaLibrary';
import { PageBuilder, createRow } from '../components/PageBuilder';
import toast from 'react-hot-toast';

export default function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'DRAFT',
    parentId: '',
    metaTitle: '',
    metaDescription: '',
    template: 'default',
    featuredImageId: null
  });
  const [editorMode, setEditorMode] = useState('builder');
  const [builderRows, setBuilderRows] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [featuredImage, setFeaturedImage] = useState(null);

  useEffect(() => {
    loadPagesList();
    if (!isNew) loadPage();
  }, [id]);

  const loadPagesList = async () => {
    try {
      const res = await api.get('/pages/list');
      setPages(res.data.filter(p => p.id !== parseInt(id)));
    } catch (error) {
      console.error(error);
    }
  };

  const loadPage = async () => {
    try {
      const res = await api.get(`/pages/${id}`);
      const page = res.data;

      let content = page.content;
      if (typeof content === 'string') {
        try { content = JSON.parse(content); } catch { content = { html: page.content }; }
      }
      content = content || {};

      if (content.rows && Array.isArray(content.rows)) {
        setEditorMode('builder');
        setBuilderRows(content.rows);
      } else {
        setEditorMode('classic');
      }

      setForm({
        title: page.title || '',
        slug: page.slug || '',
        content: content.html || '',
        excerpt: page.excerpt || '',
        status: page.status || 'DRAFT',
        parentId: page.parentId?.toString() || '',
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
        template: page.template || 'default',
        featuredImageId: page.featuredImageId
      });

      if (page.featuredImageId) {
        try {
          const mediaRes = await api.get(`/public/media/${page.featuredImageId}`);
          setFeaturedImage(mediaRes.data);
        } catch (e) {}
      }
    } catch (error) {
      toast.error(t('error'));
      navigate('/admin/pages');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm(prev => ({
      ...prev, title,
      slug: isNew ? generateSlug(title) : prev.slug,
      metaTitle: prev.metaTitle || title
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      let contentData;
      if (editorMode === 'builder') {
        contentData = { rows: builderRows, mode: 'builder' };
      } else {
        contentData = { html: form.content, mode: 'classic' };
      }

      const data = {
        ...form,
        content: contentData,
        parentId: form.parentId ? parseInt(form.parentId) : null,
        featuredImageId: form.featuredImageId
      };

      if (isNew) {
        await api.post('/pages', data);
        toast.success(t('savedSuccess'));
        navigate('/admin/pages');
      } else {
        await api.put(`/pages/${id}`, data);
        toast.success(t('savedSuccess'));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (media) => {
    setFeaturedImage(media);
    setForm(prev => ({ ...prev, featuredImageId: media.id }));
    setShowMedia(false);
  };

  const switchMode = (mode) => {
    if (mode === editorMode) return;
    if (mode === 'builder' && builderRows.length === 0) {
      setBuilderRows([createRow([12])]);
    }
    setEditorMode(mode);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <form onSubmit={handleSave}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/admin/pages')} className="text-gray-500 hover:text-gray-700">← {t('back')}</button>
            <h2 className="text-2xl font-bold text-gray-800">{isNew ? t('newPage') : t('editPage')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="DRAFT">{t('draft')}</option>
              <option value="PUBLISHED">{t('published')}</option>
            </select>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pageTitle')}</label>
              <input type="text" value={form.title} onChange={handleTitleChange} placeholder={t('pageTitle')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Slug</label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-1">/</span>
                  <input type="text" value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" />
                </div>
              </div>
            </div>

            {/* Editor Mode Toggle */}
            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button type="button" onClick={() => switchMode('builder')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  editorMode === 'builder' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                🧱 Page Builder
              </button>
              <button type="button" onClick={() => switchMode('classic')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  editorMode === 'classic' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                📝 Classic Editor
              </button>
            </div>

            {/* Content Editor */}
            {editorMode === 'builder' ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <PageBuilder rows={builderRows} onChange={setBuilderRows} />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pageContent')}</label>
                <RichTextEditor content={form.content} onChange={(html) => setForm(prev => ({ ...prev, content: html }))} />
              </div>
            )}

            {/* Excerpt */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pageExcerpt')}</label>
              <textarea value={form.excerpt} onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-y" placeholder={t('pageExcerpt')} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pageParent')}</label>
              <select value={form.parentId} onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">{t('noParent')}</option>
                {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pageTemplate')}</label>
              <select value={form.template} onChange={(e) => setForm(prev => ({ ...prev, template: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="default">Default</option>
                <option value="full-width">Full Width</option>
                <option value="sidebar">With Sidebar</option>
                <option value="contact">Contact</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('featuredImage')}</label>
              {featuredImage ? (
                <div className="relative">
                  <img src={featuredImage.path} alt="" className="w-full rounded-lg" />
                  <button type="button" onClick={() => { setFeaturedImage(null); setForm(prev => ({ ...prev, featuredImageId: null })); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowMedia(true)}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                  {t('selectImage')}
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">SEO</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('metaTitle')}</label>
                  <input type="text" value={form.metaTitle} onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('metaDescription')}</label>
                  <textarea value={form.metaDescription} onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                    rows={3} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm resize-y" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <MediaLibrary isOpen={showMedia} onClose={() => setShowMedia(false)} onSelect={handleMediaSelect} />
    </div>
  );
}
