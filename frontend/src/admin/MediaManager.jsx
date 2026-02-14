import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import MediaLibrary from '../components/MediaLibrary';
import toast from 'react-hot-toast';

export default function MediaManager() {
  const { t } = useLanguage();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadMedia(); }, [page, search]);

  const loadMedia = async () => {
    try {
      const res = await api.get('/media', { params: { page, search, limit: 24 } });
      setMedia(res.data.data || res.data);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
        await api.post('/media/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      toast.success(t('uploadSuccess'));
      loadMedia();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteMedia = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/media/${id}`);
      toast.success(t('deletedSuccess'));
      setSelected(null);
      loadMedia();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const updateAltText = async (id, altText) => {
    try {
      await api.put(`/media/${id}`, { altText });
      toast.success(t('savedSuccess'));
      loadMedia();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const resizeImage = async (id, preset) => {
    try {
      await api.post(`/media/${id}/resize`, { preset });
      toast.success(t('savedSuccess'));
      loadMedia();
      if (selected?.id === id) {
        const res = await api.get(`/media/${id}`);
        setSelected(res.data);
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const resizeCustom = async (id, width, height) => {
    try {
      await api.post(`/media/${id}/resize`, { width: parseInt(width), height: parseInt(height) });
      toast.success(t('savedSuccess'));
      loadMedia();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('uploadSuccess'));
      loadMedia();
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('media')}</h2>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer">
          {uploading ? t('uploading') : `+ ${t('upload')}`}
          <input type="file" multiple accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <input type="text" placeholder={t('search') + '...'} value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>

            <div
              className="p-4"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {loading ? (
                <div className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
              ) : media.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-400 text-lg">{t('noMedia')}</p>
                  <p className="text-gray-400 text-sm mt-1">Drag & drop files here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {media.map(item => {
                    const isVideo = item.mimeType && item.mimeType.startsWith('video/');
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 aspect-square transition-all ${
                          selected?.id === item.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        {isVideo ? (
                          <>
                            <video src={item.path} muted preload="metadata" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={item.path} alt={item.altText || item.filename} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                        {isVideo && (
                          <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">VIDEO</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">←</button>
                <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50">→</button>
              </div>
            )}
          </div>
        </div>

        {/* Detail Sidebar */}
        <div>
          {selected ? (
            <MediaDetail
              media={selected}
              onDelete={() => deleteMedia(selected.id)}
              onUpdateAlt={(altText) => updateAltText(selected.id, altText)}
              onResize={(preset) => resizeImage(selected.id, preset)}
              onResizeCustom={(w, h) => resizeCustom(selected.id, w, h)}
              formatSize={formatSize}
              t={t}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <p>{t('selectMedia')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaDetail({ media, onDelete, onUpdateAlt, onResize, onResizeCustom, formatSize, t }) {
  const [altText, setAltText] = useState(media.altText || '');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const isVideo = media.mimeType && media.mimeType.startsWith('video/');

  useEffect(() => {
    setAltText(media.altText || '');
    setCustomW('');
    setCustomH('');
  }, [media.id]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {isVideo ? (
        <video src={media.path} controls preload="metadata" className="w-full bg-black" />
      ) : (
        <img src={media.path} alt={media.altText || media.filename} className="w-full" />
      )}
      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-800 truncate">{media.filename}</p>
          <p className="text-xs text-gray-500 mt-1">
            {media.mimeType} • {formatSize(media.size)}
            {media.width && ` • ${media.width}×${media.height}`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
          <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
          <button onClick={() => onUpdateAlt(altText)}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800">{t('save')}</button>
        </div>

        {!isVideo && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">{t('resizeImage')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onResize('small')} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">{t('small')} (150px)</button>
              <button onClick={() => onResize('normal')} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">{t('normal')} (400px)</button>
              <button onClick={() => onResize('medium')} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">{t('medium')} (800px)</button>
              <button onClick={() => onResize('large')} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">{t('large')} (1200px)</button>
            </div>
            <div className="mt-2 flex gap-2">
              <input type="number" placeholder="W" value={customW} onChange={(e) => setCustomW(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
              <span className="text-gray-400 self-center">×</span>
              <input type="number" placeholder="H" value={customH} onChange={(e) => setCustomH(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
              <button onClick={() => onResizeCustom(customW, customH)}
                disabled={!customW && !customH}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">{t('resize')}</button>
            </div>
          </div>
        )}

        {media.variants && media.variants.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('variants')}</label>
            <div className="space-y-1">
              {media.variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-1.5 rounded">
                  <span>{v.preset || 'custom'} - {v.width}×{v.height}</span>
                  <a href={v.path} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Open</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button onClick={() => navigator.clipboard.writeText(window.location.origin + media.path).then(() => toast.success('Copied!'))}
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors">{t('copyUrl')}</button>
          <button onClick={onDelete}
            className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors">{t('delete')}</button>
        </div>
      </div>
    </div>
  );
}
